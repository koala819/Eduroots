import os
import json
import logging
from datetime import datetime
from pymongo import MongoClient
import psycopg2
from psycopg2.extras import Json
import uuid
from dotenv import load_dotenv
import sys
from bson.objectid import ObjectId

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('behavior_migration.log'),
        logging.StreamHandler()
    ]
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

def check_course_mapping(mongo_db, pg_conn, course_mapping):
    """Vérifie la correspondance des cours entre MongoDB et Supabase"""
    try:
        # Récupérer tous les comportements
        behaviors = list(mongo_db.behaviornews.find({}, {'course': 1}))
        logger.info(f"Nombre total de comportements à vérifier: {len(behaviors)}")

        # Extraire les IDs des cours uniques
        unique_course_ids = set(str(behavior['course']) for behavior in behaviors)

        # Vérifier les correspondances dans Supabase
        cursor = pg_conn.cursor()
        found_courses = set()
        missing_courses = set()

        # Récupérer les détails des cours dans Supabase
        cursor.execute("""
            SELECT c.id, c.mongo_id, c.academic_year, c.created_at,
                   cs.subject, cs.level
            FROM education.courses c
            LEFT JOIN education.courses_sessions cs ON cs.course_id = c.id
            WHERE c.mongo_id IN %s
        """, (tuple(course_mapping.values()),))

        course_details = cursor.fetchall()

        logger.info("\nDétails des cours dans Supabase:")
        for course in course_details:
            logger.info(f"- ID Supabase: {course[0]}")
            logger.info(f"  MongoDB ID: {course[1]}")
            logger.info(f"  Année académique: {course[2]}")
            logger.info(f"  Date de création: {course[3]}")
            if course[4]:  # subject
                logger.info(f"  Matière: {course[4]}")
                logger.info(f"  Niveau: {course[5]}")
            logger.info("  Anciens cours mappés:")
            for old_id, new_id in course_mapping.items():
                if new_id == course[1]:
                    logger.info(f"    * {old_id}")
            logger.info("")

        for old_course_id in unique_course_ids:
            if old_course_id in course_mapping:
                new_course_id = course_mapping[old_course_id]
                cursor.execute(
                    "SELECT id FROM education.courses WHERE mongo_id = %s",
                    (new_course_id,)
                )
                result = cursor.fetchone()
                if result:
                    found_courses.add(old_course_id)
                else:
                    missing_courses.add(old_course_id)
            else:
                missing_courses.add(old_course_id)

        cursor.close()

        # Afficher les statistiques
        logger.info("\nStatistiques de correspondance des cours:")
        logger.info(f"Total des cours uniques: {len(unique_course_ids)}")
        logger.info(f"Cours trouvés dans Supabase: {len(found_courses)}")
        logger.info(f"Cours manquants: {len(missing_courses)}")

        if missing_courses:
            logger.info("\nListe des cours manquants dans Supabase:")
            for course_id in missing_courses:
                logger.info(f"- MongoDB ID: {course_id}")
                if course_id in course_mapping:
                    logger.info(f"  Mappé vers: {course_mapping[course_id]}")

    except Exception as e:
        logger.error(f"Erreur lors de la vérification des correspondances: {str(e)}")
        raise

def explore_mongodb_structure(mongo_db):
    """Explore la structure des données MongoDB pour trouver les collections pertinentes"""
    try:
        # Lister toutes les collections
        collections = mongo_db.list_collection_names()
        logger.info("\nCollections disponibles dans MongoDB:")
        for collection in collections:
            count = mongo_db[collection].count_documents({})
            logger.info(f"- {collection}: {count} documents")

            # Si c'est une collection de cours, afficher un exemple
            if 'course' in collection.lower():
                sample = mongo_db[collection].find_one()
                if sample:
                    logger.info(f"  Exemple de document dans {collection}:")
                    logger.info(f"  ID: {sample.get('_id')}")
                    logger.info(f"  Nom: {sample.get('name', 'N/A')}")
                    logger.info(f"  Autres champs: {list(sample.keys())}")

        # Vérifier la structure des comportements
        behavior_sample = mongo_db.behaviornews.find_one()
        if behavior_sample:
            logger.info("\nStructure d'un comportement:")
            logger.info(f"Champs disponibles: {list(behavior_sample.keys())}")
            if 'course' in behavior_sample:
                logger.info(f"Type de course: {type(behavior_sample['course'])}")
                logger.info(f"Valeur de course: {behavior_sample['course']}")

    except Exception as e:
        logger.error(f"Erreur lors de l'exploration: {str(e)}")
        raise

def analyze_course_migration(mongo_db):
    """Analyse la migration des cours entre les anciens et nouveaux IDs"""
    try:
        # Récupérer tous les comportements
        behaviors = list(mongo_db.behaviornews.find({}, {'course': 1, 'date': 1}))
        logger.info(f"\nAnalyse de la migration des cours:")
        logger.info(f"Nombre total de comportements: {len(behaviors)}")

        # Récupérer tous les cours
        old_courses = set(str(b['course']) for b in behaviors if 'course' in b)
        new_courses = list(mongo_db.coursenews.find({}, {'_id': 1, 'createdAt': 1}))

        # Trier les cours par date de création
        new_courses.sort(key=lambda x: x.get('createdAt', ''))

        logger.info(f"\nAnciens cours (référencés dans les comportements):")
        logger.info(f"Nombre: {len(old_courses)}")
        logger.info(f"Période: {min(old_courses)} à {max(old_courses)}")

        logger.info(f"\nNouveaux cours (dans coursenews):")
        logger.info(f"Nombre: {len(new_courses)}")
        if new_courses:
            logger.info(f"Premier cours créé: {new_courses[0]['_id']} ({new_courses[0].get('createdAt', 'N/A')})")
            logger.info(f"Dernier cours créé: {new_courses[-1]['_id']} ({new_courses[-1].get('createdAt', 'N/A')})")

        # Vérifier si les dates de création des nouveaux cours correspondent à la période des anciens
        logger.info("\nAnalyse des dates:")
        for behavior in behaviors[:5]:  # Afficher les 5 premiers comportements
            logger.info(f"Comportement du {behavior.get('date', 'N/A')} - Cours: {behavior.get('course', 'N/A')}")

    except Exception as e:
        logger.error(f"Erreur lors de l'analyse: {str(e)}")
        raise

def create_course_mapping(mongo_db):
    """Crée un mapping entre les anciens et nouveaux cours basé sur les dates"""
    try:
        # Récupérer tous les comportements avec leurs dates
        behaviors = list(mongo_db.behaviornews.find({}, {'course': 1, 'date': 1}))

        # Récupérer tous les nouveaux cours avec leurs dates
        new_courses = list(mongo_db.coursenews.find({}, {
            '_id': 1,
            'createdAt': 1,
            'sessions': 1,
            'teacher': 1
        }))

        # Trier les cours par date de création
        new_courses.sort(key=lambda x: x.get('createdAt', ''))

        # Créer un mapping basé sur les dates
        course_mapping = {}
        for behavior in behaviors:
            old_course_id = str(behavior['course'])
            behavior_date = behavior.get('date')

            if behavior_date:
                # Trouver le cours le plus proche en date
                closest_course = min(
                    new_courses,
                    key=lambda x: abs((x.get('createdAt', '') - behavior_date).total_seconds())
                )
                course_mapping[old_course_id] = str(closest_course['_id'])

        # Afficher le mapping
        logger.info("\nMapping des cours (ancien -> nouveau):")
        for old_id, new_id in course_mapping.items():
            logger.info(f"- {old_id} -> {new_id}")

        # Vérifier la qualité du mapping
        logger.info(f"\nNombre de mappings créés: {len(course_mapping)}")
        logger.info(f"Nombre de comportements: {len(behaviors)}")

        return course_mapping

    except Exception as e:
        logger.error(f"Erreur lors de la création du mapping: {str(e)}")
        raise

def migrate_behaviors(mongo_db, pg_conn, course_mapping):
    """Migre les behaviors de MongoDB vers Supabase"""
    try:
        # Récupérer tous les behaviors de MongoDB
        behaviors = list(mongo_db.behaviornews.find())
        logger.info(f"\nDébut de la migration des {len(behaviors)} behaviors...")

        cursor = pg_conn.cursor()
        migrated = 0
        errors = 0

        for behavior in behaviors:
            try:
                # Obtenir le nouveau course_id (UUID Supabase)
                old_course_id = str(behavior['course'])
                if old_course_id not in course_mapping:
                    logger.error(f"Pas de mapping trouvé pour le cours {old_course_id}")
                    errors += 1
                    continue

                # Récupérer l'ID Supabase de la session de cours
                cursor.execute("""
                    SELECT cs.id
                    FROM education.courses c
                    JOIN education.courses_sessions cs ON cs.course_id = c.id
                    WHERE c.mongo_id = %s
                    LIMIT 1
                """, (course_mapping[old_course_id],))
                session_result = cursor.fetchone()
                if not session_result:
                    logger.error(f"Session de cours non trouvée pour le cours {course_mapping[old_course_id]}")
                    errors += 1
                    continue
                course_session_id = session_result[0]

                # Calculer behavior_rate et total_students
                records = behavior.get('records', [])
                total_students = len(records)
                if total_students > 0:
                    behavior_rate = sum(r.get('rating', 0) for r in records) / total_students
                else:
                    behavior_rate = 0

                # Insérer le behavior dans Supabase
                cursor.execute("""
                    INSERT INTO education.behaviors (
                        id,
                        course_session_id,
                        date,
                        behavior_rate,
                        total_students,
                        last_update,
                        is_active,
                        created_at,
                        updated_at
                    ) VALUES (
                        gen_random_uuid(),
                        %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id
                """, (
                    course_session_id,  # UUID Supabase de la session
                    behavior.get('date', datetime.now()),
                    behavior_rate,
                    total_students,
                    datetime.now(),
                    True,
                    behavior.get('created_at', datetime.now()),
                    datetime.now()
                ))

                behavior_id = cursor.fetchone()[0]

                # Insérer les records
                for record in records:
                    # Récupérer l'ID Supabase de l'étudiant
                    cursor.execute(
                        "SELECT id FROM education.users WHERE mongo_id = %s",
                        (str(record.get('student', '')),)
                    )
                    student_result = cursor.fetchone()
                    if not student_result:
                        logger.error(f"Étudiant {record.get('student')} non trouvé dans Supabase")
                        continue
                    student_id = student_result[0]

                    cursor.execute("""
                        INSERT INTO education.behavior_records (
                            id,
                            behavior_id,
                            student_id,
                            rating,
                            comment,
                            created_at,
                            updated_at
                        ) VALUES (
                            gen_random_uuid(),
                            %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        behavior_id,  # UUID Supabase
                        student_id,   # UUID Supabase
                        record.get('rating', 0),
                        record.get('comment'),
                        behavior.get('created_at', datetime.now()),
                        datetime.now()
                    ))

                migrated += 1
                if migrated % 50 == 0:
                    logger.info(f"{migrated} behaviors migrés...")

            except Exception as e:
                logger.error(f"Erreur lors de la migration du behavior {behavior['_id']}: {str(e)}")
                errors += 1
                continue

        pg_conn.commit()
        cursor.close()

        logger.info(f"\nMigration terminée:")
        logger.info(f"- Behaviors migrés avec succès: {migrated}")
        logger.info(f"- Erreurs: {errors}")

    except Exception as e:
        logger.error(f"Erreur lors de la migration des behaviors: {str(e)}")
        raise

def main():
    """Fonction principale"""
    try:
        logger.info("Connexion à MongoDB...")
        mongo_db = connect_mongodb()

        logger.info("Connexion à Supabase...")
        pg_conn = connect_supabase()

        logger.info("Création du mapping des cours...")
        course_mapping = create_course_mapping(mongo_db)

        logger.info("Début de la vérification des correspondances...")
        check_course_mapping(mongo_db, pg_conn, course_mapping)
        logger.info("Vérification terminée !")

        # Migrer les behaviors
        logger.info("Début de la migration des behaviors...")
        migrate_behaviors(mongo_db, pg_conn, course_mapping)

    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
    finally:
        if 'pg_conn' in locals():
            pg_conn.close()

if __name__ == "__main__":
    main()
