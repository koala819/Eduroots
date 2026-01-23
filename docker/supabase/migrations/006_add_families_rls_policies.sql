-- Migration 006: Add RLS policies for families table
-- Date: 2026-01-22
-- Description: Enable Row Level Security and add policies for families table

-- Activer RLS sur la table families
ALTER TABLE education.families ENABLE ROW LEVEL SECURITY;

-- Politique 1: Les admins et bureau peuvent tout faire sur les familles
CREATE POLICY "Admins_and_bureau_can_manage_families"
ON education.families
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'bureau')
    AND u.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'bureau')
    AND u.is_active = true
  )
);

-- Politique 2: Les utilisateurs authentifiés peuvent lire les familles liées à leurs enfants
CREATE POLICY "Users_can_read_their_family"
ON education.families
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE u.family_id = families.id
    AND (
      u.id = auth.uid()
      OR u.auth_id_email = auth.uid()
      OR u.auth_id_gmail = auth.uid()
      OR u.parent2_auth_id_email = auth.uid()
      OR u.parent2_auth_id_gmail = auth.uid()
    )
    AND u.is_active = true
  )
);

-- Politique 3: Les utilisateurs authentifiés peuvent créer des familles
-- (nécessaire pour la création automatique lors de l'import)
CREATE POLICY "Authenticated_users_can_create_families"
ON education.families
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique 4: Le service_role peut tout faire (pour les opérations backend)
CREATE POLICY "Service_role_can_manage_families"
ON education.families
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Commentaires
COMMENT ON POLICY "Admins_and_bureau_can_manage_families" ON education.families IS 
  'Permet aux admins et bureau de gérer toutes les familles';
COMMENT ON POLICY "Users_can_read_their_family" ON education.families IS 
  'Permet aux utilisateurs de lire leur propre famille via leurs enfants';
COMMENT ON POLICY "Authenticated_users_can_create_families" ON education.families IS 
  'Permet aux utilisateurs authentifiés de créer des familles (pour import automatique)';
COMMENT ON POLICY "Service_role_can_manage_families" ON education.families IS 
  'Permet au service_role de gérer toutes les familles pour les opérations backend';
