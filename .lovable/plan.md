
# Correction Google Maps - Map ID Invalide

## Diagnostic

L'erreur "Google Maps ne s'est pas chargé correctement" vient du fait que le secret **GOOGLE_MAPS_MAP_ID** contient une **clé API** au lieu d'un vrai **Map ID**.

| Secret | Valeur Actuelle | Correct ? |
|--------|-----------------|-----------|
| `GOOGLE_MAPS_API_KEY` | `AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc` | Oui |
| `GOOGLE_MAPS_MAP_ID` | `AIzaSyDfdIKKBgsQLBSybMcPyOHq7_yQ7qlSf0g` | **NON** - C'est une autre clé API |

Un Map ID valide ressemble a `8e0a97af9386fef` ou `DEMO_MAP_ID`, pas a une clé API commençant par `AIza...`.

---

## Solutions Proposées

### Solution 1 : Rendre le Map ID Optionnel (Recommandé - Rapide)

Modifier les composants pour fonctionner **sans Map ID** comme `OptimizedMapView` le fait déjà.

**Fichiers a modifier :**
- `src/components/maps/KwendaMap.tsx`
- `src/components/transport/map/ModernMapView.tsx`
- `supabase/functions/get-google-maps-key/index.ts`

**Changements :**

```typescript
// Dans KwendaMap.tsx et ModernMapView.tsx (ligne ~67-76)
// AVANT
const mapId = googleMapsLoader.getMapId();
if (!mapId) {
  toast({
    title: "Configuration manquante",
    description: "Map ID non configuré",
    variant: "destructive"
  });
  return;  // ❌ BLOQUANT
}

// APRÈS - Rendre mapId optionnel
const mapId = googleMapsLoader.getMapId();

// Map ID est optionnel - utiliser null si invalide ou absent
const validMapId = (mapId && !mapId.startsWith('AIza')) ? mapId : undefined;

const map = new google.maps.Map(mapRef.current!, {
  ...(validMapId && { mapId: validMapId }), // Conditionnel
  center: defaultCenter,
  zoom: 14,
  styles: mapStyles,  // Styles fonctionnent sans mapId
  // ... autres options
});
```

```typescript
// Dans get-google-maps-key/index.ts (ligne 173-176)
// AVANT - Erreur si pas de Map ID
if (!googleMapsMapId) {
  console.error('❌ GOOGLE_MAPS_MAP_ID not found');
  throw new Error('Google Maps Map ID not configured');
}

// APRÈS - Map ID optionnel
const validMapId = googleMapsMapId && !googleMapsMapId.startsWith('AIza')
  ? googleMapsMapId
  : null;

if (!validMapId) {
  console.warn('⚠️ GOOGLE_MAPS_MAP_ID absent ou invalide, fonctionnement sans Map ID');
}

return new Response(JSON.stringify({ 
  apiKey: googleMapsApiKey,
  mapId: validMapId,  // Peut être null
  // ...
}));
```

---

### Solution 2 : Créer un Vrai Map ID (Long Terme)

Pour utiliser les fonctionnalités avancées comme `AdvancedMarkerElement`, vous devez créer un Map ID dans Google Cloud Console :

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/studio/maps)
2. Cliquer "Create Map ID"
3. Nommer : `Kwenda-Map`
4. Type : JavaScript
5. Cocher "Vector" pour les cartes modernes
6. Copier l'ID généré (ex: `8e0a97af9386fef`)
7. Mettre a jour le secret `GOOGLE_MAPS_MAP_ID` dans Supabase

**Note**: Le Map ID n'est requis que pour `AdvancedMarkerElement`. Les marqueurs classiques (`google.maps.Marker`) et les tracés de route fonctionnent sans Map ID.

---

## Fichiers a Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/get-google-maps-key/index.ts` | Rendre mapId optionnel, valider format |
| `src/services/googleMapsLoader.ts` | Valider format mapId, fallback null |
| `src/components/maps/KwendaMap.tsx` | Supprimer blocage si mapId absent |
| `src/components/transport/map/ModernMapView.tsx` | Supprimer blocage si mapId absent |

---

## Flux Corrigé

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHARGEMENT GOOGLE MAPS                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. get-google-maps-key retourne:                                           │
│     ├─ apiKey: "AIzaSyAOlkwFPy5ivwyW..." ✅                                 │
│     └─ mapId: null (si invalide/absent) ⚠️                                  │
│                                                                             │
│  2. googleMapsLoader.load() charge le script                                │
│                                                                             │
│  3. Composant carte:                                                        │
│     ├─ Si mapId valide → Utiliser AdvancedMarkerElement                     │
│     └─ Si mapId null → Utiliser marqueurs classiques + styles ✅            │
│                                                                             │
│  4. Carte s'affiche correctement dans les deux cas                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Résumé des Changements

1. **Edge Function** : Ne plus bloquer si mapId invalide
2. **googleMapsLoader** : Valider que mapId ne ressemble pas a une clé API
3. **KwendaMap + ModernMapView** : Fonctionner avec ou sans mapId
4. **OptimizedMapView** : Déja correct (n'utilise pas mapId)

Une fois ces corrections appliquées, Google Maps fonctionnera correctement sur toutes les pages, même avec le secret GOOGLE_MAPS_MAP_ID mal configuré.
