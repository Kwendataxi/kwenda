# 🔥 Configuration Firebase pour Kwenda

Ce dossier contient les fichiers de configuration Firebase pour les 3 applications Kwenda.

## 📁 Structure

```
firebase/
├── client/                    # Configuration app Client
│   ├── google-services.json   # Android (à télécharger)
│   └── GoogleService-Info.plist # iOS (à télécharger)
├── driver/                    # Configuration app Chauffeur
│   ├── google-services.json
│   └── GoogleService-Info.plist
├── partner/                   # Configuration app Partenaire
│   ├── google-services.json
│   └── GoogleService-Info.plist
└── templates/                 # Templates de référence
    ├── google-services.template.json
    └── GoogleService-Info.template.plist
```

## 🚀 Configuration rapide

### 1. Créer les projets Firebase

Allez sur [Firebase Console](https://console.firebase.google.com/) et créez un projet.

### 2. Ajouter les applications

Pour chaque type d'app, ajoutez une application Android ET iOS :

| App | Package Android | Bundle iOS |
|-----|-----------------|------------|
| Client | `cd.kwenda.client` | `cd.kwenda.client` |
| Driver | `cd.kwenda.driver` | `cd.kwenda.driver` |
| Partner | `cd.kwenda.partner` | `cd.kwenda.partner` |

### 3. Télécharger les fichiers

- **Android** : Téléchargez `google-services.json`
- **iOS** : Téléchargez `GoogleService-Info.plist`

### 4. Placer les fichiers

Placez les fichiers dans le dossier correspondant :
- `firebase/client/google-services.json`
- `firebase/client/GoogleService-Info.plist`
- etc.

### 5. Exécuter le script de configuration

```bash
node scripts/setup-firebase.js
```

## 📖 Documentation complète

Voir [FIREBASE_PUSH_COMPLETE.md](../FIREBASE_PUSH_COMPLETE.md) pour le guide détaillé.
