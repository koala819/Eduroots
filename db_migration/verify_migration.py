import os
import json
import logging
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import psycopg2
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def connect_mongodb():
    """Connexion à MongoDB"""
    try:
        mongo_uri = os.getenv('MONGODB_URI')
        if not mongo_uri:
            raise ValueError("MONGODB_URI non définie")

        client = MongoClient(mongo_uri)
        db = client['cours-a-la-mosquee']
        return db
    except Exception as e:
        logger.error(f"Erreur de connexion à MongoDB: {str(e)}")
        raise

def connect_supabase():
    """Connexion à Supabase"""
    try:
        supabase_conn_string = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        if not supabase_conn_string:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL non définie")

        logger.info(f"String de connexion Supabase: {supabase_conn_string}")
        pg_conn = psycopg2.connect(supabase_conn_string)
        logger.info("Connexion à Supabase réussie")
        return pg_conn
    except Exception as e:
        logger.error(f"Erreur de connexion à Supabase: {str(e)}")
        raise

def get_mongo_course(db, mongo_id):
    """Récupère un cours depuis MongoDB"""
    try:
        course = db.coursenews.find_one({'_id': ObjectId(mongo_id)})
        if not course:
            logger.error(f"Cours non trouvé dans MongoDB: {mongo_id}")
            return None
        return course
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du cours MongoDB: {str(e)}")
        return None

def get_supabase_course(pg_conn, mongo_id):
    """Récupère un cours et ses données associées depuis Supabase"""
    try:
        cur = pg_conn.cursor()

        # Récupérer le cours
        cur.execute("""
            SELECT id, mongo_id, academic_year, is_active, created_at
            FROM education.tmp_courses
            WHERE mongo_id = %s
        """, (mongo_id,))
        course = cur.fetchone()

        if not course:
            logger.error(f"Cours non trouvé dans Supabase: {mongo_id}")
            return None

        result = {
            'id': course[0],
            'mongo_id': course[1],
            'academic_year': course[2],
            'is_active': course[3],
            'created_at': course[4],
            'teachers': [],
            'sessions': []
        }

        # Récupérer les enseignants
        cur.execute("""
            SELECT mongo_teacher_id
            FROM education.tmp_courses_teacher
            WHERE course_id = %s
        """, (course[0],))
        teachers = cur.fetchall()
        result['teachers'] = [t[0] for t in teachers]

        # Récupérer les sessions
        cur.execute("""
            SELECT id, mongo_id, subject, level,
                   stats_average_attendance, stats_average_grade,
                   stats_average_behavior, stats_last_updated
            FROM education.tmp_courses_sessions
            WHERE course_id = %s
        """, (course[0],))
        sessions = cur.fetchall()

        for session in sessions:
            session_data = {
                'id': session[0],
                'mongo_id': session[1],
                'subject': session[2],
                'level': session[3],
                'stats': {
                    'averageAttendance': session[4],
                    'averageGrade': session[5],
                    'averageBehavior': session[6],
                    'lastUpdated': session[7]
                },
                'timeSlot': None,
                'students': []
            }

            # Récupérer le créneau horaire
            cur.execute("""
                SELECT day_of_week, start_time, end_time, classroom_number
                FROM education.tmp_courses_sessions_timeslot
                WHERE course_sessions_id = %s
            """, (session[0],))
            timeslot = cur.fetchone()
            if timeslot:
                session_data['timeSlot'] = {
                    'dayOfWeek': timeslot[0],
                    'startTime': timeslot[1],
                    'endTime': timeslot[2],
                    'classroomNumber': timeslot[3]
                }

            # Récupérer les étudiants
            cur.execute("""
                SELECT mongo_student_id
                FROM education.tmp_courses_sessions_students
                WHERE course_sessions_id = %s
            """, (session[0],))
            students = cur.fetchall()
            session_data['students'] = [s[0] for s in students]

            result['sessions'].append(session_data)

        cur.close()
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du cours Supabase: {str(e)}")
        return None

def compare_courses(mongo_course, supabase_course):
    """Compare les données entre MongoDB et Supabase"""
    try:
        differences = []

        # Vérifier les champs de base
        if str(mongo_course['_id']) != supabase_course['mongo_id']:
            differences.append(f"ID MongoDB différent: {mongo_course['_id']} vs {supabase_course['mongo_id']}")

        if mongo_course.get('academicYear') != supabase_course['academic_year']:
            differences.append(f"Année académique différente: {mongo_course.get('academicYear')} vs {supabase_course['academic_year']}")

        if mongo_course.get('isActive') != supabase_course['is_active']:
            differences.append(f"Statut actif différent: {mongo_course.get('isActive')} vs {supabase_course['is_active']}")

        # Vérifier les enseignants
        mongo_teachers = [str(t) for t in mongo_course.get('teacher', [])]
        if set(mongo_teachers) != set(supabase_course['teachers']):
            differences.append(f"Enseignants différents: {mongo_teachers} vs {supabase_course['teachers']}")

        # Vérifier les sessions
        if len(mongo_course.get('sessions', [])) != len(supabase_course['sessions']):
            differences.append(f"Nombre de sessions différent: {len(mongo_course.get('sessions', []))} vs {len(supabase_course['sessions'])}")
        else:
            for i, (mongo_session, supabase_session) in enumerate(zip(mongo_course.get('sessions', []), supabase_course['sessions'])):
                # Vérifier les champs de base de la session
                if str(mongo_session['_id']) != supabase_session['mongo_id']:
                    differences.append(f"Session {i}: ID MongoDB différent: {mongo_session['_id']} vs {supabase_session['mongo_id']}")

                if mongo_session.get('subject') != supabase_session['subject']:
                    differences.append(f"Session {i}: Matière différente: {mongo_session.get('subject')} vs {supabase_session['subject']}")

                if mongo_session.get('level') != supabase_session['level']:
                    differences.append(f"Session {i}: Niveau différent: {mongo_session.get('level')} vs {supabase_session['level']}")

                # Vérifier les statistiques
                mongo_stats = mongo_session.get('stats', {})
                supabase_stats = supabase_session['stats']

                # Comparer les nombres décimaux avec une tolérance
                def compare_decimal(mongo_val, supabase_val, field_name):
                    if mongo_val is None and supabase_val is None:
                        return True
                    if mongo_val is None or supabase_val is None:
                        return False
                    return abs(float(mongo_val) - float(supabase_val)) < 0.001

                if not compare_decimal(mongo_stats.get('averageAttendance'), supabase_stats['averageAttendance'], 'assiduité'):
                    differences.append(f"Session {i}: Moyenne d'assiduité différente: {mongo_stats.get('averageAttendance')} vs {supabase_stats['averageAttendance']}")

                if not compare_decimal(mongo_stats.get('averageGrade'), supabase_stats['averageGrade'], 'notes'):
                    differences.append(f"Session {i}: Moyenne des notes différente: {mongo_stats.get('averageGrade')} vs {supabase_stats['averageGrade']}")

                if not compare_decimal(mongo_stats.get('averageBehavior'), supabase_stats['averageBehavior'], 'comportement'):
                    differences.append(f"Session {i}: Moyenne du comportement différente: {mongo_stats.get('averageBehavior')} vs {supabase_stats['averageBehavior']}")

                # Vérifier le créneau horaire
                mongo_timeslot = mongo_session.get('timeSlot', {})
                supabase_timeslot = supabase_session['timeSlot']
                if mongo_timeslot and supabase_timeslot:
                    if mongo_timeslot.get('dayOfWeek') != supabase_timeslot['dayOfWeek']:
                        differences.append(f"Session {i}: Jour de la semaine différent: {mongo_timeslot.get('dayOfWeek')} vs {supabase_timeslot['dayOfWeek']}")

                    if mongo_timeslot.get('startTime') != supabase_timeslot['startTime']:
                        differences.append(f"Session {i}: Heure de début différente: {mongo_timeslot.get('startTime')} vs {supabase_timeslot['startTime']}")

                    if mongo_timeslot.get('endTime') != supabase_timeslot['endTime']:
                        differences.append(f"Session {i}: Heure de fin différente: {mongo_timeslot.get('endTime')} vs {supabase_timeslot['endTime']}")

                    # Comparer les numéros de salle comme des nombres
                    mongo_classroom = mongo_timeslot.get('classroomNumber')
                    supabase_classroom = supabase_timeslot['classroomNumber']
                    if str(mongo_classroom) != str(supabase_classroom):
                        differences.append(f"Session {i}: Numéro de salle différent: {mongo_classroom} vs {supabase_classroom}")

                # Vérifier les étudiants
                mongo_students = [str(s) for s in mongo_session.get('students', [])]
                if set(mongo_students) != set(supabase_session['students']):
                    differences.append(f"Session {i}: Étudiants différents: {mongo_students} vs {supabase_session['students']}")

        return differences
    except Exception as e:
        logger.error(f"Erreur lors de la comparaison des cours: {str(e)}")
        return [f"Erreur lors de la comparaison: {str(e)}"]

def main():
    """Fonction principale"""
    try:
        # Charger les variables d'environnement
        load_dotenv()

        # Connexion à MongoDB
        logger.info("Connexion à MongoDB...")
        db = connect_mongodb()

        # Connexion à Supabase
        logger.info("Connexion à Supabase...")
        pg_conn = connect_supabase()

        # ID du cours à vérifier (celui qui a été migré)
        mongo_id = "6733728d9c906b85f3705d5e"

        # Récupérer les données
        logger.info(f"Récupération du cours {mongo_id} depuis MongoDB...")
        mongo_course = get_mongo_course(db, mongo_id)

        logger.info(f"Récupération du cours {mongo_id} depuis Supabase...")
        supabase_course = get_supabase_course(pg_conn, mongo_id)

        if not mongo_course or not supabase_course:
            logger.error("Impossible de récupérer les données pour la comparaison")
            return

        # Comparer les données
        logger.info("Comparaison des données...")
        differences = compare_courses(mongo_course, supabase_course)

        if differences:
            logger.warning("Différences trouvées:")
            for diff in differences:
                logger.warning(f"- {diff}")
        else:
            logger.info("Aucune différence trouvée ! La migration est parfaite !")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
