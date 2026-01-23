-- Script de test des politiques RLS pour families
-- À exécuter dans Supabase SQL Editor ou psql

-- ============================================
-- VÉRIFICATIONS DE BASE
-- ============================================

-- 1. Vérifier que RLS est activé (devrait retourner true)
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END as status
FROM pg_tables
WHERE schemaname = 'education'
  AND tablename = 'families';

-- 2. Lister toutes les politiques
SELECT
  policyname as "Nom de la politique",
  CASE cmd
    WHEN 'ALL' THEN 'Toutes opérations'
    WHEN 'SELECT' THEN 'Lecture'
    WHEN 'INSERT' THEN 'Insertion'
    WHEN 'UPDATE' THEN 'Modification'
    WHEN 'DELETE' THEN 'Suppression'
  END as "Type d'opération",
  CASE
    WHEN roles = '{authenticated}' THEN 'Utilisateurs authentifiés'
    WHEN roles = '{service_role}' THEN 'Service role'
    ELSE array_to_string(roles, ', ')
  END as "Rôles"
FROM pg_policies
WHERE schemaname = 'education'
  AND tablename = 'families'
ORDER BY policyname;

-- 3. Compter les politiques (devrait être 4)
SELECT
  COUNT(*) as "Nombre de politiques",
  CASE
    WHEN COUNT(*) = 4 THEN '✅ Correct'
    ELSE '❌ Problème: devrait être 4'
  END as status
FROM pg_policies
WHERE schemaname = 'education'
  AND tablename = 'families';

-- ============================================
-- TESTS PRATIQUES (nécessitent une session authentifiée)
-- ============================================

-- Note: Ces tests doivent être exécutés avec un utilisateur authentifié
-- dans l'application, pas directement dans SQL Editor

-- Test 1: Vérifier qu'un admin peut voir toutes les familles
-- (À tester dans l'application en tant qu'admin)

-- Test 2: Vérifier qu'un utilisateur peut créer une famille
-- (À tester via l'API/application)

-- Test 3: Vérifier qu'un utilisateur peut voir sa propre famille
-- (À tester dans l'application)

-- ============================================
-- VÉRIFICATION DES PERMISSIONS
-- ============================================

SELECT
  grantee as "Rôle",
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as "Permissions"
FROM information_schema.role_table_grants
WHERE table_schema = 'education'
  AND table_name = 'families'
GROUP BY grantee
ORDER BY grantee;
