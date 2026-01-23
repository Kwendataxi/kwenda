# 📱 Guide de Build Android - Kwenda

## Prérequis

- **Node.js** 18+ 
- **Android Studio** avec SDK 34
- **Java JDK** 17 (inclus avec Android Studio)
- **ANDROID_HOME** configurée

---

## 🚀 Build rapide (script automatique)

```bash
# Exécuter le script de build complet
./scripts/build-android.sh
```

---

## 📋 Build manuel étape par étape

### 1. Préparer le projet

```bash
git pull origin main
npm install
```

### 2. Supprimer l'ancien dossier Android

```bash
rm -rf android
```

### 3. Construire l'application web

```bash
npm run build
```

### 4. Ajouter Android avec Capacitor

```bash
npx cap add android
```

### 5. Synchroniser les plugins

```bash
npx cap sync android
```

### 6. Configurer Firebase

```bash
cp ~/Downloads/google-services.json android/app/google-services.json
```

### 7. Ouvrir dans Android Studio

```bash
npx cap open android
```

---

## 📦 Générer l'AAB signé

### Dans Android Studio :

1. **Build > Generate Signed Bundle / APK**
2. Sélectionner **Android App Bundle**
3. Créer ou sélectionner votre keystore
4. Choisir **release**
5. Fichier généré : `android/app/release/app-release.aab`

### Créer un keystore (première fois) :

```bash
keytool -genkey -v -keystore kwenda-release.keystore \
  -alias kwenda \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

⚠️ **Conservez précieusement ce fichier et les mots de passe !**

---

## 🔧 Scripts npm disponibles

| Commande | Description |
|----------|-------------|
| `npm run build` | Build web production |
| `npm run cap:sync` | Synchroniser Capacitor |
| `npm run cap:open:android` | Ouvrir Android Studio |
| `npm run android:build` | Build complet Android |

---

## 📁 Structure Android générée

```
android/
├── app/
│   ├── build.gradle
│   ├── google-services.json
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/cd/kwenda/app/
│       └── assets/public/
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── build.gradle
└── variables.gradle
```

---

## ⚙️ Configuration Capacitor

**Fichier** : `capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
  appName: 'Kwenda',
  webDir: 'dist',
  // ...
};
```

---

## 🔥 Configuration Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Projet : `kwenda-app`
3. Ajouter app Android : `cd.kwenda.app`
4. Télécharger `google-services.json`
5. Copier dans `android/app/`

---

## 🐛 Dépannage

### "gradlew not found"
```bash
rm -rf android && npx cap add android
```

### "SDK not found"
Ouvrir Android Studio > SDK Manager > Installer SDK 34

### "google-services.json missing"
Télécharger depuis Firebase Console

### Build échoue
```bash
cd android && ./gradlew clean && cd ..
npx cap sync android
```

---

## 📊 Informations Play Store

| Paramètre | Valeur |
|-----------|--------|
| Package | `cd.kwenda.app` |
| Catégorie | Cartes et navigation |
| Classification | Tout public (PEGI 3) |
| Pays cible | RDC |
| Langues | Français, Anglais |

---

## ✅ Checklist publication

- [ ] `google-services.json` configuré
- [ ] Keystore sauvegardé
- [ ] Icône 512x512 PNG
- [ ] Feature Graphic 1024x500
- [ ] 8+ captures d'écran
- [ ] Politique de confidentialité (URL)
- [ ] Test sur appareil physique
- [ ] AAB signé généré
