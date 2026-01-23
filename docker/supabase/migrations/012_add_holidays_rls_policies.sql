-- Migration 012: Add RLS policies for holidays table
-- Date: 2026-01-23
-- Description: Enable Row Level Security and add policies for holidays

-- Activer RLS sur la table holidays (si pas déjà activé)
ALTER TABLE education.holidays ENABLE ROW LEVEL SECURITY;

-- Politique 1: Les admins et bureau peuvent tout faire sur les vacances
DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_holidays" ON education.holidays;
CREATE POLICY "Admins_and_bureau_can_manage_holidays"
ON education.holidays
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
);

-- Politique 2: Tous les utilisateurs authentifiés peuvent lire les vacances
DROP POLICY IF EXISTS "Authenticated_users_can_read_holidays" ON education.holidays;
CREATE POLICY "Authenticated_users_can_read_holidays"
ON education.holidays
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Politique 3: Le service_role peut tout faire (pour opérations backend)
DROP POLICY IF EXISTS "Service_role_can_manage_holidays" ON education.holidays;
CREATE POLICY "Service_role_can_manage_holidays"
ON education.holidays
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Commentaires
COMMENT ON POLICY "Admins_and_bureau_can_manage_holidays" ON education.holidays IS
  'Permet aux admins et bureau de gérer toutes les vacances (via JWT user_metadata)';
COMMENT ON POLICY "Authenticated_users_can_read_holidays" ON education.holidays IS
  'Permet aux utilisateurs authentifiés de lire les vacances';
COMMENT ON POLICY "Service_role_can_manage_holidays" ON education.holidays IS
  'Permet au service_role de gérer toutes les vacances';
