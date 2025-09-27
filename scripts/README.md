# Scripts MyCryptoPilot

Ce dossier contient les scripts d'automatisation pour le projet MyCryptoPilot.

## create-issues.js

### Description
Script de création automatique des issues GitHub basé sur le template User Story.

### Usage
```bash
# Utilisation directe
node scripts/create-issues.js

# Via npm/pnpm
pnpm create-issues
```

### Prérequis
1. **GITHUB_TOKEN**: Créer un personal access token sur GitHub avec permissions `repo:public_repo`
   ```bash
   export GITHUB_TOKEN=ghp_votre_token_ici
   ```

2. **Dépendances**: Le script nécessite `@octokit/rest` (déjà installé)

### Configuration
Modifier les constantes dans le script :
- `CONFIG.owner`: Votre organisation GitHub
- `CONFIG.repo`: Le nom du repository
- `CONFIG.assignees`: Liste des usernames à assigner

### Fonctionnalités
- Crée des issues structurées à partir du template US
- Applique les labels automatiquement
- Formate le corps selon le DoR/DoD
- Gère les erreurs et rate limits
- Fournit un résumé des opérations

### Exemple de sortie
```
🚀 Démarrage de la création des issues GitHub pour MyCryptoPilot...

📋 Configuration:
   Repository: votre-org/mycryptopilot
   Nombre d'issues à créer: 20
   Assignees: developer1, developer2

✅ Issue créée: #123 - US-01: Mise à jour du Branding
✅ Issue créée: #124 - US-02: Structure de Données Initiale
...

📊 Résumé:
✅ Issues créées: 20/20
❌ Échecs: 0

🔗 Liens vers les issues créées:
   #123: https://github.com/votre-org/mycryptopilot/issues/123
   #124: https://github.com/votre-org/mycryptopilot/issues/124
```

## Notes importantes

- Le script inclut un délai entre chaque création pour respecter les rate limits GitHub
- Les erreurs sont gérées gracieusement pour ne pas arrêter le processus
- Le format respecte le DoR (Definition of Ready) et DoD (Definition of Done)
- Toutes les issues sont créées avec le label `needs-triage` pour revue

## Workflow recommandé

1. **Préparation**: Compléter le fichier `USER_STORIES.md`
2. **Configuration**: Mettre à jour `CONFIG` dans le script
3. **Création**: Lancer le script
4. **Review**: Trier et assigner les issues créées
5. **Développement**: Commencer le travail sur les issues validées (DoR)