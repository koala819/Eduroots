from dotenv import load_dotenv
load_dotenv()

import os
import json
import logging
from datetime import datetime
from pymongo import MongoClient
import psycopg2
from psycopg2.extras import Json
import uuid
import traceback
from bson.objectid import ObjectId

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration_all_courses.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def connect_mongodb():
    """Connexion à MongoDB"""
    try:
        mongo_uri = os.getenv('MONGODB_URI')
        if not mongo_uri:
            raise ValueError("MONGODB_URI non définie")

        logger.info(f"URI MongoDB: {mongo_uri.split('@')[1]}")
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

def drop_tables(pg_conn):
    """Supprime toutes les tables"""
    try:
        cur = pg_conn.cursor()

        # Liste des tables à supprimer dans l'ordre (pour respecter les contraintes de clés étrangères)
        tables = [
            'courses_sessions_students',
            'courses_sessions_timeslot',
            'courses_sessions',
            'courses_teacher',
            'courses'
        ]

        for table in tables:
            cur.execute(f"DROP TABLE IF EXISTS education.{table} CASCADE")
            logger.info(f"Table education.{table} supprimée")

        pg_conn.commit()
        logger.info("Toutes les tables ont été supprimées")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la suppression des tables: {str(e)}")
        raise
    finally:
        cur.close()

def create_tables(pg_conn):
    """Crée les tables dans Supabase"""
    try:
        cur = pg_conn.cursor()

        # Table des cours
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.courses (
                id UUID PRIMARY KEY,
                mongo_id TEXT NOT NULL UNIQUE,
                academic_year INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table des sessions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.courses_sessions (
                id UUID PRIMARY KEY,
                course_id UUID REFERENCES education.courses(id),
                mongo_id TEXT NOT NULL UNIQUE,
                course_session_mongo_id TEXT NOT NULL,
                subject TEXT NOT NULL,
                level TEXT NOT NULL,
                stats_average_attendance DECIMAL,
                stats_average_grade DECIMAL,
                stats_average_behavior DECIMAL,
                stats_last_updated TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table des créneaux horaires
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.courses_sessions_timeslot (
                id UUID PRIMARY KEY,
                course_sessions_id UUID REFERENCES education.courses_sessions(id),
                day_of_week TEXT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                classroom_number TEXT,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table des étudiants des sessions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.courses_sessions_students (
                id UUID PRIMARY KEY,
                course_sessions_id UUID REFERENCES education.courses_sessions(id),
                mongo_student_id TEXT NOT NULL,
                student_id UUID REFERENCES education.users(id),
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table des enseignants
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.courses_teacher (
                id UUID PRIMARY KEY,
                course_id UUID REFERENCES education.courses(id),
                mongo_teacher_id TEXT NOT NULL,
                teacher_id UUID REFERENCES education.users(id),
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        pg_conn.commit()
        logger.info("Tables créées avec succès")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la création des tables: {str(e)}")
        raise
    finally:
        cur.close()

def get_mongo_courses(db):
    """Récupère tous les cours depuis MongoDB"""
    try:
        # Vérifier que la collection existe
        if 'coursenews' not in db.list_collection_names():
            raise ValueError("La collection 'coursenews' n'existe pas dans MongoDB")

        courses = list(db.coursenews.find())
        if not courses:
            logger.warning("Aucun cours trouvé dans MongoDB")
            return []

        logger.info(f"Nombre de cours trouvés dans MongoDB: {len(courses)}")
        return courses
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des cours MongoDB: {str(e)}")
        raise

def convert_level(level):
    """Convertit le niveau en entier"""
    if isinstance(level, int):
        return level
    if isinstance(level, str):
        # Si c'est un format comme "0-2", on prend la première valeur
        if '-' in level:
            return int(level.split('-')[0])
        try:
            return int(level)
        except ValueError:
            return 0
    return 0

def migrate_course(pg_conn, mongo_course):
    """Migre un cours de MongoDB vers Supabase"""
    try:
        cur = pg_conn.cursor()

        # Vérifier que le cours n'existe pas déjà
        cur.execute("""
            SELECT id FROM education.courses
            WHERE mongo_id = %s
        """, (str(mongo_course['_id']),))

        if cur.fetchone():
            logger.warning(f"Le cours {mongo_course['_id']} existe déjà dans Supabase, il sera ignoré")
            return

        # Vérifier les champs obligatoires
        if 'academicYear' not in mongo_course:
            logger.warning(f"Le cours {mongo_course['_id']} n'a pas d'année académique, utilisation de l'année courante")
            mongo_course['academicYear'] = datetime.now().year

        # Insérer le cours
        cur.execute("""
            INSERT INTO education.courses (
                id,
                mongo_id,
                academic_year,
                is_active,
                created_at
            ) VALUES (
                gen_random_uuid(),
                %s,
                %s,
                %s,
                %s
            ) RETURNING id
        """, (
            str(mongo_course['_id']),
            mongo_course.get('academicYear'),
            mongo_course.get('isActive', True),
            mongo_course.get('createdAt', datetime.now())
        ))
        course_id = cur.fetchone()[0]

        # Insérer les enseignants
        for teacher_id in mongo_course.get('teacher', []):
            if not teacher_id:
                logger.warning(f"ID enseignant vide trouvé dans le cours {mongo_course['_id']}")
                continue

            cur.execute("""
                INSERT INTO education.courses_teacher (
                    id,
                    course_id,
                    mongo_teacher_id,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s
                )
            """, (
                course_id,
                str(teacher_id),
                mongo_course.get('createdAt', datetime.now())
            ))

        # Insérer les sessions
        for session in mongo_course.get('sessions', []):
            if not session.get('_id'):
                logger.warning(f"Session sans ID trouvée dans le cours {mongo_course['_id']}")
                continue

            cur.execute("""
                INSERT INTO education.courses_sessions (
                    id,
                    course_id,
                    mongo_id,
                    course_session_mongo_id,
                    subject,
                    level,
                    stats_average_attendance,
                    stats_average_grade,
                    stats_average_behavior,
                    stats_last_updated,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                ) RETURNING id
            """, (
                course_id,
                str(session['_id']),
                str(session['_id']),
                session.get('subject', ''),
                str(session.get('level', '')),
                session.get('stats', {}).get('averageAttendance'),
                session.get('stats', {}).get('averageGrade'),
                session.get('stats', {}).get('averageBehavior'),
                session.get('stats', {}).get('lastUpdated'),
                mongo_course.get('createdAt', datetime.now())
            ))
            session_id = cur.fetchone()[0]

            # Insérer le créneau horaire
            if 'timeSlot' in session:
                cur.execute("""
                    INSERT INTO education.courses_sessions_timeslot (
                        id,
                        course_sessions_id,
                        day_of_week,
                        start_time,
                        end_time,
                        classroom_number,
                        created_at
                    ) VALUES (
                        gen_random_uuid(),
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                """, (
                    session_id,
                    session['timeSlot'].get('dayOfWeek', ''),
                    session['timeSlot'].get('startTime'),
                    session['timeSlot'].get('endTime'),
                    session['timeSlot'].get('classroomNumber', ''),
                    mongo_course.get('createdAt', datetime.now())
                ))

            # Insérer les étudiants
            for student_id in session.get('students', []):
                if not student_id:
                    logger.warning(f"ID étudiant vide trouvé dans la session {session['_id']}")
                    continue

                cur.execute("""
                    INSERT INTO education.courses_sessions_students (
                        id,
                        course_sessions_id,
                        mongo_student_id,
                        created_at
                    ) VALUES (
                        gen_random_uuid(),
                        %s,
                        %s,
                        %s
                    )
                """, (
                    session_id,
                    str(student_id),
                    mongo_course.get('createdAt', datetime.now())
                ))

        pg_conn.commit()
        logger.info(f"Migration réussie pour le cours {mongo_course['_id']}")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la migration du cours {mongo_course['_id']}: {str(e)}")
        raise
    finally:
        cur.close()

def load_id_mapping():
    """Charge le mapping des IDs depuis le fichier JSON"""
    try:
        mapping_file = './mongo_to_supabase_ids.json'
        if not os.path.exists(mapping_file):
            raise FileNotFoundError(f"Le fichier {mapping_file} n'existe pas")

        with open(mapping_file, 'r') as f:
            data = json.load(f)

        # Créer un mapping direct mongo_id -> supabase_id
        mapping = {}
        for user_data in data.values():
            mongo_id = user_data.get('mongo_id')
            supabase_id = user_data.get('supabase_id')
            if mongo_id and supabase_id:
                mapping[mongo_id] = supabase_id

        if not mapping:
            raise ValueError("Aucun mapping valide trouvé dans le fichier JSON")

        logger.info(f"Mapping chargé: {len(mapping)} entrées")
        return mapping
    except Exception as e:
        logger.error(f"Erreur lors du chargement du mapping: {str(e)}")
        raise

def update_teacher_ids(pg_conn, id_mapping):
    """Met à jour les teacher_id en utilisant le mapping"""
    try:
        cur = pg_conn.cursor()

        # Récupérer tous les enregistrements
        cur.execute("""
            SELECT id, mongo_teacher_id
            FROM education.courses_teacher
            WHERE teacher_id IS NULL
        """)
        records = cur.fetchall()

        updated_count = 0
        not_found_ids = set()  # Pour stocker les IDs uniques non trouvés

        for record in records:
            record_id, mongo_teacher_id = record

            # Chercher l'ID Supabase correspondant
            if mongo_teacher_id in id_mapping:
                supabase_id = id_mapping[mongo_teacher_id]

                # Mettre à jour l'enregistrement
                cur.execute("""
                    UPDATE education.courses_teacher
                    SET teacher_id = %s
                    WHERE id = %s
                """, (supabase_id, record_id))

                updated_count += 1
            else:
                not_found_ids.add(mongo_teacher_id)

        pg_conn.commit()
        logger.info(f"Mise à jour des teacher_id terminée:")
        logger.info(f"- {updated_count} enregistrements mis à jour")

        if not_found_ids:
            logger.warning(f"IDs MongoDB non trouvés dans le mapping ({len(not_found_ids)} IDs uniques):")
            for mongo_id in sorted(not_found_ids):
                logger.warning(f"  - {mongo_id}")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour des teacher_id: {str(e)}")
        raise
    finally:
        cur.close()

def update_student_ids(pg_conn, id_mapping):
    """Met à jour les student_id en utilisant le mapping"""
    try:
        cur = pg_conn.cursor()

        # Récupérer tous les enregistrements
        cur.execute("""
            SELECT id, mongo_student_id
            FROM education.courses_sessions_students
            WHERE student_id IS NULL
        """)
        records = cur.fetchall()

        updated_count = 0
        not_found_ids = set()  # Pour stocker les IDs uniques non trouvés

        for record in records:
            record_id, mongo_student_id = record

            # Chercher l'ID Supabase correspondant
            if mongo_student_id in id_mapping:
                supabase_id = id_mapping[mongo_student_id]

                # Mettre à jour l'enregistrement
                cur.execute("""
                    UPDATE education.courses_sessions_students
                    SET student_id = %s
                    WHERE id = %s
                """, (supabase_id, record_id))

                updated_count += 1
            else:
                not_found_ids.add(mongo_student_id)

        pg_conn.commit()
        logger.info(f"Mise à jour des student_id terminée:")
        logger.info(f"- {updated_count} enregistrements mis à jour")

        if not_found_ids:
            logger.warning(f"IDs MongoDB non trouvés dans le mapping ({len(not_found_ids)} IDs uniques):")
            for mongo_id in sorted(not_found_ids):
                logger.warning(f"  - {mongo_id}")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour des student_id: {str(e)}")
        raise
    finally:
        cur.close()

def verify_migration(pg_conn, mongo_db):
    """Vérifie que la migration s'est bien passée"""
    try:
        cur = pg_conn.cursor()

        # Récupérer tous les cours migrés
        cur.execute("""
            SELECT id, mongo_id, academic_year, is_active
            FROM education.courses
        """)
        migrated_courses = cur.fetchall()

        logger.info(f"Vérification de {len(migrated_courses)} cours migrés...")

        # Vérifier d'abord que la collection existe et contient des données
        collection_names = mongo_db.list_collection_names()
        logger.info(f"Collections MongoDB disponibles: {collection_names}")

        if 'coursenews' not in collection_names:
            raise ValueError("La collection 'coursenews' n'existe pas dans MongoDB")

        # Compter le nombre de documents dans la collection
        count = mongo_db.coursenews.count_documents({})
        logger.info(f"Nombre de documents dans la collection coursenews: {count}")

        for course in migrated_courses:
            supabase_id, mongo_id, academic_year, is_active = course
            logger.info(f"Vérification du cours {mongo_id}...")

            # Récupérer le cours MongoDB
            mongo_course = mongo_db.coursenews.find_one({'_id': ObjectId(mongo_id)})
            if not mongo_course:
                logger.error(f"Cours MongoDB {mongo_id} non trouvé")
                # Afficher quelques documents de la collection pour debug
                sample = list(mongo_db.coursenews.find().limit(1))
                if sample:
                    logger.info(f"Exemple de document dans la collection: {sample[0]}")
                continue

            # Vérifier les champs de base
            if str(mongo_course.get('academicYear')) != str(academic_year):
                logger.error(f"Différence d'année académique pour le cours {mongo_id}")
            if mongo_course.get('isActive') != is_active:
                logger.error(f"Différence de statut actif pour le cours {mongo_id}")

            # Vérifier les enseignants
            cur.execute("""
                SELECT mongo_teacher_id, teacher_id
                FROM education.courses_teacher
                WHERE course_id = %s
            """, (supabase_id,))
            supabase_teachers = cur.fetchall()

            mongo_teachers = [str(t) for t in mongo_course.get('teacher', [])]
            supabase_teacher_ids = [t[0] for t in supabase_teachers]

            if set(mongo_teachers) != set(supabase_teacher_ids):
                logger.error(f"Différence dans les enseignants pour le cours {mongo_id}")

            # Vérifier les sessions
            cur.execute("""
                SELECT id, mongo_id, course_session_mongo_id, subject, level
                FROM education.courses_sessions
                WHERE course_id = %s
            """, (supabase_id,))
            supabase_sessions = cur.fetchall()

            mongo_sessions = {str(s['_id']): s for s in mongo_course.get('sessions', [])}

            for session in supabase_sessions:
                supabase_session_id, mongo_id, course_session_mongo_id, subject, level = session

                if course_session_mongo_id not in mongo_sessions:
                    logger.error(f"Session {course_session_mongo_id} non trouvée dans MongoDB")
                    continue

                mongo_session = mongo_sessions[course_session_mongo_id]

                # Vérifier les champs de la session
                if mongo_session.get('subject') != subject:
                    logger.error(f"Différence de sujet pour la session {course_session_mongo_id}")
                if mongo_session.get('level') != level:
                    logger.error(f"Différence de niveau pour la session {course_session_mongo_id}")

                # Vérifier les créneaux horaires
                cur.execute("""
                    SELECT day_of_week, start_time, end_time, classroom_number
                    FROM education.courses_sessions_timeslot
                    WHERE course_sessions_id = %s
                """, (supabase_session_id,))
                supabase_timeslot = cur.fetchone()

                mongo_timeslot = mongo_session.get('timeSlot', {})

                if supabase_timeslot:
                    day_of_week, start_time, end_time, classroom_number = supabase_timeslot

                    if mongo_timeslot.get('dayOfWeek') != day_of_week:
                        logger.error(f"Différence de jour pour la session {course_session_mongo_id}")
                    if str(mongo_timeslot.get('classroomNumber')) != str(classroom_number):
                        logger.error(f"Différence de salle pour la session {course_session_mongo_id}")

                # Vérifier les étudiants
                cur.execute("""
                    SELECT mongo_student_id, student_id
                    FROM education.courses_sessions_students
                    WHERE course_sessions_id = %s
                """, (supabase_session_id,))
                supabase_students = cur.fetchall()

                mongo_students = [str(s) for s in mongo_session.get('students', [])]
                supabase_student_ids = [s[0] for s in supabase_students]

                if set(mongo_students) != set(supabase_student_ids):
                    logger.error(f"Différence dans les étudiants pour la session {course_session_mongo_id}")

        logger.info("Vérification terminée")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        raise
    finally:
        cur.close()

def main():
    try:
        # Connexion à MongoDB
        logger.info("Connexion à MongoDB...")
        db = connect_mongodb()

        # Connexion à Supabase
        logger.info("Connexion à Supabase...")
        pg_conn = connect_supabase()

        # Supprimer les tables existantes
        logger.info("Suppression des tables existantes...")
        drop_tables(pg_conn)

        # Créer les nouvelles tables
        logger.info("Création des nouvelles tables...")
        create_tables(pg_conn)

        # Récupérer tous les cours de MongoDB
        logger.info("Récupération des cours depuis MongoDB...")
        mongo_courses = get_mongo_courses(db)

        # Migrer chaque cours
        logger.info(f"Début de la migration de {len(mongo_courses)} cours...")
        for i, course in enumerate(mongo_courses, 1):
            logger.info(f"Migration du cours {i}/{len(mongo_courses)} (ID: {course['_id']})")
            migrate_course(pg_conn, course)

        # Charger le mapping des IDs
        logger.info("Chargement du mapping des IDs...")
        id_mapping = load_id_mapping()

        # Mettre à jour les IDs des enseignants
        logger.info("Mise à jour des IDs des enseignants...")
        update_teacher_ids(pg_conn, id_mapping)

        # Mettre à jour les IDs des étudiants
        logger.info("Mise à jour des IDs des étudiants...")
        update_student_ids(pg_conn, id_mapping)

        # Vérifier la migration
        logger.info("Vérification de la migration...")
        verify_migration(pg_conn, db)

        logger.info("Migration terminée avec succès !")

    except Exception as e:
        logger.error(f"Erreur lors de l'exécution: {str(e)}")
        logger.error(f"Traceback complet: {traceback.format_exc()}")
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
