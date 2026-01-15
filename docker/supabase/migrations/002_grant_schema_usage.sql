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
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    ALTER ROLE authenticator SET pgrst.db_schemas = 'public,storage,graphql_public,extensions,auth,vault,supabase_functions,supabase_migrations,education,logs,stats,config';
    ALTER ROLE authenticator SET pgrst.db_extra_search_path = 'public,extensions';
  END IF;
END
$$;
