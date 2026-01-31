

# Plan d'Optimisation du Zoom Carte Kwenda - Style Uber/Yango

## Diagnostic Actuel

### Problemes identifies dans le code existant

| Fichier | Probleme | Impact |
|---------|----------|--------|
| `ModernMapView.tsx` ligne 435-447 | `zoom: 15` fixe pour position utilisateur | Zoom trop serre ou trop large selon contexte |
| `ModernMapView.tsx` ligne 444-449 | `zoom: 14` fixe pour pickup seul | Pas de contexte autour |
| `ModernTrackingMap.tsx` ligne 262 | `setZoom(16)` fixe sur le chauffeur | Perd la vue globale du trajet |
| `KwendaLiveMap.tsx` ligne 253 | `setZoom(16)` apres localisation | Manque d'adaptation au contexte |
| `DeliveryMapPreview.tsx` ligne 78 | `fitBounds()` sans padding adaptatif | Elements caches sous les bottom sheets |
| `ProfessionalRoutePolyline.tsx` ligne 163-168 | Padding statique `{top:100, bottom:300}` | Pas adapte a la hauteur reelle des panels |

---

## Architecture de la Solution

### Nouveau Hook Centralise : `useSmartMapCamera`

Un hook unique pour gerer tous les scenarios de zoom avec logique Uber/Yango :

```
Scenarios supportes:
1. Position seule       -> Zoom contextuel (15-16)
2. Pickup seul          -> Zoom contextuel (15-16) 
3. Pickup + Destination -> fitBounds avec padding dynamique
4. Pickup + Dest + Driver -> fitBounds 3 points
5. Suivi chauffeur      -> Mode "follow" avec auto-recadrage
```

---

## Phase 1 : Creation du Hook `useSmartMapCamera`

### Fichier : `src/hooks/useSmartMapCamera.ts`

**Fonctionnalites principales :**

1. **Padding Dynamique**
   - Calcul automatique selon hauteur du bottom sheet
   - Detection de l'ecran (mobile/tablette/desktop)
   - Marges intelligentes pour eviter masquage

2. **Scenarios de Zoom**
   - `zoomToSinglePoint()` - Zoom contextuel 15-16
   - `fitToRoute()` - Affiche pickup + destination
   - `fitToTrip()` - Affiche pickup + destination + chauffeur
   - `followDriver()` - Mode suivi avec zoom adaptatif

3. **Limiteurs de Zoom**
   - `minZoom: 10` (vue ville)
   - `maxZoom: 18` (vue rue)
   - Prevention du zoom excessif apres fitBounds

4. **Animation Fluide**
   - Transition camera `duration: 600ms`
   - Easing `ease-out-cubic`
   - Interpolation position + zoom

---

## Phase 2 : Utilitaire de Padding Dynamique

### Fichier : `src/utils/mapPaddingUtils.ts`

```
Configuration par contexte:

| Contexte          | Top   | Bottom | Left  | Right |
|-------------------|-------|--------|-------|-------|
| Bottom sheet 420px| 80px  | 450px  | 60px  | 60px  |
| Bottom sheet 300px| 80px  | 330px  | 60px  | 60px  |
| Mode fullscreen   | 120px | 120px  | 80px  | 80px  |
| Mode tracking     | 200px | 350px  | 80px  | 80px  |
```

---

## Phase 3 : Modification de `ModernMapView.tsx`

### Changements cles

**Avant (ligne 407-459):**
```typescript
// Zoom fixes
if (userLocation) {
  animateCameraTransition({
    center: userLocation,
    zoom: 15, // ❌ FIXE
  });
} else if (pickup) {
  animateCameraTransition({
    center: pickup,
    zoom: 14, // ❌ FIXE
  });
}
```

**Apres:**
```typescript
// Logique intelligente
if (pickup && destination) {
  smartCamera.fitToRoute(pickup, destination, {
    bottomSheetHeight: 420,
    maxZoom: 16
  });
} else if (pickup || userLocation) {
  smartCamera.zoomToPoint(pickup || userLocation, {
    contextualZoom: true
  });
}
```

---

## Phase 4 : Modification de `ModernTrackingMap.tsx`

### Ameliorations

1. **Initialisation**
   - Utiliser `fitBounds` au lieu de `zoom: 14` fixe
   - Inclure chauffeur dans les bounds si disponible

2. **Mode Suivi Chauffeur**
   - Remplacer `setZoom(16)` par zoom adaptatif
   - Recadrage automatique si chauffeur sort des bounds visibles

3. **Bouton Recentrer**
   - `fitToTrip()` au lieu de `panTo` simple
   - Affiche tout le contexte (chauffeur + pickup + destination)

---

## Phase 5 : Modification de `KwendaLiveMap.tsx`

### Ajouts

1. **Zoom initial adaptatif**
   - Si vehicules visibles : zoom pour tous les voir
   - Si route affichee : fitBounds sur la route

2. **Bouton Localisation**
   - Zoom 16 avec animation fluide
   - Re-afficher vehicules proches dans le viewport

---

## Phase 6 : Modification de `ProfessionalRoutePolyline.tsx`

### Correction du padding

**Avant:**
```typescript
map.fitBounds(result.bounds, {
  top: 100,
  right: 60,
  bottom: 300, // ❌ Statique
  left: 60
});
```

**Apres:**
```typescript
const dynamicPadding = calculateDynamicPadding({
  bottomSheetHeight,
  screenHeight: window.innerHeight,
  hasDriverInfo: !!driverLocation
});

map.fitBounds(result.bounds, dynamicPadding);
```

---

## Phase 7 : Ajout du Limiteur de Zoom

### Dans chaque `fitBounds`

```typescript
// Apres fitBounds, limiter le zoom max
const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
  const currentZoom = map.getZoom();
  if (currentZoom && currentZoom > 17) {
    map.setZoom(17);
  }
});
```

---

## Phase 8 : Mode "Auto-Recadrage Intelligent"

### Nouvelle fonctionnalite

Quand le chauffeur sort des bounds visibles:
1. Detecter si le marker chauffeur est hors viewport
2. Recalculer fitBounds avec les 3 points
3. Animer la transition sans brusquer l'utilisateur

```typescript
const isOutOfBounds = (position, mapBounds) => {
  return !mapBounds.contains(position);
};

if (isOutOfBounds(driverLocation, map.getBounds()) && !userIsZooming) {
  smartCamera.fitToTrip(pickup, destination, driverLocation);
}
```

---

## Resume des Fichiers

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/hooks/useSmartMapCamera.ts` | Hook centralise de gestion camera |
| `src/utils/mapPaddingUtils.ts` | Calcul padding dynamique |

### Fichiers modifies

| Fichier | Modifications |
|---------|---------------|
| `src/components/transport/map/ModernMapView.tsx` | Remplacer zooms fixes par `useSmartMapCamera` |
| `src/components/tracking/ModernTrackingMap.tsx` | Ajouter `fitToTrip` et limiteur zoom |
| `src/components/maps/KwendaLiveMap.tsx` | Zoom adaptatif sur vehicules |
| `src/components/transport/map/ProfessionalRoutePolyline.tsx` | Padding dynamique |
| `src/components/delivery/DeliveryMapPreview.tsx` | Padding pour bottom overlay |
| `src/hooks/useMapCamera.ts` | Etendre avec nouvelles fonctions |

---

## Regles UX Implementees

1. **Jamais de zoom fixe** - Toujours `fitBounds()` ou zoom contextuel
2. **Padding bottom = hauteur sheet + 30px** - Rien n'est cache
3. **Zoom max = 17** - Vue rue lisible sans exces
4. **Zoom min = 10** - Vue ville complete
5. **Animation 600ms** - Transition fluide perceptible
6. **Auto-recadrage si chauffeur sort** - Contexte toujours visible
7. **Prevention du zoom pendant interaction** - `userIsManuallyZooming`

---

## Tests de Validation

- [ ] Recherche adresse -> Zoom contextuel autour du point
- [ ] Pickup + Destination -> Tout le trajet visible
- [ ] Chauffeur assigne -> 3 points visibles (pickup, dest, chauffeur)
- [ ] Suivi chauffeur -> Recadrage auto si sort des bounds
- [ ] Bottom sheet ouvert -> Destination pas cachee
- [ ] Zoom manuel -> Pas de recadrage intempestif
- [ ] Animation fluide sur tous les changements

