import os
import sys
import logging
from datetime import datetime
import psycopg2
from dotenv import load_dotenv
from collections import defaultdict

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

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

def check_behavior_students(pg_conn):
    """Vérifie la correspondance des étudiants dans behavior_records"""
    cur = None
    try:
        cur = pg_conn.cursor()

        # Récupérer tous les étudiants uniques de behavior_records
        cur.execute("""
            SELECT DISTINCT student_id
            FROM education.behavior_records
        """)
        behavior_students = [row[0] for row in cur.fetchall()]
        total_behavior_students = len(behavior_students)
        logger.info(f"Nombre total d'étudiants dans behavior_records: {total_behavior_students}")

        # Vérifier chaque étudiant
        found_students = set()
        not_found_students = set()
        student_usage = defaultdict(int)

        for student_id in behavior_students:
            cur.execute("""
                SELECT id FROM education.users
                WHERE id = %s
            """, (student_id,))
            student = cur.fetchone()

            if student:
                found_students.add(student_id)
            else:
                not_found_students.add(student_id)

            # Compter le nombre d'occurrences de chaque étudiant
            cur.execute("""
                SELECT COUNT(*)
                FROM education.behavior_records
                WHERE student_id = %s
            """, (student_id,))
            count = cur.fetchone()[0]
            student_usage[student_id] = count

        # Calculer les statistiques
        total_found = len(found_students)
        total_not_found = len(not_found_students)
        percentage = (total_found / total_behavior_students * 100) if total_behavior_students > 0 else 0

        # Afficher les statistiques
        logger.info("\nStatistiques de correspondance des étudiants:")
        logger.info(f"Nombre total d'étudiants dans behavior_records: {total_behavior_students}")
        logger.info(f"Nombre d'étudiants trouvés dans users: {total_found}")
        logger.info(f"Nombre d'étudiants non trouvés: {total_not_found}")
        logger.info(f"Pourcentage de correspondance: {percentage:.2f}%")

        if not_found_students:
            logger.info("\nÉtudiants non trouvés dans users:")
            for student_id in sorted(not_found_students):
                usage_count = student_usage[student_id]
                logger.info(f"- ID: {student_id} (utilisé dans {usage_count} records)")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        raise
    finally:
        if cur:
            cur.close()

def main():
    """Fonction principale"""
    try:
        logger.info("Connexion à PostgreSQL...")
        pg_conn = connect_supabase()

        logger.info("Début de la vérification des étudiants...")
        check_behavior_students(pg_conn)
        logger.info("Vérification terminée !")

    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        sys.exit(1)
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
