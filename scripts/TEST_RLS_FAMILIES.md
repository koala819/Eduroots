# Guide de test des politiques RLS pour la table families

## 1. Vérification SQL (dans Supabase SQL Editor)

Exécutez le script `scripts/test-families-rls.sql` dans le SQL Editor de Supabase.

### Résultats attendus :

✅ **RLS activé** : `rls_enabled = true`
✅ **4 politiques** :
   - `Admins_and_bureau_can_manage_families` (ALL)
   - `Users_can_read_their_family` (SELECT)
   - `Authenticated_users_can_create_families` (INSERT)
   - `Service_role_can_manage_families` (ALL)

## 2. Test dans l'application

### Test 1 : Vérifier que la création automatique fonctionne

1. Allez sur `/admin/members`
2. Ouvrez le profil d'un étudiant qui a un `family_id` mais pas de famille dans `education.families`
3. Vérifiez que :
   - Les siblings s'affichent ✅
   - La famille est créée automatiquement (vérifier dans Supabase)
   - Le label de la famille s'affiche au lieu de "Famille non renseignée"

### Test 2 : Vérifier les permissions admin

1. Connectez-vous en tant qu'admin
2. Allez sur `/admin/members`
3. Vérifiez que vous pouvez voir toutes les familles

### Test 3 : Vérifier les permissions utilisateur

1. Connectez-vous en tant qu'utilisateur parent
2. Allez sur la page famille
3. Vérifiez que vous pouvez voir votre propre famille

## 3. Vérification dans les logs

Si la création automatique échoue, vérifiez les logs du serveur. Vous ne devriez plus voir :
```
new row violates row-level security policy for table "families"
```

## 4. Commandes SQL utiles

### Vérifier qu'une famille a été créée
```sql
SELECT * FROM education.families
WHERE id = 'af4f063d-871e-4173-b512-01e81c68e66d';
```

### Vérifier les utilisateurs d'une famille
```sql
SELECT id, firstname, lastname, family_id
FROM education.users
WHERE family_id = 'af4f063d-871e-4173-b512-01e81c68e66d';
```

### Compter les familles
```sql
SELECT COUNT(*) FROM education.families;
```

## 5. Dépannage

### Si RLS bloque encore la création

1. Vérifiez que vous êtes bien authentifié (pas en mode anon)
2. Vérifiez que les politiques existent :
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'families';
   ```
3. Vérifiez les rôles de l'utilisateur :
   ```sql
   SELECT id, email, role
   FROM education.users
   WHERE auth_id_email = auth.uid()
      OR auth_id_gmail = auth.uid();
   ```

### Si les politiques ne s'appliquent pas

1. Vérifiez que RLS est bien activé :
   ```sql
   SELECT rowsecurity FROM pg_tables
   WHERE tablename = 'families';
   ```
2. Redémarrez Supabase si nécessaire
3. Vérifiez que la migration a bien été appliquée
