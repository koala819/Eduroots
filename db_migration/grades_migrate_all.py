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

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration_all_grades.log'),
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

def drop_tmp_tables(pg_conn):
    """Supprime toutes les tables temporaires"""
    try:
        cur = pg_conn.cursor()

        # Liste des tables à supprimer dans l'ordre (pour respecter les contraintes de clés étrangères)
        tables = [
            'tmp_grades_records',
            'tmp_grades_teachers_migration',
            'tmp_grades'
        ]

        for table in tables:
            cur.execute(f"DROP TABLE IF EXISTS education.{table} CASCADE")
            logger.info(f"Table education.{table} supprimée")

        pg_conn.commit()
        logger.info("Toutes les tables temporaires ont été supprimées")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la suppression des tables: {str(e)}")
        raise
    finally:
        cur.close()

def create_tmp_tables(pg_conn):
    """Crée les tables temporaires dans Supabase"""
    try:
        cur = pg_conn.cursor()

        # Table des notes
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.tmp_grades (
                id UUID PRIMARY KEY,
                mongo_id TEXT NOT NULL UNIQUE,
                course_session_id UUID REFERENCES education.courses_sessions(id),
                date TIMESTAMP WITH TIME ZONE NOT NULL,
                type TEXT NOT NULL,
                is_draft BOOLEAN DEFAULT false,
                stats_average_grade DECIMAL,
                stats_highest_grade DECIMAL,
                stats_lowest_grade DECIMAL,
                stats_absent_count INTEGER,
                stats_total_students INTEGER,
                last_update TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT true,
                deleted_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table des notes des étudiants
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.tmp_grades_records (
                id UUID PRIMARY KEY,
                grade_id UUID REFERENCES education.tmp_grades(id),
                mongo_student_id TEXT NOT NULL,
                student_id UUID REFERENCES education.users(id),
                value DECIMAL,
                is_absent BOOLEAN DEFAULT false,
                comment TEXT,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # Table de migration des enseignants
        cur.execute("""
            CREATE TABLE IF NOT EXISTS education.tmp_grades_teachers_migration (
                id UUID PRIMARY KEY,
                course_session_id UUID REFERENCES education.courses_sessions(id),
                mongo_teacher_id TEXT NOT NULL,
                teacher_id UUID REFERENCES education.users(id),
                original_grade TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)

        pg_conn.commit()
        logger.info("Tables temporaires créées avec succès")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la création des tables: {str(e)}")
        raise
    finally:
        cur.close()

def get_mongo_grades(db):
    """Récupère toutes les notes depuis MongoDB"""
    try:
        # Vérifier que la collection existe
        if 'gradenews' not in db.list_collection_names():
            raise ValueError("La collection 'gradenews' n'existe pas dans MongoDB")

        grades = list(db.gradenews.find())
        if not grades:
            logger.warning("Aucune note trouvée dans MongoDB")
            return []

        logger.info(f"Nombre de notes trouvées dans MongoDB: {len(grades)}")
        return grades
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des notes MongoDB: {str(e)}")
        raise

def migrate_grade(pg_conn, mongo_grade):
    """Migre une note de MongoDB vers Supabase"""
    try:
        cur = pg_conn.cursor()

        # Vérifier que la note n'existe pas déjà
        cur.execute("""
            SELECT id FROM education.tmp_grades
            WHERE mongo_id = %s
        """, (str(mongo_grade['_id']),))

        if cur.fetchone():
            logger.warning(f"La note {mongo_grade['_id']} existe déjà dans Supabase, elle sera ignorée")
            return

        # Vérifier les champs obligatoires
        if 'sessionId' not in mongo_grade:
            logger.warning(f"La note {mongo_grade['_id']} n'a pas de session associée, elle sera ignorée")
            return

        # Récupérer l'ID de la session du cours
        cur.execute("""
            SELECT id FROM education.courses_sessions
            WHERE mongo_id = %s
        """, (str(mongo_grade['sessionId']),))

        session_result = cur.fetchone()
        if not session_result:
            logger.warning(f"La session {mongo_grade['sessionId']} n'existe pas dans Supabase, la note sera ignorée")
            return

        course_session_id = session_result[0]

        # Insérer la note
        cur.execute("""
            INSERT INTO education.tmp_grades (
                id,
                mongo_id,
                course_session_id,
                date,
                type,
                is_draft,
                stats_average_grade,
                stats_highest_grade,
                stats_lowest_grade,
                stats_absent_count,
                stats_total_students,
                last_update,
                created_at,
                updated_at,
                is_active
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
                %s,
                %s,
                %s,
                %s,
                true
            ) RETURNING id
        """, (
            str(mongo_grade['_id']),
            course_session_id,
            mongo_grade.get('date'),
            mongo_grade.get('type'),
            mongo_grade.get('isDraft', False),
            mongo_grade.get('stats', {}).get('averageGrade'),
            mongo_grade.get('stats', {}).get('highestGrade'),
            mongo_grade.get('stats', {}).get('lowestGrade'),
            mongo_grade.get('stats', {}).get('absentCount'),
            mongo_grade.get('stats', {}).get('totalStudents'),
            datetime.now(),
            mongo_grade.get('createdAt', datetime.now()),
            mongo_grade.get('updatedAt', datetime.now())
        ))
        grade_id = cur.fetchone()[0]

        # Insérer les notes des étudiants
        for record in mongo_grade.get('records', []):
            if not record.get('student'):
                logger.warning(f"ID étudiant vide trouvé dans la note {mongo_grade['_id']}")
                continue

            cur.execute("""
                INSERT INTO education.tmp_grades_records (
                    id,
                    grade_id,
                    mongo_student_id,
                    value,
                    is_absent,
                    comment,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                grade_id,
                str(record['student']),
                record.get('value'),
                record.get('isAbsent', False),
                record.get('comment'),
                datetime.now(),
                datetime.now()
            ))

            # Insérer le contexte de migration si présent dans le record
            if record.get('migrationContext'):
                context = record['migrationContext']
                if context and context.get('originalTeacher'):
                    cur.execute("""
                        INSERT INTO education.tmp_grades_teachers_migration (
                            id,
                            course_session_id,
                            mongo_teacher_id,
                            original_grade,
                            created_at,
                            updated_at
                        ) VALUES (
                            gen_random_uuid(),
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                    """, (
                        course_session_id,
                        str(context['originalTeacher']),
                        str(mongo_grade['_id']),
                        datetime.now(),
                        datetime.now()
                    ))

        pg_conn.commit()
        logger.info(f"Note {mongo_grade['_id']} migrée avec succès")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la migration de la note {mongo_grade['_id']}: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    finally:
        cur.close()

def verify_migration(pg_conn, mongo_db):
    """Vérifie que la migration s'est bien passée"""
    try:
        cur = pg_conn.cursor()
        mongo_grades = list(mongo_db.gradenews.find())
        supabase_grades = []

        # Récupérer toutes les notes de Supabase
        cur.execute("""
            SELECT g.*, cs.mongo_id as session_mongo_id
            FROM education.tmp_grades g
            JOIN education.courses_sessions cs ON g.course_session_id = cs.id
        """)
        supabase_grades = cur.fetchall()

        # Vérifier le nombre de notes
        if len(mongo_grades) != len(supabase_grades):
            logger.error(f"Nombre de notes différent: MongoDB={len(mongo_grades)}, Supabase={len(supabase_grades)}")
            return False

        # Vérifier chaque note
        for mongo_grade in mongo_grades:
            supabase_grade = next((g for g in supabase_grades if g[1] == str(mongo_grade['_id'])), None)
            if not supabase_grade:
                logger.error(f"Note {mongo_grade['_id']} non trouvée dans Supabase")
                continue

            # Vérifier les champs de base
            if str(mongo_grade['sessionId']) != supabase_grade[-1]:  # session_mongo_id
                logger.error(f"ID session incorrect pour la note {mongo_grade['_id']}")
                continue

            # Vérifier les notes des étudiants
            cur.execute("""
                SELECT COUNT(*) FROM education.tmp_grades_records
                WHERE grade_id = %s
            """, (supabase_grade[0],))
            supabase_records_count = cur.fetchone()[0]

            if len(mongo_grade.get('records', [])) != supabase_records_count:
                logger.error(f"Nombre de notes étudiants incorrect pour la note {mongo_grade['_id']}")
                continue

        logger.info("Vérification de la migration terminée avec succès")
        return True

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        return False
    finally:
        cur.close()

def main():
    """Fonction principale"""
    try:
        # Connexion à MongoDB
        mongo_db = connect_mongodb()
        logger.info("Connexion à MongoDB réussie")

        # Connexion à Supabase
        pg_conn = connect_supabase()
        logger.info("Connexion à Supabase réussie")

        # Supprimer les tables temporaires existantes
        drop_tmp_tables(pg_conn)
        logger.info("Tables temporaires supprimées")

        # Créer les nouvelles tables temporaires
        create_tmp_tables(pg_conn)
        logger.info("Nouvelles tables temporaires créées")

        # Récupérer les notes de MongoDB
        mongo_grades = get_mongo_grades(mongo_db)
        logger.info(f"Nombre de notes à migrer: {len(mongo_grades)}")

        # Migrer chaque note
        for grade in mongo_grades:
            try:
                migrate_grade(pg_conn, grade)
            except Exception as e:
                logger.error(f"Erreur lors de la migration de la note {grade['_id']}: {str(e)}")
                continue

        # Vérifier la migration
        if verify_migration(pg_conn, mongo_db):
            logger.info("Migration terminée avec succès")
        else:
            logger.error("Des erreurs ont été trouvées lors de la vérification")

    except Exception as e:
        logger.error(f"Erreur lors de la migration: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()
        if 'mongo_db' in locals():
            mongo_db.client.close()

if __name__ == "__main__":
    main()
