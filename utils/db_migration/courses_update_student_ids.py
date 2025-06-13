from dotenv import load_dotenv
load_dotenv()

import os
import json
import logging
from datetime import datetime
import psycopg2
import traceback

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('update_student_ids.log'),
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

def load_id_mapping():
    """Charge le mapping des IDs depuis le fichier JSON"""
    try:
        with open('./mongo_to_supabase_ids.json', 'r') as f:
            data = json.load(f)

        # Créer un mapping direct mongo_id -> supabase_id
        mapping = {}
        for user_data in data.values():
            mongo_id = user_data.get('mongo_id')
            supabase_id = user_data.get('supabase_id')
            if mongo_id and supabase_id:
                mapping[mongo_id] = supabase_id

        logger.info(f"Mapping chargé: {len(mapping)} entrées")
        # Afficher quelques exemples pour debug
        logger.info("Exemples de mapping:")
        for i, (mongo_id, supabase_id) in enumerate(mapping.items()):
            if i < 3:  # Afficher les 3 premiers
                logger.info(f"MongoDB: {mongo_id} -> Supabase: {supabase_id}")
        return mapping
    except Exception as e:
        logger.error(f"Erreur lors du chargement du mapping: {str(e)}")
        raise

def add_student_id_column(pg_conn):
    """Ajoute la colonne student_id à la table tmp_courses_sessions_students"""
    try:
        cur = pg_conn.cursor()

        # Vérifier si la colonne existe déjà
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'education'
            AND table_name = 'tmp_courses_sessions_students'
            AND column_name = 'student_id'
        """)

        if not cur.fetchone():
            # Ajouter la colonne
            cur.execute("""
                ALTER TABLE education.tmp_courses_sessions_students
                ADD COLUMN student_id UUID REFERENCES education.users(id)
            """)
            pg_conn.commit()
            logger.info("Colonne student_id ajoutée avec succès")
        else:
            logger.info("La colonne student_id existe déjà")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de l'ajout de la colonne: {str(e)}")
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
            FROM education.tmp_courses_sessions_students
            WHERE student_id IS NULL
        """)
        records = cur.fetchall()

        updated_count = 0
        not_found_count = 0

        for record in records:
            record_id, mongo_student_id = record

            # Chercher l'ID Supabase correspondant
            if mongo_student_id in id_mapping:
                supabase_id = id_mapping[mongo_student_id]

                # Mettre à jour l'enregistrement
                cur.execute("""
                    UPDATE education.tmp_courses_sessions_students
                    SET student_id = %s
                    WHERE id = %s
                """, (supabase_id, record_id))

                updated_count += 1
            else:
                logger.warning(f"ID MongoDB non trouvé dans le mapping: {mongo_student_id}")
                not_found_count += 1

        pg_conn.commit()
        logger.info(f"Mise à jour terminée:")
        logger.info(f"- {updated_count} enregistrements mis à jour")
        logger.info(f"- {not_found_count} IDs MongoDB non trouvés dans le mapping")

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la mise à jour des IDs: {str(e)}")
        raise
    finally:
        cur.close()

def main():
    try:
        # Connexion à Supabase
        pg_conn = connect_supabase()

        # Charger le mapping des IDs
        id_mapping = load_id_mapping()

        # Ajouter la colonne student_id
        add_student_id_column(pg_conn)

        # Mettre à jour les IDs
        update_student_ids(pg_conn, id_mapping)

    except Exception as e:
        logger.error(f"Erreur lors de l'exécution: {str(e)}")
        logger.error(f"Traceback complet: {traceback.format_exc()}")
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
