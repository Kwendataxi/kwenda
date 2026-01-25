
# Correction Complete du Systeme de Localisation et Dispatching

## Problemes Identifies

| Probleme | Cause | Impact |
|----------|-------|--------|
| **Carte grise / erreur Maps** | Edge Function `get-google-maps-key` echoue avec erreur "duplicate key constraint" sur `api_rate_limits` | La cle API ne retourne pas, Maps ne charge pas |
| **GPS Mobile ne fonctionne pas** | Deux fichiers `useSmartGeolocation.ts` et `.tsx` en conflit, le bundler peut importer le mauvais | Comportement imprevisible du GPS |
| **useGeolocation.tsx independant** | Ce fichier a sa propre logique Capacitor au lieu de deleguer a `nativeGeolocationService` | Incoherence entre composants |
| **Crash ClientApp.tsx** | Echec import dynamique, probablement lie aux erreurs Maps en cascade | Application ne charge pas |

---

## Solution 1 : Corriger get-google-maps-key (Rate Limit)

**Fichier** : `supabase/functions/get-google-maps-key/index.ts`

Le probleme est dans la fonction `checkRateLimit` qui utilise `.upsert()` sans gerer correctement le conflit.

```typescript
// AVANT (ligne 57)
const { error: upsertError } = await supabase.from('api_rate_limits').upsert({
  user_id: userId,
  endpoint: RATE_LIMIT_ENDPOINT,
  request_count: 1,
  reset_at: resetTime.toISOString()
})

// APRES - Ajouter onConflict explicite
const { error: upsertError } = await supabase.from('api_rate_limits').upsert({
  user_id: userId,
  endpoint: RATE_LIMIT_ENDPOINT,
  request_count: 1,
  reset_at: resetTime.toISOString()
}, {
  onConflict: 'user_id,endpoint',       // Specifier les colonnes de conflit
  ignoreDuplicates: false               // Mettre a jour en cas de conflit
})
```

De plus, envelopper l'upsert dans un try-catch pour ne pas bloquer si le rate limit echoue.

---

## Solution 2 : Fusionner les fichiers useSmartGeolocation

**Probleme** : Deux fichiers existent :
- `src/hooks/useSmartGeolocation.ts` (1056 lignes)
- `src/hooks/useSmartGeolocation.tsx` (398 lignes)

**Action** :
1. Supprimer `src/hooks/useSmartGeolocation.ts` (ancienne version)
2. Renommer `useSmartGeolocation.tsx` en `useSmartGeolocation.ts`
3. S'assurer que tous les imports pointent vers le bon fichier

Le fichier `.tsx` est la version correcte car elle :
- Utilise `nativeGeolocationService` (ligne 11)
- A le retry progressif avec timeouts de 15s/20s/25s
- A le cache TTL de 2 minutes

---

## Solution 3 : Simplifier useGeolocation.tsx

**Fichier** : `src/hooks/useGeolocation.tsx` (490 lignes)

Ce fichier a sa propre implementation Capacitor au lieu d'utiliser le service centralise.

**Modifier pour deleguer a nativeGeolocationService** :

```typescript
// AVANT (ligne 124-159) - Logique Capacitor dupliquee
if (isCapacitorAvailable()) {
  position = await Geolocation.getCurrentPosition({...});
} else {
  const browserPosition = await getBrowserLocation({...});
  position = {...};
}

// APRES - Utiliser le service centralise
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

// Dans getCurrentPosition
const hasPermission = await nativeGeolocationService.ensurePermissions();
if (!hasPermission) throw new Error('PERMISSION_DENIED');

const nativePos = await nativeGeolocationService.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: forceRefresh ? 0 : 60000
});

const position = {
  coords: {
    latitude: nativePos.lat,
    longitude: nativePos.lng,
    accuracy: nativePos.accuracy
  },
  timestamp: nativePos.timestamp
} as GeolocationPosition;
```

---

## Solution 4 : Ajouter fallback cle API en dur (secours)

Pour eviter que l'application soit completement bloquee si l'Edge Function echoue, ajouter un fallback dans `googleMapsLoader.ts`:

```typescript
// Dans getApiKey() apres tous les retries
async getApiKey(): Promise<string> {
  if (this.apiKey) {
    return this.apiKey;
  }

  try {
    // Code existant pour fetch depuis Supabase...
  } catch (error) {
    console.error('Failed to fetch API key from Supabase');
    
    // FALLBACK de secours si Edge Function echoue
    // Note: Cette cle est restreinte par domaine dans Google Cloud Console
    const FALLBACK_API_KEY = 'AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc';
    console.warn('Using fallback Google Maps API key');
    this.apiKey = FALLBACK_API_KEY;
    return FALLBACK_API_KEY;
  }
}
```

---

## Solution 5 : Corriger ClientLocationPicker (Google Maps)

**Fichier** : `src/components/marketplace/ClientLocationPicker.tsx`

Ce composant attend que `apiKey` soit charge avant de rendre la carte. Mais si la fonction echoue, il reste bloque en loading.

```typescript
// APRES ligne 45 - Ajouter fallback si echec
useEffect(() => {
  const loadApiKey = async () => {
    try {
      const key = await googleMapsLoader.getApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Erreur chargement cle Google Maps:', error);
      // Fallback avec cle web
      setApiKey('AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc');
    }
  };
  loadApiKey();
}, []);
```

---

## Solution 6 : Dispatcher - Verifier les permissions de la fonction RPC

Les Edge Functions `ride-dispatcher` et `delivery-dispatcher` utilisent `find_nearby_drivers` RPC.

Verifier que cette fonction PostgreSQL existe et retourne les bons champs. Si elle retourne 0 chauffeurs, le dispatch echouera.

Le dispatching lui-meme semble correct d'apres le code analyse. Le probleme est probablement que les chauffeurs n'ont pas de positions mises a jour dans `driver_locations` car le GPS ne fonctionne pas.

---

## Resume des Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/get-google-maps-key/index.ts` | Corriger upsert avec onConflict explicite |
| `src/hooks/useSmartGeolocation.ts` | **SUPPRIMER** (ancien fichier) |
| `src/hooks/useSmartGeolocation.tsx` | Renommer en `.ts` et conserver comme hook principal |
| `src/hooks/useGeolocation.tsx` | Deleguer a nativeGeolocationService |
| `src/services/googleMapsLoader.ts` | Ajouter fallback cle API |
| `src/components/marketplace/ClientLocationPicker.tsx` | Ajouter fallback cle API |

---

## Flux Corrige

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHARGEMENT GOOGLE MAPS                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. googleMapsLoader.getApiKey()                                            │
│     ├─ Appel Edge Function get-google-maps-key                              │
│     ├─ Rate limit gere avec onConflict correct                              │
│     ├─ ✅ Succes → Retourne cle API depuis Supabase secrets                 │
│     └─ ❌ Echec → Utilise cle fallback hardcodee                            │
│                                                                             │
│  2. Injection script Google Maps avec cle                                   │
│                                                                             │
│  3. Attente google.maps.Map soit un constructeur valide                     │
│                                                                             │
│  4. ✅ Carte prete                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  GEOLOCALISATION UNIFIEE                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. useSmartGeolocation (hook unique .ts)                                   │
│     └─ Appelle nativeGeolocationService                                     │
│                                                                             │
│  2. nativeGeolocationService detecte la plateforme                          │
│     ├─ Web → navigator.geolocation                                          │
│     └─ Mobile → @capacitor/geolocation                                      │
│                                                                             │
│  3. Retry progressif: 15s → 20s → 25s                                       │
│                                                                             │
│  4. Fallback IP si tout echoue                                              │
│                                                                             │
│  5. Geocodage inverse via geocode-proxy                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cles API Utilisees

| Plateforme | Cle | Configuration |
|------------|-----|---------------|
| **Web (Supabase secret)** | `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc` | GOOGLE_MAPS_API_KEY ✅ |
| **Android (AndroidManifest.xml)** | `AIzaSyBlyaBgTzhJZKZTT1xhqhiZy62lFrmyodw` | ✅ |
| **iOS (Info.plist)** | `AIzaSyAvF9fFaNIwFQOvVxgtTiu6POK-Hr9wClk` | A verifier |

---

## Checklist Dispatching

Le dispatching (taxi et livraison) depend du GPS fonctionnel :

1. **Chauffeurs** : Doivent avoir leur position mise a jour dans `driver_locations` via `useDriverLocation.ts`
2. **RPC `find_nearby_drivers`** : Cherche les chauffeurs proches avec `is_online=true` et `is_available=true`
3. **Si GPS KO** : Les chauffeurs n'ont pas de positions recentes → dispatch retourne 0 resultats

Une fois le GPS corrige, le dispatching devrait fonctionner automatiquement.

---

## Ordre d'Execution

1. **Corriger get-google-maps-key** (resolution erreur Maps immediate)
2. **Supprimer useSmartGeolocation.ts duplique** (eviter conflits imports)
3. **Mettre a jour useGeolocation.tsx** (coherence GPS)
4. **Ajouter fallbacks cle API** (resilience)
5. **Redeployer get-google-maps-key** (activation correction)
6. **Tester sur mobile avec build fraiche** (`npx cap sync` + rebuild)
