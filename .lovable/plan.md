
# Correction Erreur RefererNotAllowedMapError - Google Maps

## Diagnostic Final

L'erreur **RefererNotAllowedMapError** est causée par des **restrictions de référent (referer)** incorrectes dans Google Cloud Console pour la clé API Web.

### Erreur Console
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com/transport
```

### État Actuel

| Clé API | Usage | Valeur | Restrictions |
|---------|-------|--------|--------------|
| **GOOGLE_MAPS_API_KEY** (secret Supabase) | Web (Edge Functions + Frontend) | `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc` | ❌ **Bloquée** - N'autorise PAS les URLs Lovable |
| Android API Key | AndroidManifest.xml | `AIzaSyBlyaBgTzhJZKZTT1xhqhiZy62lFrmyodw` | ✅ Restrictions Android (package name) |
| iOS API Key | Info.plist | `AIzaSyAvF9fFaNIwFQOvVxgtTiu6POK-Hr9wClk` | ✅ Restrictions iOS (bundle ID) |

---

## Problème

La clé API Web `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc` est correctement récupérée (log : `✅ Google Maps API key received`), mais Google Maps rejette la requête car l'URL `https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com` **n'est pas autorisée** dans les restrictions de référent de la clé.

---

## Solution : Configurer les Restrictions de Référent dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console

1. Aller sur [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Sélectionner le projet Google Maps actif
3. Trouver la clé API `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc`

### Étape 2 : Modifier les Restrictions de Référent

Dans la section **Application restrictions** → **Website restrictions**, ajouter les patterns suivants :

```
https://kwenda.lovable.app/*
https://*.lovable.app/*
https://*.lovableproject.com/*
https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com/*
http://localhost:*/*
http://127.0.0.1:*/*
```

**Explications** :
- `https://kwenda.lovable.app/*` : Site publié
- `https://*.lovable.app/*` : Wildcard pour tous les sous-domaines
- `https://*.lovableproject.com/*` : URLs de preview Lovable
- `http://localhost:*/*` : Développement local
- `http://127.0.0.1:*/*` : Développement local (IP)

### Étape 3 : Sauvegarder et Attendre la Propagation

- Cliquer sur **Save**
- Attendre 1-5 minutes pour que les modifications se propagent
- Recharger la page `/transport` dans l'application

---

## Alternative : Créer une Nouvelle Clé API (Si Accès Limité)

Si vous n'avez pas accès à la clé existante ou si elle appartient à un autre projet :

### 1. Créer une Nouvelle Clé API

1. [Google Cloud Console - Create Credentials](https://console.cloud.google.com/apis/credentials/wizard)
2. Sélectionner **API key**
3. Nommer : `Kwenda-Web-API-Key`
4. Dans **Application restrictions** :
   - Sélectionner **HTTP referrers (web sites)**
   - Ajouter les patterns ci-dessus
5. Dans **API restrictions** :
   - Sélectionner **Restrict key**
   - Cocher :
     - Maps JavaScript API
     - Geocoding API
     - Places API
     - Directions API
     - Distance Matrix API

### 2. Mettre à Jour le Secret Supabase

1. Dans Lovable, aller dans **Settings** → **Secrets**
2. Mettre à jour `GOOGLE_MAPS_API_KEY` avec la nouvelle clé
3. Recharger l'application

---

## Solution Temporaire (Développement Seulement)

### Option 1 : Créer une Clé Sans Restrictions

**⚠️ Attention : Utiliser uniquement pour le développement, jamais en production !**

1. Créer une clé API avec **No restrictions** sur Application restrictions
2. Remplacer temporairement le secret `GOOGLE_MAPS_API_KEY`
3. Une fois le développement terminé, ajouter les restrictions appropriées

### Option 2 : Utiliser une Clé Unrestricted Existante

Si vous avez déjà une clé Google Maps sans restrictions pour les tests, vous pouvez :
- Mettre à jour `GOOGLE_MAPS_API_KEY` dans Supabase
- Tester immédiatement
- Configurer les restrictions ensuite

---

## Vérification des Autres Clés API

Les clés Android et iOS ont déjà les bonnes restrictions :

### Android (`AIzaSyBlyaBgTzhJZKZTT1xhqhiZy62lFrmyodw`)
- **Restriction** : Android apps avec package name `com.kwenda.vtc`
- **Status** : ✅ Correct (restrictions par package)

### iOS (`AIzaSyAvF9fFaNIwFQOvVxgtTiu6POK-Hr9wClk`)
- **Restriction** : iOS apps avec bundle ID `com.kwenda.app`
- **Status** : ✅ Correct (restrictions par bundle)

Ces clés ne nécessitent **aucune modification**.

---

## Flux Après Correction

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHARGEMENT GOOGLE MAPS - FLUX CORRIGÉ                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Frontend appelle get-google-maps-key Edge Function                      │
│                                                                             │
│  2. Edge Function retourne :                                                │
│     └─ apiKey: "AIzaSyAOlkwFPy5..." ✅                                      │
│     └─ mapId: null (invalide, mais OK)                                      │
│                                                                             │
│  3. googleMapsLoader charge le script avec apiKey                           │
│                                                                             │
│  4. Google Maps vérifie le référent (referer)                               │
│     └─ ✅ Autorisé : *.lovableproject.com dans les restrictions             │
│                                                                             │
│  5. Carte s'initialise correctement                                         │
│     └─ Marqueurs, routes, géocodage fonctionnent ✅                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Vérification Post-Correction

Après avoir ajouté les restrictions de référent dans Google Cloud Console :

1. ✅ Attendre 1-5 minutes (propagation Google)
2. ✅ Recharger la page `/transport` (Ctrl+F5 / Cmd+Shift+R)
3. ✅ Ouvrir la console JavaScript (F12)
4. ✅ Vérifier l'absence de `RefererNotAllowedMapError`
5. ✅ Confirmer que la carte s'affiche correctement
6. ✅ Tester la géolocalisation (bouton GPS)
7. ✅ Tester la recherche d'adresse (Places API)
8. ✅ Tester le calcul d'itinéraire (Directions API)

---

## Résumé des Actions Requises

| Action | Qui | Quand | Priorité |
|--------|-----|-------|----------|
| Ajouter restrictions de référent dans Google Cloud Console | **Vous** (utilisateur avec accès Google Cloud) | **Maintenant** | 🔴 Critique |
| Vérifier que les APIs nécessaires sont activées (Maps JS, Geocoding, Places, Directions) | **Vous** | Après restrictions | 🟡 Important |
| Recharger l'application et tester | **Vous** | Après propagation (1-5 min) | ✅ Validation |

---

## Note Importante

**Aucune modification de code n'est nécessaire.** Le problème est uniquement dans la **configuration Google Cloud Console**. Une fois les restrictions de référent correctement configurées, Google Maps fonctionnera immédiatement sans rebuild ni redéploiement.

Les fallbacks en dur dans le code (`googleMapsLoader.ts`, `ClientLocationPicker.tsx`) utilisent la même clé, donc ils sont également bloqués par les restrictions. La solution doit être appliquée au niveau de Google Cloud Console.
