
# Correction Erreur Interne + Geolocalisation Web/Mobile

## Problemes Identifies

### 1. Erreur Interne (complete-ride-with-commission)

**Cause**: L'Edge Function tente de mettre a jour des colonnes qui **n'existent pas** dans la table `transport_bookings`:

| Colonne Utilisee | Existe ? |
|------------------|----------|
| `commission_status` | **NON** |
| `commission_amount` | **NON** |
| `commission_paid_at` | **NON** |

Les colonnes reelles de `transport_bookings` sont: `id`, `user_id`, `pickup_location`, `destination`, `status`, `driver_id`, `estimated_price`, `actual_price`, `completed_at`, etc.

**Code fautif** (lignes 273-285 de `complete-ride-with-commission/index.ts`):
```typescript
await supabase
  .from(tableName)
  .update({
    status: 'completed',
    commission_status: paymentStatus,        // ❌ COLONNE INEXISTANTE
    commission_amount: commissionAmount,     // ❌ COLONNE INEXISTANTE
    commission_paid_at: ...,                 // ❌ COLONNE INEXISTANTE
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', rideId);
```

De plus, la table `ride_commissions` attend des colonnes specifiques:
- `kwenda_commission` (pas `commission_amount`)
- `kwenda_rate` (pas `commission_rate`)
- `partner_commission`
- `partner_rate`
- `partner_id`

---

### 2. Erreurs PostgreSQL Repetees

Les logs PostgreSQL montrent:
```
ERROR: invalid column for filter user_id
```

Cela indique des requetes Realtime mal configurees quelque part.

---

### 3. Geolocalisation Web Ne Fonctionne Plus

**Problemes identifies dans `useSmartGeolocation.tsx`**:

1. **Timeout trop court** (5 secondes - ligne 125)
2. **Pas d'utilisation de nativeGeolocationService** pour mobile
3. **Cache trop long** (5 minutes - empeche la mise a jour de position)
4. **Pas de systeme de retry** en cas d'echec GPS

**Code actuel** (ligne 114-129):
```typescript
const position = await new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Géolocalisation non disponible'));
    return;
  }
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: opts?.enableHighAccuracy ?? true,
    timeout: opts?.timeout ?? 5000,  // ❌ TROP COURT
    maximumAge: opts?.maximumAge ?? 30000
  });
});
```

---

### 4. GPS Mobile (Android/iOS) Ne Fonctionne Pas

**Cause**: Le hook `useSmartGeolocation` utilise directement `navigator.geolocation` au lieu de `nativeGeolocationService` qui gere automatiquement Capacitor.

Le `nativeGeolocationService.ts` est deja bien configure avec:
- Detection automatique Web vs Native via `Capacitor.isNativePlatform()`
- Gestion des permissions Android/iOS
- Fallback sur navigateur pour le web

Mais **useSmartGeolocation ne l'utilise pas** !

---

### 5. Cle API Web Manquante

Le fichier `DeliveryMapPreview.tsx` utilise une variable d'environnement inexistante:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}...`
```

`VITE_GOOGLE_MAPS_API_KEY` n'existe pas dans le projet. Le systeme devrait utiliser `googleMapsLoader.getApiKey()` qui recupere la cle depuis l'Edge Function.

---

### 6. Configuration Android

Le `AndroidManifest.xml` a deja la cle API Android:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyBlyaBgTzhJZKZTT1xhqhiZy62lFrmyodw"/>
```

**Mais il manque les permissions GPS**! Il faut ajouter:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

### 7. Configuration iOS

Le `Info.plist` ne contient **aucune cle API Google Maps ni permission GPS**.

Il faut ajouter:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Kwenda necessite votre position pour vous localiser et trouver des chauffeurs proches.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Kwenda necessite votre position pour le suivi de course en arriere-plan.</string>
```

---

## Plan de Correction

### Etape 1: Corriger l'Edge Function complete-ride-with-commission

**Fichier**: `supabase/functions/complete-ride-with-commission/index.ts`

Retirer les colonnes inexistantes de l'update `transport_bookings`:
```typescript
// AVANT (colonnes inexistantes)
await supabase.from(tableName).update({
  status: 'completed',
  commission_status: paymentStatus,     // ❌
  commission_amount: commissionAmount,  // ❌
  commission_paid_at: ...,              // ❌
  completed_at: new Date().toISOString()
}).eq('id', rideId);

// APRES (colonnes valides seulement)
await supabase.from(tableName).update({
  status: 'completed',
  completed_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}).eq('id', rideId);
```

Corriger l'insertion dans `ride_commissions` avec les vraies colonnes:
```typescript
await supabase.from('ride_commissions').insert({
  ride_id: rideId,
  ride_type: rideType,
  driver_id: driverId,
  partner_id: partnerId || null,
  ride_amount: finalAmount,
  kwenda_commission: kwendaCommission,  // ✅ Colonne correcte
  kwenda_rate: kwendaRate,              // ✅ Colonne correcte
  partner_commission: partnerCommission,// ✅ Colonne correcte
  partner_rate: partnerRate,            // ✅ Colonne correcte
  driver_net_amount: driverNetAmount,
  payment_status: paymentStatus,
  paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null
});
```

---

### Etape 2: Corriger useSmartGeolocation pour Mobile + Web

**Fichier**: `src/hooks/useSmartGeolocation.tsx`

1. Importer et utiliser `nativeGeolocationService`:
```typescript
import { nativeGeolocationService } from '@/services/nativeGeolocationService';
```

2. Remplacer le bloc GPS (lignes 112-129):
```typescript
const getCurrentPosition = useCallback(async (opts?: GeolocationOptions): Promise<LocationData> => {
  const cacheKey = 'current-position';
  const cached = locationCache.get(cacheKey);

  // Cache reduit a 2 minutes pour fraicheur
  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
    console.log('📍 Position depuis cache');
    return cached.data;
  }

  setLoading(true);
  setError(null);

  // Retry avec timeouts progressifs
  const timeouts = [15000, 20000, 25000];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < timeouts.length; attempt++) {
    try {
      console.log(`📍 Tentative GPS ${attempt + 1}/${timeouts.length}...`);

      // ✅ Utiliser nativeGeolocationService (Capacitor + Browser)
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: opts?.enableHighAccuracy ?? true,
        timeout: timeouts[attempt],
        maximumAge: opts?.maximumAge ?? 30000
      });

      const coords = { lat: position.lat, lng: position.lng };
      console.log(`✅ GPS reussi:`, coords, `Precision: ±${Math.round(position.accuracy)}m`);

      // Detecter la ville
      const detectedCity = await universalGeolocation.detectUserCity(coords);

      // Geocodage inverse
      const { data: geocodeData } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          query: `${coords.lat},${coords.lng}`,
          language: 'fr',
          region: detectedCity.countryCode
        }
      });

      const locationData: LocationData = {
        address: geocodeData?.results?.[0]?.formatted_address || 'Position actuelle',
        lat: coords.lat,
        lng: coords.lng,
        type: 'current',
        accuracy: position.accuracy,
        name: geocodeData?.results?.[0]?.name || 'Ma position'
      };

      locationCache.set(cacheKey, { data: locationData, timestamp: Date.now() });
      setLoading(false);
      return locationData;

    } catch (gpsError: any) {
      console.warn(`❌ Tentative ${attempt + 1} echouee:`, gpsError.message);
      lastError = gpsError;

      // Si permission refusee, pas de retry
      if (gpsError.message?.includes('Permission') || gpsError.message?.includes('denied')) {
        break;
      }

      // Attendre avant retry
      if (attempt < timeouts.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Fallback IP si tout echoue
  console.warn('GPS echoue, fallback IP...', lastError);
  // ... code fallback existant
}, []);
```

---

### Etape 3: Corriger DeliveryMapPreview (cle API)

**Fichier**: `src/components/delivery/DeliveryMapPreview.tsx`

Remplacer l'utilisation de `VITE_GOOGLE_MAPS_API_KEY` par `googleMapsLoader`:

```typescript
import { googleMapsLoader } from '@/services/googleMapsLoader';

useEffect(() => {
  const loadGoogleMaps = async () => {
    try {
      // Utiliser le loader unifie
      await googleMapsLoader.load(['places', 'geometry']);
      initMap();
    } catch (error) {
      console.error('Erreur chargement carte:', error);
      setMapError('Impossible de charger la carte');
    }
  };
  // ...
}, []);
```

---

### Etape 4: Ajouter les permissions GPS Android

**Fichier**: `android/app/src/main/AndroidManifest.xml`

Ajouter avant `</manifest>`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

---

### Etape 5: Ajouter les permissions GPS iOS

**Fichier**: `ios/App/App/Info.plist`

Ajouter dans `<dict>`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Kwenda necessite votre position pour vous localiser et trouver des chauffeurs proches.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Kwenda necessite votre position pour le suivi de course en arriere-plan.</string>
<key>GMSApiKey</key>
<string>AIzaSyAvF9fFaNIwFQOvVxgtTiu6POK-Hr9wClk</string>
```

---

## Resume des Fichiers a Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/complete-ride-with-commission/index.ts` | Retirer colonnes inexistantes, corriger ride_commissions |
| `src/hooks/useSmartGeolocation.tsx` | Utiliser nativeGeolocationService, retry, timeout |
| `src/components/delivery/DeliveryMapPreview.tsx` | Utiliser googleMapsLoader au lieu de VITE_* |
| `android/app/src/main/AndroidManifest.xml` | Ajouter permissions GPS |
| `ios/App/App/Info.plist` | Ajouter permissions GPS + cle API iOS |

---

## Flux GPS Corrige

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEMANDE POSITION GPS                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Verifier cache (< 2 min) → Si OK, retourner cache                       │
│                                                                             │
│  2. nativeGeolocationService detecte la plateforme:                         │
│     ├─ Android/iOS → @capacitor/geolocation (GPS hardware)                  │
│     └─ Web → navigator.geolocation (browser API)                            │
│                                                                             │
│  3. Tentative GPS avec retry progressif                                     │
│     ├─ Tentative 1: timeout 15s                                             │
│     ├─ Tentative 2: timeout 20s                                             │
│     └─ Tentative 3: timeout 25s                                             │
│                                                                             │
│  4. Si tout echoue → Fallback IP geolocation                                │
│                                                                             │
│  5. Geocodage inverse via geocode-proxy Edge Function                       │
│     └─ Retourne adresse lisible + coordonnees                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cles API Configurees

| Plateforme | Cle API | Usage |
|------------|---------|-------|
| **Web** | `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc` | Edge Functions (GOOGLE_MAPS_API_KEY secret) |
| **Android** | `AIzaSyBlyaBgTzhJZKZTT1xhqhiZy62lFrmyodw` | AndroidManifest.xml (deja configure) |
| **iOS** | `AIzaSyAvF9fFaNIwFQOvVxgtTiu6POK-Hr9wClk` | Info.plist (a ajouter) |

**Note**: Le secret Supabase `GOOGLE_MAPS_API_KEY` doit contenir la cle Web pour que les Edge Functions fonctionnent. Il faudra verifier que la valeur actuelle correspond a `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc`.
