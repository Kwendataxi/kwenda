# 🏗️ Instructions de Build Multi-Apps Kwenda

Ce guide explique comment construire et déployer les 3 applications mobiles Kwenda à partir de cette codebase unique.

## 📱 Applications Disponibles

1. **Kwenda Client** (`cd.kwenda.client`) - App grand public
2. **Kwenda Driver** (`cd.kwenda.driver`) - App chauffeurs/livreurs
3. **Kwenda Partner** (`cd.kwenda.partner`) - App partenaires/gestionnaires

---

## 🚀 Build Rapide

### Build Automatique des 3 Apps

```bash
# Rendre le script exécutable (une seule fois)
chmod +x scripts/build-all.sh

# Lancer le build des 3 apps
./scripts/build-all.sh
```

### Build Manuel App par App

#### 1. Kwenda Client (Rouge)

```bash
# Build web
npm run build -- --mode client

# Copier la config Capacitor
cp capacitor.config.client.ts capacitor.config.ts

# Sync native
npx cap sync

# Ouvrir dans l'IDE
npx cap open android  # ou ios
```

#### 2. Kwenda Driver (Jaune)

```bash
# Build web
npm run build -- --mode driver

# Copier la config Capacitor
cp capacitor.config.driver.ts capacitor.config.ts

# Sync native
npx cap sync

# Ouvrir dans l'IDE
npx cap open android  # ou ios
```

#### 3. Kwenda Partner (Vert)

```bash
# Build web
npm run build -- --mode partner

# Copier la config Capacitor
cp capacitor.config.partner.ts capacitor.config.ts

# Sync native
npx cap sync

# Ouvrir dans l'IDE
npx cap open android  # ou ios
```

---

## 🛠️ Prérequis

### Tous les builds

```bash
npm install
```

### Android

- **Android Studio** installé
- **Java JDK 11+**
- **Android SDK** avec API 21+
- Gradle configuré

### iOS (Mac uniquement)

- **Xcode 14+** installé
- **CocoaPods** : `sudo gem install cocoapods`
- Compte Apple Developer

---

## 📋 Workflow Détaillé

### Étape 1 : Développement Web

Pendant le développement, l'app se comporte comme l'app complète (toutes routes disponibles) :

```bash
npm run dev
```

### Étape 2 : Build Spécifique

Choisir l'app à build en utilisant le mode Vite :

```bash
# Client
npm run build -- --mode client

# Driver
npm run build -- --mode driver

# Partner
npm run build -- --mode partner
```

**Ce que fait le build spécifique** :
- Charge les variables d'environnement `.env.{client|driver|partner}`
- Configure `APP_CONFIG` avec le type d'app
- Filtre les routes dans `App.tsx` (seules les routes de l'app sont incluses)
- Génère un bundle optimisé

### Étape 3 : Copier Assets Spécifiques

```bash
# Automatique via prebuild scripts
VITE_APP_TYPE=client node scripts/copy-assets.js
VITE_APP_TYPE=client node scripts/generate-manifest.js
```

### Étape 4 : Configuration Capacitor

```bash
# Copier la bonne config
cp capacitor.config.client.ts capacitor.config.ts

# Synchroniser
npx cap sync
```

### Étape 5 : Build Native

#### Android

```bash
# Ouvrir dans Android Studio
npx cap open android

# Ou build en ligne de commande
cd android
./gradlew assembleRelease

# APK généré dans:
# android/app/build/outputs/apk/release/app-release.apk
```

#### iOS

```bash
# Ouvrir dans Xcode
npx cap open ios

# Dans Xcode:
# 1. Sélectionner le scheme "App"
# 2. Product > Archive
# 3. Distribuer sur App Store ou AdHoc
```

---

## 🎨 Personnalisation par App

### Variables d'Environnement

Chaque app a son fichier `.env.{type}` :

```env
# .env.client
VITE_APP_TYPE=client
VITE_APP_NAME=Kwenda Client
VITE_APP_ID=cd.kwenda.client
VITE_PRIMARY_COLOR=#DC2626
VITE_DEFAULT_ROUTE=/client
VITE_AUTH_ROUTE=/auth
```

### Assets Personnalisés

Structure :

```
public/icons/
├── client/
│   ├── icon-192.png (rouge)
│   ├── icon-512.png
│   ├── icon-1024.png
│   └── splash.png
├── driver/
│   ├── icon-192.png (jaune)
│   └── ...
└── partner/
    ├── icon-192.png (vert)
    └── ...
```

### Capacitor Config

Chaque app a sa config :

- **Client** : `capacitor.config.client.ts` - Permissions basiques
- **Driver** : `capacitor.config.driver.ts` - GPS background activé
- **Partner** : `capacitor.config.partner.ts` - Permissions réduites

---

## 🧪 Tests Avant Soumission

### Checklist par App

- [ ] Build réussit sans erreurs
- [ ] Taille du bundle raisonnable (<20MB)
- [ ] Routes non pertinentes sont absentes
- [ ] Icônes et splash screen corrects
- [ ] Manifest.json adapté
- [ ] Permissions natives appropriées
- [ ] Tests sur émulateur Android
- [ ] Tests sur simulateur iOS
- [ ] Tests sur device physique

### Commandes de Test

```bash
# Tester le build
npm run build -- --mode client
npm run build -- --mode driver
npm run build -- --mode partner

# Vérifier la taille des bundles
ls -lh dist/assets/

# Analyser les bundles
npm run build -- --mode client -- --sourcemap
```

---

## 📦 Génération des APK/AAB Finaux

### Android Release

#### APK (pour tests)

```bash
cd android
./gradlew assembleRelease
```

APK généré dans : `android/app/build/outputs/apk/release/`

#### AAB (pour Google Play)

```bash
cd android
./gradlew bundleRelease
```

AAB généré dans : `android/app/build/outputs/bundle/release/`

### iOS Release

```bash
# Ouvrir Xcode
npx cap open ios

# Dans Xcode:
# 1. Sélectionner "Any iOS Device"
# 2. Product > Archive
# 3. Window > Organizer
# 4. Distribute App > App Store Connect
```

---

## 🔐 Signature des Apps

### Android

Créer un keystore (une fois) :

```bash
keytool -genkey -v -keystore kwenda-release.keystore \
  -alias kwenda -keyalg RSA -keysize 2048 -validity 10000
```

Configurer dans `android/app/build.gradle` :

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../kwenda-release.keystore")
            storePassword "VOTRE_PASSWORD"
            keyAlias "kwenda"
            keyPassword "VOTRE_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS

Configurer dans Xcode :

1. Signing & Capabilities
2. Sélectionner votre Team
3. Automatic Signing recommandé

---

## 📊 Différences entre les Builds

| Fonctionnalité | Client | Driver | Partner |
|---|---|---|---|
| **App ID** | cd.kwenda.client | cd.kwenda.driver | cd.kwenda.partner |
| **Couleur** | Rouge #DC2626 | Jaune #F59E0B | Vert #10B981 |
| **Routes Client** | ✅ | ❌ | ❌ |
| **Routes Driver** | ❌ | ✅ | ❌ |
| **Routes Partner** | ❌ | ❌ | ✅ |
| **GPS Background** | ❌ | ✅ | ❌ |
| **Marketplace** | ✅ | ❌ | ❌ |
| **Gestion Flotte** | ❌ | ❌ | ✅ |
| **Taille Bundle** | ~15MB | ~12MB | ~10MB |

---

## 🐛 Troubleshooting

### Build échoue

```bash
# Nettoyer le cache
rm -rf node_modules dist .vite
npm install
npm run build -- --mode client
```

### Capacitor Sync échoue

```bash
# Supprimer les dossiers natifs
rm -rf android ios
npx cap add android
npx cap add ios
npx cap sync
```

### Assets manquants

```bash
# Regénérer les assets
VITE_APP_TYPE=client node scripts/copy-assets.js
VITE_APP_TYPE=client node scripts/generate-manifest.js
```

### Mauvaise app affichée

Vérifier que :
1. La bonne config Capacitor est copiée
2. Le mode Vite est correct
3. `npx cap sync` a été exécuté après le build

---

## 🚀 Workflow de Production

### Scénario : Publier les 3 apps

```bash
# 1. Version bump (package.json et Capacitor configs)
# Incrémenter manuellement les versions

# 2. Build des 3 apps
./scripts/build-all.sh

# 3. Pour chaque app, copier la bonne config et générer
# CLIENT
cp capacitor.config.client.ts capacitor.config.ts
npx cap sync
npx cap open android  # Build & sign
npx cap open ios      # Archive & upload

# DRIVER
cp capacitor.config.driver.ts capacitor.config.ts
npx cap sync
# ... répéter

# PARTNER
cp capacitor.config.partner.ts capacitor.config.ts
npx cap sync
# ... répéter
```

---

## 📞 Support

Pour toute question sur le build :

- **Documentation** : Voir `STORE_CLIENT.md`, `STORE_DRIVER.md`, `STORE_PARTNER.md`
- **Capacitor Docs** : https://capacitorjs.com
- **Vite Docs** : https://vitejs.dev

---

**🎉 Bonne chance pour vos soumissions sur les stores !**
