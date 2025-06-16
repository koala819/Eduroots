import os
import sys
import logging
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

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

def update_student_ids(pg_conn):
    """Met à jour les student_id dans grades_records"""
    try:
        cur = pg_conn.cursor()

        # Vérifier le nombre total de records
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records
        """)
        total_records = cur.fetchone()[0]
        logger.info(f"Nombre total de records dans grades_records: {total_records}")

        # Vérifier le nombre de records sans student_id
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records
            WHERE student_id IS NULL
        """)
        records_to_update = cur.fetchone()[0]
        logger.info(f"Nombre de records à mettre à jour: {records_to_update}")

        # Mise à jour des student_id
        cur.execute("""
            UPDATE education.grades_records gr
            SET student_id = u.id
            FROM education.users u
            WHERE gr.mongo_student_id = u.mongo_id
            AND gr.student_id IS NULL
            RETURNING gr.id
        """)

        updated_records = cur.fetchall()
        total_updated = len(updated_records)

        pg_conn.commit()
        logger.info(f"Nombre de records mis à jour: {total_updated}")

        # Vérification finale
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records
            WHERE student_id IS NULL
        """)
        remaining_null = cur.fetchone()[0]
        logger.info(f"Nombre de records restants sans student_id: {remaining_null}")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour: {str(e)}")
        raise
    finally:
        cur.close()

def main():
    """Fonction principale"""
    try:
        logger.info("Connexion à PostgreSQL...")
        pg_conn = connect_supabase()

        logger.info("Mise à jour des student_id...")
        update_student_ids(pg_conn)
        logger.info("Mise à jour terminée !")

    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        sys.exit(1)
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
