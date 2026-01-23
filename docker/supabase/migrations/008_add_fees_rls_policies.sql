-- Migration 008: Add RLS policies for fees table
-- Date: 2026-01-23
-- Description: Enable Row Level Security and add policies for fees table

-- Activer RLS sur la table fees
ALTER TABLE education.fees ENABLE ROW LEVEL SECURITY;

-- Politique 1: Les admins et bureau peuvent tout faire sur les fees
CREATE POLICY "Admins_and_bureau_can_manage_fees"
ON education.fees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE (
      u.auth_id_email = auth.uid()
      OR u.auth_id_gmail = auth.uid()
      OR u.parent2_auth_id_email = auth.uid()
      OR u.parent2_auth_id_gmail = auth.uid()
    )
    AND u.role IN ('admin', 'bureau')
    AND u.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE (
      u.auth_id_email = auth.uid()
      OR u.auth_id_gmail = auth.uid()
      OR u.parent2_auth_id_email = auth.uid()
      OR u.parent2_auth_id_gmail = auth.uid()
    )
    AND u.role IN ('admin', 'bureau')
    AND u.is_active = true
  )
);

-- Politique 2: Les utilisateurs authentifiés peuvent lire les fees de leur famille
CREATE POLICY "Users_can_read_their_family_fees"
ON education.fees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.users u
    WHERE u.family_id = fees.family_id
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

-- Politique 3: Les utilisateurs authentifiés peuvent créer des fees
-- (nécessaire pour la création lors de l'import)
CREATE POLICY "Authenticated_users_can_create_fees"
ON education.fees
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique 4: Le service_role peut tout faire (pour les opérations backend)
CREATE POLICY "Service_role_can_manage_fees"
ON education.fees
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Commentaires
COMMENT ON POLICY "Admins_and_bureau_can_manage_fees" ON education.fees IS
  'Permet aux admins et bureau de gérer tous les fees';
COMMENT ON POLICY "Users_can_read_their_family_fees" ON education.fees IS
  'Permet aux utilisateurs de lire les fees de leur famille via leurs enfants';
COMMENT ON POLICY "Authenticated_users_can_create_fees" ON education.fees IS
  'Permet aux utilisateurs authentifiés de créer des fees (pour l''import)';
COMMENT ON POLICY "Service_role_can_manage_fees" ON education.fees IS
  'Permet au service_role de gérer tous les fees (opérations backend)';
