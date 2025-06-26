#!/usr/bin/env python3
"""
Script pour nettoyer les doublons dans la table stats.student_stats_absences

Ce script :
1. Crée un backup de la table
2. Identifie les doublons
3. Supprime les doublons en gardant l'enregistrement le plus récent
4. Met à jour les statistiques des étudiants
"""

import os
import sys
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('clean_duplicates.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Établit la connexion à la base de données"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('SUPABASE_DB_HOST'),
            database=os.getenv('SUPABASE_DB_NAME'),
            user=os.getenv('SUPABASE_DB_USER'),
            password=os.getenv('SUPABASE_DB_PASSWORD'),
            port=os.getenv('SUPABASE_DB_PORT', '5432')
        )
        return conn
    except Exception as e:
        logger.error(f"Erreur de connexion à la base de données: {e}")
        raise

def create_backup(conn):
    """Crée un backup de la table student_stats_absences"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_table = f'student_stats_absences_backup_{timestamp}'

    try:
        with conn.cursor() as cur:
            # Créer la table de backup
            cur.execute(f"""
                CREATE TABLE stats.{backup_table} AS
                SELECT * FROM stats.student_stats_absences
            """)

            # Compter les enregistrements
            cur.execute(f"SELECT COUNT(*) FROM stats.{backup_table}")
            count = cur.fetchone()[0]

            conn.commit()
            logger.info(f"Backup créé: {backup_table} avec {count} enregistrements")
            return backup_table

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur lors de la création du backup: {e}")
        raise

def identify_duplicates(conn):
    """Identifie les doublons dans la table"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Trouver les doublons basés sur student_stats_id, date, et course_session_id
            cur.execute("""
                SELECT
                    student_stats_id,
                    date,
                    course_session_id,
                    COUNT(*) as duplicate_count,
                    array_agg(id ORDER BY created_at DESC) as ids,
                    array_agg(created_at ORDER BY created_at DESC) as created_ats
                FROM stats.student_stats_absences
                GROUP BY student_stats_id, date, course_session_id
                HAVING COUNT(*) > 1
                ORDER BY duplicate_count DESC, student_stats_id
            """)

            duplicates = cur.fetchall()

            if not duplicates:
                logger.info("Aucun doublon trouvé")
                return []

            logger.info(f"Trouvé {len(duplicates)} groupes de doublons")

            for dup in duplicates:
                logger.info(f"Doublons pour student_stats_id={dup['student_stats_id']}, "
                          f"date={dup['date']}, course_session_id={dup['course_session_id']}: "
                          f"{dup['duplicate_count']} enregistrements")

            return duplicates

    except Exception as e:
        logger.error(f"Erreur lors de l'identification des doublons: {e}")
        raise

def clean_duplicates(conn, duplicates):
    """Supprime les doublons en gardant l'enregistrement le plus récent"""
    if not duplicates:
        logger.info("Aucun doublon à nettoyer")
        return 0

    total_deleted = 0

    try:
        with conn.cursor() as cur:
            for dup in duplicates:
                # Garder l'ID le plus récent (premier dans la liste car trié par created_at DESC)
                ids_to_delete = dup['ids'][1:]  # Tous sauf le premier

                if ids_to_delete:
                    # Supprimer les doublons
                    placeholders = ','.join(['%s'] * len(ids_to_delete))
                    cur.execute(f"""
                        DELETE FROM stats.student_stats_absences
                        WHERE id IN ({placeholders})
                    """, ids_to_delete)

                    deleted_count = cur.rowcount
                    total_deleted += deleted_count

                    logger.info(f"Supprimé {deleted_count} doublons pour "
                              f"student_stats_id={dup['student_stats_id']}, "
                              f"date={dup['date']}")

            conn.commit()
            logger.info(f"Total des enregistrements supprimés: {total_deleted}")
            return total_deleted

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur lors du nettoyage des doublons: {e}")
        raise

def update_student_stats(conn):
    """Met à jour les statistiques des étudiants après le nettoyage"""
    try:
        with conn.cursor() as cur:
            # Mettre à jour les statistiques d'absence pour tous les étudiants
            cur.execute("""
                UPDATE stats.student_stats ss
                SET
                    absences_count = (
                        SELECT COUNT(*)
                        FROM stats.student_stats_absences ssa
                        WHERE ssa.student_stats_id = ss.id
                    ),
                    last_update = NOW()
                WHERE EXISTS (
                    SELECT 1 FROM stats.student_stats_absences ssa
                    WHERE ssa.student_stats_id = ss.id
                )
            """)

            updated_count = cur.rowcount
            conn.commit()
            logger.info(f"Statistiques mises à jour pour {updated_count} étudiants")

    except Exception as e:
        conn.rollback()
        logger.error(f"Erreur lors de la mise à jour des statistiques: {e}")
        raise

def verify_cleanup(conn):
    """Vérifie qu'il n'y a plus de doublons"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) as duplicate_groups
                FROM (
                    SELECT student_stats_id, date, course_session_id
                    FROM stats.student_stats_absences
                    GROUP BY student_stats_id, date, course_session_id
                    HAVING COUNT(*) > 1
                ) duplicates
            """)

            duplicate_groups = cur.fetchone()[0]

            if duplicate_groups == 0:
                logger.info("✅ Vérification réussie: Aucun doublon restant")
            else:
                logger.warning(f"⚠️ Attention: {duplicate_groups} groupes de doublons restent")

            return duplicate_groups == 0

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {e}")
        raise

def main():
    """Fonction principale"""
    logger.info("=== Début du nettoyage des doublons ===")

    conn = None
    backup_table = None

    try:
        # Établir la connexion
        conn = get_db_connection()
        logger.info("Connexion à la base de données établie")

        # Créer un backup
        backup_table = create_backup(conn)

        # Identifier les doublons
        duplicates = identify_duplicates(conn)

        if duplicates:
            # Nettoyer les doublons
            deleted_count = clean_duplicates(conn, duplicates)

            # Mettre à jour les statistiques
            update_student_stats(conn)

            # Vérifier le nettoyage
            verify_cleanup(conn)

            logger.info(f"=== Nettoyage terminé: {deleted_count} enregistrements supprimés ===")
        else:
            logger.info("=== Aucun nettoyage nécessaire ===")

    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {e}")
        if conn:
            conn.rollback()
        raise

    finally:
        if conn:
            conn.close()
            logger.info("Connexion à la base de données fermée")

if __name__ == "__main__":
    main()
