import os
import sys
import logging
from datetime import datetime
import psycopg2
from dotenv import load_dotenv
from pymongo import MongoClient
from collections import defaultdict

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

def connect_mongodb():
    """Connexion à MongoDB"""
    try:
        mongo_uri = os.getenv('MONGODB_URI')
        if not mongo_uri:
            raise ValueError("MONGODB_URI non définie")

        client = MongoClient(mongo_uri)
        db = client.get_database('cours-a-la-mosquee')
        logger.info("Connexion à MongoDB réussie")
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

def migrate_attendances(mongo_db, pg_conn):
    """Migration des présences de MongoDB vers Supabase"""
    cur = None
    try:
        # Récupérer toutes les présences de MongoDB
        attendances = list(mongo_db.attendancenews.find())
        total_attendances = len(attendances)
        logger.info(f"Nombre total de présences à migrer: {total_attendances}")

        if total_attendances == 0:
            logger.warning("Aucune présence trouvée dans MongoDB")
            return

        # Récupérer tous les étudiants de Supabase
        cur = pg_conn.cursor()
        cur.execute("SELECT id, mongo_id FROM education.users")
        supabase_users = {str(row[1]): row[0] for row in cur.fetchall()}

        migrated_count = 0
        error_count = 0
        records_migrated = 0
        records_error = 0
        missing_students = defaultdict(int)

        for attendance in attendances:
            try:
                # Trouver l'ID Supabase de la session
                cur.execute("""
                    SELECT cs.id, c.id as course_id
                    FROM education.courses_sessions cs
                    JOIN education.courses c ON c.id = cs.course_id
                    WHERE cs.course_session_mongo_id = %s
                """, (str(attendance['course']),))
                session = cur.fetchone()

                if not session:
                    logger.warning(f"Session non trouvée pour l'attendance {attendance['_id']}")
                    error_count += 1
                    continue

                session_id, course_id = session

                # Calculer le taux de présence
                records = attendance.get('records', [])
                total_students = len(records)
                present_count = sum(1 for r in records if r.get('isPresent', False))
                presence_rate = (present_count / total_students * 100) if total_students > 0 else 0

                # Insérer l'attendance
                cur.execute("""
                    INSERT INTO education.attendances
                    (course_id, date, presence_rate, total_students, last_update, created_at, updated_at, is_active, deleted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    course_id,
                    attendance['date'],
                    presence_rate,
                    total_students,
                    attendance.get('updatedAt', datetime.now()),
                    attendance.get('createdAt', datetime.now()),
                    attendance.get('updatedAt', datetime.now()),
                    True,  # is_active
                    None   # deleted_at
                ))
                attendance_id = cur.fetchone()[0]

                # Insérer les records de présence
                for record in records:
                    try:
                        student_mongo_id = str(record['student'])
                        if student_mongo_id not in supabase_users:
                            missing_students[student_mongo_id] += 1
                            records_error += 1
                            continue

                        cur.execute("""
                            INSERT INTO education.attendance_records
                            (attendance_id, student_id, is_present, comment, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (
                            attendance_id,
                            supabase_users[student_mongo_id],
                            record.get('isPresent', False),
                            record.get('comment', None),
                            record.get('createdAt', datetime.now()),
                            record.get('updatedAt', datetime.now())
                        ))
                        records_migrated += 1

                    except Exception as e:
                        logger.error(f"Erreur lors de la migration du record {record['_id']}: {str(e)}")
                        records_error += 1
                        continue

                migrated_count += 1
                if migrated_count % 100 == 0:
                    logger.info(f"Progression: {migrated_count}/{total_attendances}")

            except Exception as e:
                logger.error(f"Erreur lors de la migration de l'attendance {attendance['_id']}: {str(e)}")
                error_count += 1
                continue

        pg_conn.commit()
        logger.info("\nStatistiques de migration:")
        logger.info(f"Présences migrées avec succès: {migrated_count}/{total_attendances}")
        logger.info(f"Erreurs de migration des présences: {error_count}")
        logger.info(f"Records de présence migrés avec succès: {records_migrated}")
        logger.info(f"Erreurs de migration des records: {records_error}")

        if missing_students:
            logger.info("\nÉtudiants non trouvés dans Supabase:")
            for student_id, count in sorted(missing_students.items()):
                logger.info(f"- MongoDB ID: {student_id} (utilisé dans {count} présences)")

    except Exception as e:
        if pg_conn:
            pg_conn.rollback()
        logger.error(f"Erreur lors de la migration: {str(e)}")
        raise
    finally:
        if cur:
            cur.close()

def main():
    """Fonction principale"""
    try:
        logger.info("Connexion à MongoDB...")
        mongo_db = connect_mongodb()

        logger.info("Connexion à PostgreSQL...")
        pg_conn = connect_supabase()

        logger.info("Début de la migration des présences...")
        migrate_attendances(mongo_db, pg_conn)
        logger.info("Migration terminée !")

    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        sys.exit(1)
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
