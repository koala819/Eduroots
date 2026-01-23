-- Script de vérification des politiques RLS pour la table families
-- Ce script peut être exécuté pour vérifier que tout est correctement configuré

-- 1. Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'education'
  AND tablename = 'families';

-- 2. Lister toutes les politiques RLS sur la table families
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'education'
  AND tablename = 'families'
ORDER BY policyname;

-- 3. Vérifier les permissions sur la table
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'education'
  AND table_name = 'families'
ORDER BY grantee, privilege_type;

-- 4. Compter le nombre de politiques (devrait être 4)
SELECT 
  COUNT(*) as policy_count,
  'Devrait être 4' as expected
FROM pg_policies
WHERE schemaname = 'education'
  AND tablename = 'families';

-- 5. Vérifier que les politiques ont les bonnes commandes
SELECT 
  policyname,
  cmd as command_type,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lecture'
    WHEN cmd = 'INSERT' THEN 'Insertion'
    WHEN cmd = 'UPDATE' THEN 'Modification'
    WHEN cmd = 'DELETE' THEN 'Suppression'
    WHEN cmd = 'ALL' THEN 'Toutes opérations'
  END as description
FROM pg_policies
WHERE schemaname = 'education'
  AND tablename = 'families'
ORDER BY 
  CASE cmd
    WHEN 'ALL' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'INSERT' THEN 3
    WHEN 'UPDATE' THEN 4
    WHEN 'DELETE' THEN 5
  END;
