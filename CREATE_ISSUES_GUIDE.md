# Guide de Création des Issues GitHub - MyCryptoPilot

## 🚀 Workflow Complet

### 1. Prérequis

**GitHub Personal Access Token:**
1. Allez sur GitHub → Settings → Developer settings → Personal access tokens
2. Cliquez sur "Generate new token" → "Generate new token (classic)"
3. Donnez un nom (ex: "MyCryptoPilot Issues")
4. Cochez la permission `repo:public_repo`
5. Générez et copiez le token

**Configuration:**
```bash
# Exporter le token (remplacez par votre vrai token)
export GITHUB_TOKEN=ghp_votre_vrai_token_ici
```

### 2. Utilisation du Script

```bash
# Méthode 1: Via npm/pnpm
pnpm create-issues

# Méthode 2: Directement avec Node
node scripts/create-issues.js
```

### 3. Configuration du Script

Dans `scripts/create-issues.js`, modifiez:

```javascript
const CONFIG = {
  owner: 'votre-org',           // Votre organisation GitHub
  repo: 'mycryptopilot',        // Nom du repository
  labels: ['user-story', 'phase-1', 'needs-triage'],
  assignees: ['dev1', 'dev2'], // Usernames des développeurs
};
```

### 4. Résultat Attendu

Le script va créer automatiquement des issues structurées avec:
- ✅ Titre formaté: `[US-XX] Titre de la fonctionnalité`
- ✅ Corps complet avec DoR/DoD
- ✅ Labels appropriés
- ✅ Assignation aux développeurs
- ✅ Checklist de validation

## 📋 Template d'Issue Complète

Chaque issue créée contient:

### Section User Story
```markdown
En tant que [rôle]
Je veux [capacité]
Afin de [valeur]
```

### Sections Techniques
- **Portée** (In/Out scope)
- **Dépendances** (APIs, rôles, schémas)
- **Design Notes** (Schémas DB, DTOs)
- **Telemetry** (Logs, métriques)
- **Sécurité** (ACL, rate-limit)

### Critères d'Acceptation BDD
```markdown
**Scenario 1: [Nom]**
Given [contexte]
When [action]
Then [résultat]
```

### DoD (Definition of Done)
- Checklist spécifique à l'US
- DoD global (qualité, tests, documentation)

## 🎯 Bonnes Pratiques

### Avant de lancer le script:
1. **Review du template**: Vérifiez `USER_STORIES.md`
2. **Configuration**: Mettez à jour `CONFIG` dans le script
3. **Team alignment**: Assurez-vous que l'équipe est d'accord avec les US

### Après création des issues:
1. **Triage**: Review et assignez les issues
2. **Priorisation**: Organisez par ordre de priorité
3. **Planning**: Estimez et planifiez le sprint

### Pendant le développement:
1. **DoR strict**: Ne commencez pas sans DoR validé
2. **DoD complet**: Ne terminez pas sans DoD validé
3. **Documentation**: Documentez pendant le développement

## 🔍 Exemple d'Issue Créée

```markdown
## US-01 — Mise à jour du Branding

**En tant que** propriétaire du projet
**Je veux** que l'application soit complètement rebrandée en MyCryptoPilot
**Afin de** créer une identité cohérente pour le produit de trading crypto

### Portée
**In scope** :
- Package.json mis à jour
- Configuration branding
- README mis à jour

### Critères d'Acceptation (BDD)
**Scenario 1: Configuration package.json**
Given le fichier package.json existe
When je mets à jour le nom du projet
Then le nom est "mycryptopilot"

### DoD Spécifique
- [ ] Package.json mis à jour
- [ ] Tests verts
- [ ] Documentation mise à jour

### Estimation
Simple - 1 jour/homme
```

## 🚨 Dépannage

### Erreurs courantes:

**GITHUB_TOKEN non défini:**
```bash
export GITHUB_TOKEN=ghp_votre_token
```

**Rate limit GitHub:**
Le script gère automatiquement les délais entre les créations

**Permissions insuffisantes:**
Vérifiez que votre token a la permission `repo:public_repo`

**Repository non trouvé:**
Vérifiez `owner` et `repo` dans la configuration

## 📊 Monitoring

Le script fournit un résumé détaillé:
- ✅ Nombre d'issues créées
- ❌ Échecs éventuels
- 🔗 Liens directs vers les issues

## 🔄 Workflow de Développement

1. **Création** → `pnpm create-issues`
2. **Triage** → Review et assignation
3. **Développement** → avec DoR/DoD stricts
4. **QA** → Validation DoD
5. **Merge** → DoD 100% validé

## 📚 Documentation Complémentaire

- [USER_STORY_TEMPLATE.md](./USER_STORY_TEMPLATE.md) - Template détaillé
- [scripts/README.md](./scripts/README.md) - Documentation des scripts
- [USER_STORIES.md](./USER_STORIES.md) - User Stories du projet

---

## 🎉 Prochaines Étapes

1. **Configurez votre GITHUB_TOKEN**
2. **Lancez `pnpm create-issues`**
3. **Review et assignez les issues créées**
4. **Commencez le développement !**

Ce workflow garantit une gestion rigoureuse des user stories avec une qualité et une traçabilité optimales.