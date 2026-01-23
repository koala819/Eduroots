-- Migration 010: Fix RLS policies to use auth_id_email/auth_id_gmail instead of id
-- Date: 2026-01-23
-- Description: Corriger les politiques RLS pour utiliser auth_id_email/auth_id_gmail au lieu de id
-- Problème: auth.uid() retourne l'ID Supabase Auth, pas l'ID de education.users

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEES
-- ============================================

-- Supprimer et recréer la politique pour les admins/bureau sur fees
DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fees" ON education.fees;

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

-- ============================================
-- CORRIGER LES POLITIQUES POUR FAMILIES
-- ============================================

-- Supprimer et recréer la politique pour les admins/bureau sur families
DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_families" ON education.families;

CREATE POLICY "Admins_and_bureau_can_manage_families"
ON education.families
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

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEE_PAYMENTS (si elles existent)
-- ============================================

-- Supprimer et recréer la politique pour les admins/bureau sur fee_payments
DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fee_payments" ON education.fee_payments;

CREATE POLICY "Admins_and_bureau_can_manage_fee_payments"
ON education.fee_payments
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

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEE_NOTES (si elles existent)
-- ============================================

-- Supprimer et recréer la politique pour les admins/bureau sur fee_notes
DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fee_notes" ON education.fee_notes;

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
