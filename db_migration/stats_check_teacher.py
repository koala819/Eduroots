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
        logging.FileHandler('check_teacher_stats.log'),
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

def check_teacher_stats_consistency(pg_conn):
    """Vérifie la cohérence entre education.users et stats.teacher_stats"""
    try:
        cur = pg_conn.cursor()

        # Trouver les user_id dans stats.teacher_stats qui n'existent pas dans education.users
        cur.execute("""
            SELECT ts.user_id, ts.id as stats_id
            FROM stats.teacher_stats ts
            LEFT JOIN education.users u ON ts.user_id = u.id
            WHERE u.id IS NULL
        """)

        missing_users = cur.fetchall()

        if missing_users:
            logger.error(f"Nombre d'enseignants manquants: {len(missing_users)}")
            for user_id, stats_id in missing_users:
                logger.error(f"User ID {user_id} (stats_id: {stats_id}) existe dans stats.teacher_stats mais pas dans education.users")
        else:
            logger.info("Tous les user_id de stats.teacher_stats existent dans education.users")

        # Trouver les teacher_stats_id dans education.users qui n'existent pas dans stats.teacher_stats
        cur.execute("""
            SELECT u.id as user_id, u.teacher_stats_id
            FROM education.users u
            LEFT JOIN stats.teacher_stats ts ON u.teacher_stats_id = ts.id
            WHERE u.teacher_stats_id IS NOT NULL AND ts.id IS NULL
        """)

        missing_stats = cur.fetchall()

        if missing_stats:
            logger.error(f"Nombre de stats manquantes: {len(missing_stats)}")
            for user_id, stats_id in missing_stats:
                logger.error(f"Stats ID {stats_id} (user_id: {user_id}) existe dans education.users mais pas dans stats.teacher_stats")
        else:
            logger.info("Tous les teacher_stats_id de education.users existent dans stats.teacher_stats")

        # Vérifier les incohérences dans les références croisées
        cur.execute("""
            SELECT u.id as user_id, u.teacher_stats_id, ts.id as stats_id
            FROM education.users u
            JOIN stats.teacher_stats ts ON u.teacher_stats_id = ts.id
            WHERE u.id != ts.user_id
        """)

        cross_ref_errors = cur.fetchall()

        if cross_ref_errors:
            logger.error(f"Nombre d'incohérences de références croisées: {len(cross_ref_errors)}")
            for user_id, stats_id, stats_user_id in cross_ref_errors:
                logger.error(f"Incohérence trouvée: user_id={user_id}, teacher_stats_id={stats_id}, stats.user_id={stats_user_id}")
        else:
            logger.info("Aucune incohérence de références croisées trouvée")

        # Vérifier que les utilisateurs avec teacher_stats_id ont bien le rôle 'teacher'
        cur.execute("""
            SELECT u.id as user_id, u.role, u.teacher_stats_id
            FROM education.users u
            WHERE u.teacher_stats_id IS NOT NULL AND u.role != 'teacher'
        """)

        role_errors = cur.fetchall()

        if role_errors:
            logger.error(f"Nombre d'utilisateurs avec teacher_stats_id mais pas le rôle 'teacher': {len(role_errors)}")
            for user_id, role, stats_id in role_errors:
                logger.error(f"Utilisateur {user_id} a teacher_stats_id={stats_id} mais role={role}")
        else:
            logger.info("Tous les utilisateurs avec teacher_stats_id ont bien le rôle 'teacher'")

        return len(missing_users) == 0 and len(missing_stats) == 0 and len(cross_ref_errors) == 0 and len(role_errors) == 0

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

        # Vérifier la cohérence
        if check_teacher_stats_consistency(pg_conn):
            logger.info("Vérification terminée avec succès - Toutes les données sont cohérentes")
        else:
            logger.error("Vérification terminée avec des erreurs - Voir le log pour plus de détails")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
