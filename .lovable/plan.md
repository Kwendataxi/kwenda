
# Plan de Conception - Carte Interactive Temps Reel et Notifications Job

## Resume Executif

Implementation d'une carte interactive professionnelle affichant en temps reel les taxis et livreurs (moto, van, camion) avec icones differenciees, animations fluides, et mode jour/nuit. Ajout d'un systeme de notifications pour les nouvelles offres d'emploi Kwenda Job.

---

## Phase 1 : Systeme de Tracking Multi-Vehicules Unifie

### 1.1 - Extension du Schema driver_locations

La table `driver_locations` contient deja:
- `vehicle_class` (text) - pour differencier les types de vehicules
- `heading`, `speed` - pour l'orientation et l'animation

**Action**: Utiliser `vehicle_class` avec valeurs standardisees:
| vehicle_class | Type | Icone |
|--------------|------|-------|
| `taxi` | Taxi VTC | Voiture bleue |
| `moto_flash` | Moto livraison Flash | Moto orange |
| `van_flex` | Van livraison Flex | Van orange |
| `truck_maxicharge` | Camion MaxiCharge | Camion orange |

### 1.2 - Hook useUnifiedVehicleTracking

**Nouveau fichier**: `src/hooks/useUnifiedVehicleTracking.ts`

```typescript
interface TrackedVehicle {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  vehicle_class: 'taxi' | 'moto_flash' | 'van_flex' | 'truck_maxicharge';
  status: 'available' | 'busy' | 'offline';
  driver_name?: string;
  is_delivering?: boolean; // Pour afficher l'icone colis
  delivery_status?: 'pickup' | 'in_transit' | 'delivered';
}

// Fonctionnalites:
// - Subscription Supabase Realtime temps reel (2-3s)
// - Filtrage par type (taxi, livraison, tous)
// - Filtrage par rayon (basé sur userLocation)
// - Clustering automatique selon le zoom
```

---

## Phase 2 : Composants Markers Multi-Types

### 2.1 - Icones SVG Personnalisees Kwenda

**Nouveau fichier**: `src/components/maps/VehicleMarkerIcons.tsx`

Icones SVG vectorielles 40x40px avec:
- **Taxi**: Cercle bleu (#3B82F6) + silhouette voiture blanche + pulse disponible
- **Moto Flash**: Cercle orange (#F59E0B) + silhouette moto blanche + badge "FLASH"
- **Van Flex**: Cercle orange (#F97316) + silhouette van blanche + badge "FLEX"
- **Camion MaxiCharge**: Cercle violet (#8B5CF6) + silhouette camion blanche + badge "MAX"
- **Client**: Point bleu pulsant (#3B82F6) avec cercle d'onde
- **Vehicule en course**: Halo anime autour du vehicule

### 2.2 - Marqueur Vehicule Unifie

**Nouveau fichier**: `src/components/maps/UnifiedVehicleMarker.tsx`

```typescript
interface UnifiedVehicleMarkerProps {
  map: google.maps.Map;
  vehicle: TrackedVehicle;
  showPackageIcon?: boolean; // Afficher l'icone colis si livraison en cours
  smoothTransition?: boolean;
  onClick?: (vehicle: TrackedVehicle) => void;
}

// Fonctionnalites:
// - Animation fluide de deplacement (interpolation position)
// - Rotation selon heading
// - Icone dynamique selon vehicle_class
// - Badge statut (disponible, en course, livraison)
// - InfoWindow au clic avec details chauffeur
```

---

## Phase 3 : Carte Interactive Principale

### 3.1 - Composant KwendaLiveMap

**Nouveau fichier**: `src/components/maps/KwendaLiveMap.tsx`

```typescript
interface KwendaLiveMapProps {
  userLocation: { lat: number; lng: number } | null;
  mode: 'transport' | 'delivery' | 'all';
  showRoute?: boolean;
  pickup?: Location;
  destination?: Location;
  onVehicleClick?: (vehicle: TrackedVehicle) => void;
  className?: string;
}

// Fonctionnalites principales:
// - Mode jour/nuit automatique (basé sur l'heure locale)
// - Geolocalisation temps reel utilisateur
// - Affichage vehicules filtres par mode
// - Clustering automatique au dezoom
// - Controles zoom/localisation
// - Boutons filtre (Taxi | Livraison | Tous)
```

### 3.2 - Controles de Filtrage

**Modification**: `src/components/maps/KwendaMapControls.tsx`

Ajout de boutons de filtre style Yango:
```tsx
<div className="absolute top-4 left-4 z-10 flex gap-2">
  <FilterButton 
    active={filter === 'all'} 
    icon={<Layers />} 
    label="Tous" 
    onClick={() => setFilter('all')} 
  />
  <FilterButton 
    active={filter === 'taxi'} 
    icon={<Car />} 
    label="Taxi" 
    onClick={() => setFilter('taxi')} 
  />
  <FilterButton 
    active={filter === 'delivery'} 
    icon={<Package />} 
    label="Livraison" 
    onClick={() => setFilter('delivery')} 
  />
</div>
```

---

## Phase 4 : Animations et Performance

### 4.1 - Animation Fluide de Deplacement

**Nouveau fichier**: `src/utils/vehicleAnimationUtils.ts`

```typescript
// Interpolation de position pour mouvement fluide
export const animateVehicleMove = (
  marker: google.maps.Marker,
  from: LatLng,
  to: LatLng,
  duration: number = 1000
) => {
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    
    const lat = from.lat + (to.lat - from.lat) * eased;
    const lng = from.lng + (to.lng - from.lng) * eased;
    
    marker.setPosition({ lat, lng });
    
    if (progress < 1) requestAnimationFrame(animate);
  };
  animate();
};

// Interpolation de rotation fluide
export const animateHeadingChange = (
  currentHeading: number,
  targetHeading: number
): number => {
  // Choisir le chemin le plus court (ex: 350 -> 10 = +20, pas -340)
  let diff = targetHeading - currentHeading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return currentHeading + diff;
};
```

### 4.2 - Clustering Intelligent

**Utilisation**: Google Maps MarkerClusterer ou implementation custom

```typescript
// Clustering basé sur le niveau de zoom
useEffect(() => {
  if (map && vehicles.length > 20) {
    const zoom = map.getZoom();
    if (zoom && zoom < 14) {
      // Activer clustering
      enableClustering(vehicles);
    } else {
      // Afficher tous les markers individuels
      disableClustering();
    }
  }
}, [map, vehicles, zoom]);
```

### 4.3 - Optimisation Performance

- **Chargement progressif**: Charger uniquement les vehicules visibles dans le viewport
- **Throttling**: Limiter les updates visuelles a 10fps
- **Debounce**: Regrouper les updates Supabase realtime
- **Recycler les markers**: Reutiliser les objets Marker au lieu de les recreer

---

## Phase 5 : Route avec Indicateur de Trafic

### 5.1 - Modification ProfessionalRoutePolyline

**Fichier existant**: `src/components/transport/map/ProfessionalRoutePolyline.tsx`

Ajout des couleurs de trafic:
```typescript
const TRAFFIC_COLORS = {
  smooth: '#22C55E',    // Vert - fluide
  moderate: '#F59E0B',  // Orange - moyen
  heavy: '#EF4444',     // Rouge - dense
};

// Utiliser TrafficLayer de Google Maps
useEffect(() => {
  if (map && showTraffic) {
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => trafficLayer.setMap(null);
  }
}, [map, showTraffic]);
```

---

## Phase 6 : Mode Jour/Nuit Automatique

### 6.1 - Hook useMapTheme Ameliore

**Fichier existant**: `src/hooks/useMapTheme.ts`

Ajout de la detection automatique:
```typescript
const getAutoTheme = (): 'light' | 'dark' => {
  const hour = new Date().getHours();
  // Nuit: 19h - 6h
  return (hour >= 19 || hour < 6) ? 'dark' : 'light';
};

const mapStyles = useMemo(() => {
  const theme = autoTheme ? getAutoTheme() : manualTheme;
  return theme === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
}, [autoTheme, manualTheme]);
```

---

## Phase 7 : Notifications Kwenda Job

### 7.1 - Extension des Preferences de Notification

**Modification**: `src/hooks/useNotificationPreferences.tsx`

Ajout de la categorie "job":
```typescript
interface NotificationPreferences {
  // ... existants ...
  job_updates: boolean;  // NOUVEAU
}

const defaultPreferences: NotificationPreferences = {
  // ... existants ...
  job_updates: true,  // Active par defaut
};
```

### 7.2 - Modification NotificationPreferencesPanel

**Fichier existant**: `src/components/notifications/NotificationPreferencesPanel.tsx`

Ajout de la categorie Job dans CATEGORY_CONFIG:
```typescript
const CATEGORY_CONFIG = [
  // ... existants ...
  { 
    key: 'job', 
    icon: Briefcase, 
    label: 'Kwenda Job', 
    description: 'Nouvelles offres d\'emploi' 
  },
];
```

### 7.3 - Hook useJobNotifications

**Nouveau fichier**: `src/hooks/useJobNotifications.ts`

```typescript
export const useJobNotifications = () => {
  const { user } = useAuth();
  const { preferences, shouldShowNotification } = useNotificationPreferences();
  
  useEffect(() => {
    if (!user || !preferences.job_updates) return;
    
    // Ecouter les nouvelles offres d'emploi
    const channel = supabase
      .channel('job-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active'
        },
        (payload) => {
          const job = payload.new;
          
          if (shouldShowNotification('job', 'normal')) {
            // Afficher notification toast
            toast.custom((t) => (
              <JobNotificationToast
                job={job}
                onView={() => navigateTo(`/job/${job.id}`)}
                onDismiss={() => toast.dismiss(t)}
              />
            ));
            
            // Notification push native si disponible
            sendPushNotification({
              title: 'Nouvelle offre Kwenda Job',
              body: `${job.title} - ${job.location_city}`,
              data: { type: 'job', jobId: job.id }
            });
          }
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user, preferences.job_updates]);
};
```

### 7.4 - Composant JobNotificationToast

**Nouveau fichier**: `src/components/job/JobNotificationToast.tsx`

```typescript
export const JobNotificationToast = ({ job, onView, onDismiss }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-4 border border-primary/20"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-xl">
        <Briefcase className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{job.title}</p>
        <p className="text-xs text-muted-foreground">
          {job.location_city} - {job.employment_type}
        </p>
      </div>
    </div>
    <div className="flex gap-2 mt-3">
      <Button size="sm" onClick={onView}>Voir l'offre</Button>
      <Button size="sm" variant="ghost" onClick={onDismiss}>Plus tard</Button>
    </div>
  </motion.div>
);
```

### 7.5 - Integration dans App

**Modification**: Integration du hook dans le layout principal

```typescript
// Dans src/App.tsx ou layout principal
const JobNotificationListener = () => {
  useJobNotifications();
  return null;
};

// Ajouter dans le composant App
<JobNotificationListener />
```

---

## Phase 8 : Integration dans l'Interface

### 8.1 - Modification ModernHomeScreen

Remplacer la carte actuelle par `KwendaLiveMap`:
```typescript
<KwendaLiveMap
  userLocation={currentLocation}
  mode="all"
  showRoute={false}
  className="h-[300px] rounded-2xl overflow-hidden"
/>
```

### 8.2 - Modification ModernTaxiInterface

Utiliser `KwendaLiveMap` en mode transport:
```typescript
<KwendaLiveMap
  userLocation={userLocation}
  mode="transport"
  showRoute={!!pickup && !!destination}
  pickup={pickup}
  destination={destination}
  onVehicleClick={handleDriverSelect}
/>
```

### 8.3 - Modification SlideDeliveryInterface

Utiliser `KwendaLiveMap` en mode livraison:
```typescript
<KwendaLiveMap
  userLocation={userLocation}
  mode="delivery"
  showRoute={!!pickupAddress && !!deliveryAddress}
  pickup={pickupLocation}
  destination={deliveryLocation}
/>
```

---

## Resume des Fichiers

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `src/hooks/useUnifiedVehicleTracking.ts` | Hook tracking multi-vehicules temps reel |
| `src/components/maps/VehicleMarkerIcons.tsx` | Icones SVG vehicules Kwenda |
| `src/components/maps/UnifiedVehicleMarker.tsx` | Marqueur vehicule unifie anime |
| `src/components/maps/KwendaLiveMap.tsx` | Carte interactive principale |
| `src/utils/vehicleAnimationUtils.ts` | Utilitaires animation fluide |
| `src/hooks/useJobNotifications.ts` | Hook notifications emploi |
| `src/components/job/JobNotificationToast.tsx` | Toast notification emploi |

### Fichiers Modifies

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useNotificationPreferences.tsx` | Ajout categorie job_updates |
| `src/components/notifications/NotificationPreferencesPanel.tsx` | Ajout UI Kwenda Job |
| `src/hooks/useMapTheme.ts` | Mode jour/nuit automatique |
| `src/components/transport/map/ModernMapView.tsx` | Integration KwendaLiveMap |
| `src/components/maps/KwendaMapControls.tsx` | Boutons filtre vehicules |

---

## Architecture Technique

```
+-------------------+       +------------------------+
|   User Device     |       |    Supabase Backend    |
+-------------------+       +------------------------+
        |                            |
        | GPS Position               | driver_locations
        v                            | (realtime updates)
+-------------------+       +------------------------+
| useSmartGeolocation|<---->| Supabase Realtime      |
+-------------------+       | Channel: live-tracking |
        |                   +------------------------+
        v                            |
+-------------------+                |
| useUnifiedVehicle |<---------------+
| Tracking          |  (2-3s updates)
+-------------------+
        |
        v
+-------------------+
| KwendaLiveMap     |
| - Filter UI       |
| - Vehicle Markers |
| - Route Overlay   |
| - Traffic Layer   |
+-------------------+
        |
        v
+-------------------+
| UnifiedVehicle    |
| Marker (animated) |
+-------------------+
```

---

## Estimation Temps

| Phase | Description | Duree |
|-------|-------------|-------|
| Phase 1 | Hook tracking unifie | 2h |
| Phase 2 | Marqueurs multi-types | 3h |
| Phase 3 | Carte interactive | 3h |
| Phase 4 | Animations performance | 2h |
| Phase 5 | Route avec trafic | 1h |
| Phase 6 | Mode jour/nuit | 1h |
| Phase 7 | Notifications Job | 2h |
| Phase 8 | Integration | 2h |
| **Total** | | **16h** |

---

## Points de Validation

- [ ] Carte affiche les vehicules en temps reel (2-3s)
- [ ] Icones differenciees par type (taxi, moto, van, camion)
- [ ] Animation fluide du deplacement (pas de teleportation)
- [ ] Rotation des vehicules selon la direction
- [ ] Mode jour/nuit automatique fonctionne
- [ ] Filtres (Taxi/Livraison/Tous) operationnels
- [ ] Clustering actif au dezoom
- [ ] Notifications Job arrivent pour les nouvelles offres
- [ ] Toggle notifications Job dans les preferences
- [ ] Performance optimisee (batterie, memoire)
