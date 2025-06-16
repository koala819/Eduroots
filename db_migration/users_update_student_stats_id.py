from dotenv import load_dotenv
load_dotenv()

import os
import logging
from datetime import datetime
import psycopg2
import traceback

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('update_user_stats_id.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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

def update_user_stats_id(pg_conn):
    """Met à jour le champ student_stats_id dans education.users"""
    try:
        cur = pg_conn.cursor()

        # Compter le nombre d'utilisateurs à mettre à jour
        cur.execute("""
            SELECT COUNT(*)
            FROM education.users u
            JOIN stats.student_stats ss ON u.id = ss.user_id
            WHERE u.student_stats_id IS NULL OR u.student_stats_id != ss.id
        """)
        count = cur.fetchone()[0]
        logger.info(f"Nombre d'utilisateurs à mettre à jour: {count}")

        # Mettre à jour les student_stats_id
        cur.execute("""
            UPDATE education.users u
            SET student_stats_id = ss.id
            FROM stats.student_stats ss
            WHERE u.id = ss.user_id
            AND (u.student_stats_id IS NULL OR u.student_stats_id != ss.id)
            RETURNING u.id, u.student_stats_id
        """)

        updated_users = cur.fetchall()

        if updated_users:
            logger.info(f"Nombre d'utilisateurs mis à jour: {len(updated_users)}")
            for user_id, stats_id in updated_users:
                logger.info(f"Utilisateur {user_id} mis à jour avec stats_id {stats_id}")
        else:
            logger.info("Aucun utilisateur à mettre à jour")

        pg_conn.commit()
        return True

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour: {str(e)}")
        logger.error(traceback.format_exc())
        return False
    finally:
        cur.close()

def verify_update(pg_conn):
    """Vérifie que la mise à jour s'est bien passée"""
    try:
        cur = pg_conn.cursor()

        # Vérifier les incohérences restantes
        cur.execute("""
            SELECT u.id as user_id, u.student_stats_id, ss.id as stats_id
            FROM education.users u
            JOIN stats.student_stats ss ON u.id = ss.user_id
            WHERE u.student_stats_id != ss.id
        """)

        remaining_errors = cur.fetchall()

        if remaining_errors:
            logger.error(f"Nombre d'incohérences restantes: {len(remaining_errors)}")
            for user_id, stats_id, correct_stats_id in remaining_errors:
                logger.error(f"Incohérence trouvée: user_id={user_id}, student_stats_id={stats_id}, correct_stats_id={correct_stats_id}")
            return False
        else:
            logger.info("Toutes les mises à jour sont cohérentes")
            return True

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        logger.error(traceback.format_exc())
        return False
    finally:
        cur.close()

def main():
    """Fonction principale"""
    try:
        # Connexion à Supabase
        pg_conn = connect_supabase()
        logger.info("Connexion à Supabase réussie")

        # Mettre à jour les student_stats_id
        if update_user_stats_id(pg_conn):
            logger.info("Mise à jour des student_stats_id terminée")

            # Vérifier la mise à jour
            if verify_update(pg_conn):
                logger.info("Vérification terminée avec succès - Toutes les données sont cohérentes")
            else:
                logger.error("Vérification terminée avec des erreurs - Voir le log pour plus de détails")
        else:
            logger.error("Erreur lors de la mise à jour - Voir le log pour plus de détails")

    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
