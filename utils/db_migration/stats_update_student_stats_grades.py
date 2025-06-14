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
        logging.FileHandler('update_student_stats_grades.log'),
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

def update_student_stats_grades(pg_conn):
    """Met à jour les statistiques des notes des étudiants"""
    try:
        cur = pg_conn.cursor()

        # Vérifier les données source
        cur.execute("SELECT COUNT(*) FROM education.grades")
        grades_count = cur.fetchone()[0]
        logger.info(f"Nombre de notes dans education.grades: {grades_count}")

        cur.execute("SELECT COUNT(*) FROM education.grades_records")
        records_count = cur.fetchone()[0]
        logger.info(f"Nombre d'enregistrements dans education.grades_records: {records_count}")

        # Vérifier les jointures
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records gr
            JOIN education.grades g ON gr.grade_id = g.id
        """)
        joined_records = cur.fetchone()[0]
        logger.info(f"Nombre d'enregistrements après jointure avec grades: {joined_records}")

        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records gr
            JOIN education.grades g ON gr.grade_id = g.id
            JOIN education.courses_sessions cs ON g.course_session_id = cs.id
        """)
        joined_with_sessions = cur.fetchone()[0]
        logger.info(f"Nombre d'enregistrements après jointure avec sessions: {joined_with_sessions}")

        # Vérifier les notes valides
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records gr
            JOIN education.grades g ON gr.grade_id = g.id
            JOIN education.courses_sessions cs ON g.course_session_id = cs.id
            WHERE gr.value IS NOT NULL
            AND gr.is_absent = false
        """)
        valid_records = cur.fetchone()[0]
        logger.info(f"Nombre d'enregistrements valides (avec note et non absents): {valid_records}")

        # Vérifier les étudiants avec student_stats_id
        cur.execute("""
            SELECT COUNT(*)
            FROM education.grades_records gr
            JOIN education.grades g ON gr.grade_id = g.id
            JOIN education.courses_sessions cs ON g.course_session_id = cs.id
            JOIN education.users u ON gr.student_id = u.id
            WHERE gr.value IS NOT NULL
            AND gr.is_absent = false
            AND u.student_stats_id IS NOT NULL
        """)
        students_with_stats = cur.fetchone()[0]
        logger.info(f"Nombre d'étudiants avec student_stats_id: {students_with_stats}")

        # Supprimer les anciennes statistiques
        cur.execute("DELETE FROM stats.student_stats_grades")
        logger.info("Anciennes statistiques supprimées")

        # Créer les statistiques
        cur.execute("""
            WITH student_grades AS (
                SELECT
                    gr.student_id,
                    cs.subject,
                    AVG(gr.value) as average_grade
                FROM education.grades_records gr
                JOIN education.grades g ON gr.grade_id = g.id
                JOIN education.courses_sessions cs ON g.course_session_id = cs.id
                WHERE gr.value IS NOT NULL
                AND gr.is_absent = false
                GROUP BY gr.student_id, cs.subject
            )
            INSERT INTO stats.student_stats_grades (
                id,
                student_stats_id,
                subject,
                average,
                created_at
            )
            SELECT
                gen_random_uuid(),
                ss.id,
                sg.subject,
                sg.average_grade,
                NOW()
            FROM student_grades sg
            JOIN education.users u ON sg.student_id = u.id
            JOIN stats.student_stats ss ON u.student_stats_id = ss.id
        """)

        pg_conn.commit()
        logger.info("Statistiques des notes mises à jour avec succès")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour des statistiques: {str(e)}")
        raise
    finally:
        cur.close()

def verify_update(pg_conn):
    """Vérifie que la mise à jour s'est bien passée"""
    try:
        cur = pg_conn.cursor()

        # Vérifier le nombre de statistiques créées
        cur.execute("""
            SELECT COUNT(*)
            FROM stats.student_stats_grades
        """)
        count = cur.fetchone()[0]
        logger.info(f"Nombre de statistiques créées: {count}")

        # Vérifier quelques exemples
        cur.execute("""
            SELECT
                ssg.subject,
                ssg.average,
                u.firstname,
                u.lastname
            FROM stats.student_stats_grades ssg
            JOIN stats.student_stats ss ON ssg.student_stats_id = ss.id
            JOIN education.users u ON ss.user_id = u.id
            LIMIT 5
        """)
        examples = cur.fetchall()

        logger.info("Exemples de statistiques créées:")
        for subject, average, firstname, lastname in examples:
            logger.info(f"- {firstname} {lastname}: {subject} = {average}")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        raise
    finally:
        cur.close()

def main():
    try:
        # Connexion à Supabase
        logger.info("Connexion à Supabase...")
        pg_conn = connect_supabase()

        # Mettre à jour les statistiques
        logger.info("Mise à jour des statistiques des notes...")
        update_student_stats_grades(pg_conn)

        # Vérifier la mise à jour
        logger.info("Vérification de la mise à jour...")
        verify_update(pg_conn)

        logger.info("Mise à jour terminée avec succès !")

    except Exception as e:
        logger.error(f"Erreur lors de l'exécution: {str(e)}")
        logger.error(f"Traceback complet: {traceback.format_exc()}")
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
