# 🔥 Configuration Firebase Cloud Messaging pour Kwenda

## Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet : `kwenda-app`
4. Désactivez Google Analytics (optionnel)
5. Cliquez sur **"Créer le projet"**

## Étape 2 : Ajouter une application Android

1. Dans votre projet Firebase, cliquez sur l'icône **Android**
2. Remplissez les informations :
   - **Nom du package Android** : `app.lovable.e825ab5672bd4bcab1048ec14fdf48d8`
   - **Nom de l'application** : `Kwenda Client`
   - **Certificat SHA-1** : (voir étape 3)
3. Cliquez sur **"Enregistrer l'application"**

## Étape 3 : Obtenir le certificat SHA-1

Dans Android Studio, ouvrez le terminal et exécutez :

```bash
# Windows
cd android
.\gradlew signingReport

# Mac/Linux
cd android
./gradlew signingReport
```

Copiez la valeur **SHA1** de la variante `debug` et collez-la dans Firebase.

## Étape 4 : Télécharger google-services.json

1. Firebase vous proposera de télécharger `google-services.json`
2. **Téléchargez-le**
3. Placez-le dans : `android/app/google-services.json`

## Étape 5 : Configurer le projet Android

### 5.1 Modifier `android/build.gradle` (niveau projet)

Ajoutez dans `buildscript > dependencies` :

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        classpath 'com.google.gms:google-services:4.4.0'  // ← Ajouter cette ligne
    }
}
```

### 5.2 Modifier `android/app/build.gradle` (niveau app)

Ajoutez en haut du fichier :

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // ← Ajouter cette ligne
```

Ajoutez dans `dependencies` :

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    // ... autres dépendances
}
```

## Étape 6 : Enregistrer le token dans Supabase

L'application est déjà configurée pour :
1. Demander la permission de notifications
2. Obtenir le token FCM
3. L'enregistrer dans la table `push_notification_tokens`

## Étape 7 : Envoyer des notifications (Backend)

Pour envoyer des notifications depuis une Edge Function :

```typescript
// Exemple d'envoi de notification
const message = {
  to: fcmToken,
  notification: {
    title: "Nouvelle course !",
    body: "Un client vous attend"
  },
  data: {
    type: "transport",
    bookingId: "xxx"
  }
};

await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=${FIREBASE_SERVER_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(message)
});
```

## Étape 8 : Obtenir la clé serveur Firebase

1. Dans Firebase Console → Paramètres du projet → Cloud Messaging
2. Copiez la **"Clé du serveur"** (Server key)
3. Ajoutez-la comme secret Supabase : `FIREBASE_SERVER_KEY`

---

## ✅ Checklist finale

- [ ] Projet Firebase créé
- [ ] Application Android ajoutée avec le bon package
- [ ] `google-services.json` téléchargé et placé dans `android/app/`
- [ ] `build.gradle` (projet) modifié
- [ ] `build.gradle` (app) modifié
- [ ] Clé serveur Firebase ajoutée dans Supabase secrets
- [ ] Test de notification envoyé avec succès

---

## 🔧 Troubleshooting

### Les notifications ne fonctionnent pas

1. Vérifiez que `google-services.json` est au bon endroit
2. Vérifiez que le package ID correspond exactement
3. Reconstruisez l'app : `npx cap sync android && npx cap build android`

### Token non enregistré

1. Vérifiez la table `push_notification_tokens` dans Supabase
2. Vérifiez les logs de l'app pour voir le token

### Erreur "SENDER_ID mismatch"

1. Le `google-services.json` ne correspond pas au projet Firebase
2. Retéléchargez le fichier depuis Firebase Console
