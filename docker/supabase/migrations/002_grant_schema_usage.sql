-- Grant USAGE on schemas for PostgREST access
-- This fixes the "Invalid schema: stats" error

-- Grant USAGE on education schema
GRANT USAGE ON SCHEMA education TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA education TO supabase_admin;

-- Grant USAGE on logs schema
GRANT USAGE ON SCHEMA logs TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA logs TO supabase_admin;

-- Grant USAGE on stats schema
GRANT USAGE ON SCHEMA stats TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA stats TO supabase_admin;

-- Grant USAGE on config schema
GRANT USAGE ON SCHEMA config TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA config TO supabase_admin;

-- Expose the new schemas to PostgREST (Supabase)
-- Note: PostgREST lit la configuration depuis la variable d'environnement PGRST_DB_SCHEMAS
-- Cette configuration est définie dans compose.yml et ne nécessite pas de modification du rôle
-- Si vous rencontrez des erreurs "Invalid schema: stats", redémarrez le service PostgREST:
-- docker-compose restart rest

-- Vérification que les schémas existent et sont accessibles
DO $$
BEGIN
  -- Vérifier que le schéma stats existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stats') THEN
    RAISE EXCEPTION 'Le schéma stats n''existe pas. Vérifiez que la migration 001_init_schema.sql a été exécutée.';
  END IF;

  -- Vérifier que les permissions sont correctes
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE grantee = 'authenticated'
    AND table_schema = 'stats'
    LIMIT 1
  ) THEN
    RAISE WARNING 'Les permissions pour le schéma stats peuvent ne pas être correctement configurées.';
  END IF;
END
$$;
