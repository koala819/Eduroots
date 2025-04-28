# Guide de Contribution à EduRootS

Merci de votre intérêt pour contribuer à EduRootS ! Ce document fournit des directives et des informations pour vous aider à contribuer efficacement au projet.

## Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Processus de développement](#processus-de-développement)
- [Conventions de code](#conventions-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Questions et support](#questions-et-support)

## Code de conduite

En participant à ce projet, vous acceptez de respecter notre [Code de Conduite](CODE_OF_CONDUCT.md). Soyez respectueux, inclusif et collaboratif.

## Comment contribuer

1. **Fork du projet** : Commencez par créer un fork du projet sur GitHub.
2. **Clonez votre fork** : `git clone https://github.com/votre-username/eduroots.git`
3. **Créez une branche** : `git checkout -b feature/nom-de-votre-fonctionnalite`
4. **Apportez vos modifications** : Développez votre fonctionnalité ou corrigez le bug.
5. **Testez vos modifications** : Assurez-vous que tous les tests passent.
6. **Commitez vos changements** : Suivez nos conventions de commit.
7. **Poussez vers votre fork** : `git push origin feature/nom-de-votre-fonctionnalite`
8. **Ouvrez une Pull Request** : Créez une PR de votre fork vers notre dépôt principal.

## Processus de développement

- **Branches** :
  - `master` : Branche principale, contient le code en production
  - `dev` : Branche de développement, contient le code en cours de développement
  - `feature/*` : Branches pour les nouvelles fonctionnalités
  - `fix/*` : Branches pour les corrections de bugs
  - `docs/*` : Branches pour les modifications de documentation

- **Workflow** :
  1. Créez votre branche à partir de `dev`
  2. Développez et testez votre fonctionnalité
  3. Soumettez une PR vers `dev`
  4. Après revue et approbation, votre code sera fusionné dans `dev`
  5. Les fusions de `dev` vers `master` sont effectuées via des PR pour les releases

## Conventions de code

- **Style de code** : Nous utilisons ESLint et Prettier pour maintenir un style de code cohérent.
- **TypeScript** : Utilisez des types stricts et évitez `any`.
- **Nommage** :
  - Composants React : PascalCase (ex: `UserProfile.tsx`)
  - Fonctions et variables : camelCase (ex: `getUserData`)
  - Constantes : UPPER_SNAKE_CASE (ex: `MAX_RETRY_COUNT`)
  - Types et interfaces : PascalCase (ex: `UserData`)

- **Commits** : Suivez les [Conventional Commits](https://www.conventionalcommits.org/) :
  - `feat:` pour les nouvelles fonctionnalités
  - `fix:` pour les corrections de bugs
  - `docs:` pour les modifications de documentation
  - `style:` pour les modifications de formatage
  - `refactor:` pour les refactorisations
  - `test:` pour les ajouts ou modifications de tests
  - `chore:` pour les tâches de maintenance

  Pour les changements majeurs, utilisez :
  ```
  feat: add new authentication system

  BREAKING CHANGE: The authentication API has been completely redesigned.
  ```

## Tests

- **Tests unitaires** : Écrivez des tests pour toutes les nouvelles fonctionnalités.
- **Tests d'intégration** : Assurez-vous que les composants fonctionnent ensemble.
- **Couverture de code** : Maintenez une couverture de test élevée.
- **Exécution des tests** :
  ```bash
  # Tous les tests
  pnpm test

  # Tests API uniquement
  pnpm test:api

  # Tests DOM uniquement
  pnpm test:dom
  ```

## Documentation

- **Commentaires de code** : Documentez les fonctions complexes et les algorithmes.
- **Documentation des API** : Mettez à jour la documentation des API lorsque vous modifiez des endpoints.
- **README** : Mettez à jour le README si vous ajoutez des fonctionnalités ou modifiez le comportement existant.
- **Documentation utilisateur** : Mettez à jour la documentation utilisateur si nécessaire.

## Questions et support

- **Issues** : Utilisez les issues GitHub pour signaler des bugs ou proposer des fonctionnalités.
- **Discussions** : Utilisez la section Discussions pour poser des questions ou discuter d'idées.
- **Pull Requests** : Pour les questions concernant une PR en cours, utilisez les commentaires de la PR.

---

Merci de contribuer à EduRootS ! Votre aide est précieuse pour améliorer cette plateforme éducative.