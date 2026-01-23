-- Migration 009: Add RLS policies for fee_payments and fee_notes tables
-- Date: 2026-01-23
-- Description: Enable Row Level Security and add policies for fee_payments and fee_notes tables

-- ============================================
-- FEE_PAYMENTS
-- ============================================

-- Activer RLS sur la table fee_payments
ALTER TABLE education.fee_payments ENABLE ROW LEVEL SECURITY;

-- Politique 1: Les admins et bureau peuvent tout faire sur les paiements
CREATE POLICY "Admins_and_bureau_can_manage_fee_payments"
ON education.fee_payments
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

-- Politique 2: Les utilisateurs authentifiés peuvent lire les paiements des fees de leur famille
CREATE POLICY "Users_can_read_their_family_fee_payments"
ON education.fee_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.fees f
    JOIN education.users u ON u.family_id = f.family_id
    WHERE f.id = fee_payments.fee_id
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

-- Politique 3: Les utilisateurs authentifiés peuvent créer des paiements
CREATE POLICY "Authenticated_users_can_create_fee_payments"
ON education.fee_payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique 4: Le service_role peut tout faire
CREATE POLICY "Service_role_can_manage_fee_payments"
ON education.fee_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- FEE_NOTES
-- ============================================

-- Activer RLS sur la table fee_notes
ALTER TABLE education.fee_notes ENABLE ROW LEVEL SECURITY;

-- Politique 1: Les admins et bureau peuvent tout faire sur les notes
CREATE POLICY "Admins_and_bureau_can_manage_fee_notes"
ON education.fee_notes
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

-- Politique 2: Les utilisateurs authentifiés peuvent lire les notes des fees de leur famille
CREATE POLICY "Users_can_read_their_family_fee_notes"
ON education.fee_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM education.fees f
    JOIN education.users u ON u.family_id = f.family_id
    WHERE f.id = fee_notes.fee_id
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

-- Politique 3: Les utilisateurs authentifiés peuvent créer des notes
CREATE POLICY "Authenticated_users_can_create_fee_notes"
ON education.fee_notes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique 4: Le service_role peut tout faire
CREATE POLICY "Service_role_can_manage_fee_notes"
ON education.fee_notes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Commentaires
COMMENT ON POLICY "Admins_and_bureau_can_manage_fee_payments" ON education.fee_payments IS
  'Permet aux admins et bureau de gérer tous les paiements';
COMMENT ON POLICY "Users_can_read_their_family_fee_payments" ON education.fee_payments IS
  'Permet aux utilisateurs de lire les paiements des fees de leur famille';
COMMENT ON POLICY "Admins_and_bureau_can_manage_fee_notes" ON education.fee_notes IS
  'Permet aux admins et bureau de gérer toutes les notes';
COMMENT ON POLICY "Users_can_read_their_family_fee_notes" ON education.fee_notes IS
  'Permet aux utilisateurs de lire les notes des fees de leur famille';
