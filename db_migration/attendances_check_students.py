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

def check_students(mongo_db, pg_conn):
    """Vérifie la correspondance des étudiants entre MongoDB et Supabase"""
    cur = None
    try:
        # Récupérer toutes les présences de MongoDB
        attendances = list(mongo_db.attendancenews.find())
        total_attendances = len(attendances)
        logger.info(f"Nombre total de présences dans MongoDB: {total_attendances}")

        if total_attendances == 0:
            logger.warning("Aucune présence trouvée dans MongoDB")
            return

        # Récupérer tous les étudiants de Supabase
        cur = pg_conn.cursor()
        cur.execute("SELECT id, mongo_id FROM education.users")
        supabase_users = {str(row[1]): row[0] for row in cur.fetchall()}
        total_supabase_users = len(supabase_users)
        logger.info(f"Nombre total d'utilisateurs dans Supabase: {total_supabase_users}")

        # Collecter tous les IDs d'étudiants uniques de MongoDB
        mongo_student_ids = set()
        for attendance in attendances:
            for record in attendance.get('records', []):
                mongo_student_ids.add(str(record['student']))

        total_mongo_students = len(mongo_student_ids)
        logger.info(f"Nombre total d'étudiants uniques dans MongoDB: {total_mongo_students}")

        # Vérifier les correspondances
        found_students = set()
        not_found_students = set()
        student_usage = defaultdict(int)

        for attendance in attendances:
            for record in attendance.get('records', []):
                student_id = str(record['student'])
                student_usage[student_id] += 1

                if student_id in supabase_users:
                    found_students.add(student_id)
                else:
                    not_found_students.add(student_id)

        # Calculer les statistiques
        total_found = len(found_students)
        total_not_found = len(not_found_students)
        percentage = (total_found / total_mongo_students * 100) if total_mongo_students > 0 else 0

        # Afficher les statistiques
        logger.info("\nStatistiques de correspondance des étudiants:")
        logger.info(f"Nombre total d'étudiants uniques dans MongoDB: {total_mongo_students}")
        logger.info(f"Nombre d'étudiants trouvés dans Supabase: {total_found}")
        logger.info(f"Nombre d'étudiants non trouvés: {total_not_found}")
        logger.info(f"Pourcentage de correspondance: {percentage:.2f}%")

        if not_found_students:
            logger.info("\nÉtudiants non trouvés dans Supabase:")
            for student_id in sorted(not_found_students):
                usage_count = student_usage[student_id]
                logger.info(f"- MongoDB ID: {student_id} (utilisé dans {usage_count} présences)")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
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

        logger.info("Début de la vérification des étudiants...")
        check_students(mongo_db, pg_conn)
        logger.info("Vérification terminée !")

    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        sys.exit(1)
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
