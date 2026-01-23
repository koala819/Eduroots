-- Migration 011: Fix RLS policies to use JWT user_metadata instead of education.users
-- Date: 2026-01-23
-- Description: Utiliser auth.jwt() pour vérifier le rôle admin/bureau directement depuis les métadonnées JWT
-- Plus sûr : le rôle est défini lors de la création du compte dans Supabase Auth

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEES
-- ============================================

DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fees" ON education.fees;

CREATE POLICY "Admins_and_bureau_can_manage_fees"
ON education.fees
FOR ALL
TO authenticated
USING (
  -- Vérifier le rôle directement dans les métadonnées JWT
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
);

-- ============================================
-- CORRIGER LES POLITIQUES POUR FAMILIES
-- ============================================

DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_families" ON education.families;

CREATE POLICY "Admins_and_bureau_can_manage_families"
ON education.families
FOR ALL
TO authenticated
USING (
  -- Vérifier le rôle directement dans les métadonnées JWT
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
);

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEE_PAYMENTS
-- ============================================

DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fee_payments" ON education.fee_payments;

CREATE POLICY "Admins_and_bureau_can_manage_fee_payments"
ON education.fee_payments
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
);

-- ============================================
-- CORRIGER LES POLITIQUES POUR FEE_NOTES
-- ============================================

DROP POLICY IF EXISTS "Admins_and_bureau_can_manage_fee_notes" ON education.fee_notes;

CREATE POLICY "Admins_and_bureau_can_manage_fee_notes"
ON education.fee_notes
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text IN ('admin', 'bureau')
);

-- Commentaires
COMMENT ON POLICY "Admins_and_bureau_can_manage_fees" ON education.fees IS
  'Permet aux admins et bureau de gérer tous les fees - vérifie le rôle dans les métadonnées JWT';
COMMENT ON POLICY "Admins_and_bureau_can_manage_families" ON education.families IS
  'Permet aux admins et bureau de gérer toutes les familles - vérifie le rôle dans les métadonnées JWT';
