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
from bson import ObjectId

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration_all_users.log'),
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

def objectid_to_uuid(objectid: ObjectId) -> str:
    """Convertit un ObjectId MongoDB en UUID string"""
    # Convertir l'ObjectId en hexadécimal
    hex_str = str(objectid)
    # S'assurer que nous avons 32 caractères hexadécimaux
    hex_str = hex_str.ljust(32, '0')
    # Formater en UUID standard (8-4-4-4-12 caractères)
    return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:32]}"

def get_mongo_users(db):
    """Récupère tous les utilisateurs depuis MongoDB"""
    try:
        # Vérifier que la collection existe
        if 'usernews' not in db.list_collection_names():
            raise ValueError("La collection 'usernews' n'existe pas dans MongoDB")

        users = list(db.usernews.find())
        if not users:
            logger.warning("Aucun utilisateur trouvé dans MongoDB")
            return []

        logger.info(f"Nombre d'utilisateurs trouvés dans MongoDB: {len(users)}")
        return users
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des utilisateurs MongoDB: {str(e)}")
        raise

def migrate_user(pg_conn, mongo_user):
    """Migre un utilisateur de MongoDB vers Supabase"""
    try:
        cur = pg_conn.cursor()

        # Vérifier que l'utilisateur n'existe pas déjà
        cur.execute("""
            SELECT id FROM education.users
            WHERE mongo_id = %s
        """, (str(mongo_user['_id']),))

        if cur.fetchone():
            logger.warning(f"L'utilisateur {mongo_user['_id']} existe déjà dans Supabase, il sera ignoré")
            return

        # Vérifier les champs obligatoires
        if not mongo_user.get('firstname') or not mongo_user.get('lastname'):
            logger.warning(f"L'utilisateur {mongo_user['_id']} n'a pas de prénom ou de nom, il sera ignoré")
            return

        # Insérer l'utilisateur
        cur.execute("""
            INSERT INTO education.users (
                id,
                mongo_id,
                email,
                secondary_mail,
                has_invalid_email,
                firstname,
                lastname,
                role,
                phone,
                date_of_birth,
                gender,
                type,
                subjects,
                school_year,
                is_active,
                deleted_at,
                stats_model,
                created_at,
                updated_at
            ) VALUES (
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
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            ) RETURNING id
        """, (
            objectid_to_uuid(mongo_user['_id']),
            str(mongo_user['_id']),
            mongo_user.get('email'),
            mongo_user.get('secondaryEmail'),
            mongo_user.get('hasInvalidEmail', False),
            mongo_user.get('firstname'),
            mongo_user.get('lastname'),
            mongo_user.get('role'),
            mongo_user.get('phone'),
            mongo_user.get('dateOfBirth'),
            mongo_user.get('gender'),
            mongo_user.get('type'),
            mongo_user.get('subjects', []),
            mongo_user.get('schoolYear'),
            mongo_user.get('isActive', True),
            mongo_user.get('deletedAt'),
            mongo_user.get('statsModel'),
            mongo_user.get('createdAt', datetime.now()),
            mongo_user.get('updatedAt', datetime.now())
        ))
        user_id = cur.fetchone()[0]

        pg_conn.commit()
        logger.info(f"Utilisateur {mongo_user['_id']} migré avec succès")

        # Mettre à jour le mapping des IDs
        update_id_mapping(mongo_user, user_id)

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la migration de l'utilisateur {mongo_user['_id']}: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    finally:
        cur.close()

def update_id_mapping(mongo_user, supabase_id):
    """Met à jour le fichier de mapping des IDs"""
    try:
        mapping_file = 'mongo_to_supabase_ids.json'
        mapping = {}

        # Charger le mapping existant s'il existe
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mapping = json.load(f)

        # Créer une clé unique basée sur le prénom et le nom
        user_key = f"{mongo_user.get('firstname', '').lower()}_{mongo_user.get('lastname', '').lower()}"

        # Mettre à jour le mapping
        mapping[user_key] = {
            "mongo_id": str(mongo_user['_id']),
            "supabase_id": supabase_id,
            "email": mongo_user.get('email'),
            "firstname": mongo_user.get('firstname'),
            "lastname": mongo_user.get('lastname')
        }

        # Sauvegarder le mapping
        with open(mapping_file, 'w') as f:
            json.dump(mapping, f, indent=2)

    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du mapping des IDs: {str(e)}")
        raise

def verify_migration(pg_conn, mongo_db):
    """Vérifie que la migration s'est bien passée"""
    try:
        cur = pg_conn.cursor()

        # Récupérer tous les utilisateurs migrés
        cur.execute("""
            SELECT id, mongo_id, firstname, lastname, email
            FROM education.users
        """)
        migrated_users = cur.fetchall()

        logger.info(f"Vérification de {len(migrated_users)} utilisateurs migrés...")

        for user in migrated_users:
            supabase_id, mongo_id, firstname, lastname, email = user

            # Récupérer l'utilisateur MongoDB
            mongo_user = mongo_db.usernews.find_one({'_id': ObjectId(mongo_id)})
            if not mongo_user:
                logger.error(f"Utilisateur MongoDB {mongo_id} non trouvé")
                continue

            # Vérifier les champs de base
            if mongo_user.get('firstname') != firstname:
                logger.error(f"Différence de prénom pour l'utilisateur {mongo_id}")
            if mongo_user.get('lastname') != lastname:
                logger.error(f"Différence de nom pour l'utilisateur {mongo_id}")
            if mongo_user.get('email') != email:
                logger.error(f"Différence d'email pour l'utilisateur {mongo_id}")

        logger.info("Vérification terminée")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        raise
    finally:
        cur.close()

def recreate_users_table(pg_conn):
    """Supprime et recrée la table users avec tous les champs nécessaires"""
    try:
        cur = pg_conn.cursor()

        # Créer le schéma education s'il n'existe pas
        cur.execute("CREATE SCHEMA IF NOT EXISTS education")
        logger.info("Schéma education créé ou déjà existant")

        # Supprimer la table si elle existe
        cur.execute("DROP TABLE IF EXISTS education.users CASCADE")
        logger.info("Table education.users supprimée")

        # Créer la nouvelle table
        cur.execute("""
            CREATE TABLE education.users (
                id UUID PRIMARY KEY,
                mongo_id TEXT NOT NULL UNIQUE,
                auth_id UUID,
                parent2_auth_id UUID,
                email TEXT,
                secondary_mail TEXT,
                has_invalid_email BOOLEAN DEFAULT false,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                role TEXT,
                phone TEXT,
                date_of_birth DATE,
                gender TEXT,
                type TEXT,
                subjects TEXT[],
                school_year TEXT,
                is_active BOOLEAN DEFAULT true,
                deleted_at TIMESTAMP WITH TIME ZONE,
                stats_model TEXT,
                student_stats_id UUID,
                teacher_stats_id UUID,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """)
        logger.info("Table education.users recréée avec succès")

        pg_conn.commit()

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Erreur lors de la recréation de la table users: {str(e)}")
        raise
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

        # Recréer la table users
        recreate_users_table(pg_conn)
        logger.info("Table users recréée")

        # Récupérer les utilisateurs de MongoDB
        mongo_users = get_mongo_users(mongo_db)
        logger.info(f"Nombre d'utilisateurs à migrer: {len(mongo_users)}")

        # Migrer chaque utilisateur
        for user in mongo_users:
            migrate_user(pg_conn, user)

        # Vérifier la migration
        verify_migration(pg_conn, mongo_db)

        logger.info("Migration des utilisateurs terminée avec succès")

    except Exception as e:
        logger.error(f"Erreur lors de la migration: {str(e)}")
        raise
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
