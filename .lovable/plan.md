
## Diagnostic (cause racine confirmée)

### 1) La distance reste à 0, donc les prix restent au “prix de base”
Sur la capture, “Continuer 4300” correspond exactement au **base_price** du véhicule Premium à Abidjan (4300 XOF en DB).  
Cela veut dire que l’app n’applique **pas** la distance (distance = 0 ou non mise à jour).

### 2) Pourquoi la distance ne se met pas à jour (log console)
Les logs montrent :
- `API keys with referer restrictions cannot be used with this API.`

Cela vient de `secureNavigationService.calculateRoute()` → Edge Function `google-maps-proxy` → appel HTTP Google Directions API.

Conclusion :
- Le calcul de route côté Edge Function échoue (clé Google mal configurée pour l’API HTTP).
- Donc `ModernTaxiInterface` ne reçoit pas la distance et reste sur les prix de base.
- Par contre, la carte affiche une route car le tracé pro utilise un autre chemin (JS API via `DirectionsService`), ce qui crée une incohérence : **route visible, distance/prix non mis à jour**.

---

## Objectif
1) **Distance fiable** (même si `google-maps-proxy` échoue)  
2) **Prix calculés cohérents et précis** = `base_price + distance_km * price_per_km`, avec `minimum_fare` respecté  
3) **Devise correcte** (Abidjan = XOF, RDC = CDF) partout (cartes véhicules, bouton Continuer, modal confirmation)

---

## Solution (approche optimale)
### Principe : Une seule source de vérité pour la distance = la route réellement affichée sur la carte
Le composant carte `ProfessionalRoutePolyline` calcule déjà une route avec `professionalRouteService` (JS Directions API) et obtient `distanceText/distance` fiables.  
On va donc **remonter ce résultat au parent** (`ModernTaxiInterface`) et utiliser cette distance pour la tarification.

Cela élimine la dépendance à `secureNavigationService` pour le pricing taxi (et donc élimine l’erreur de clé referer).

---

## Étapes d’implémentation

### Étape A — Remonter la distance/durée depuis la carte (source route pro)
**Fichiers :**
- `src/components/transport/map/OptimizedMapView.tsx`
- `src/components/transport/ModernTaxiInterface.tsx`

1. Dans `OptimizedMapView`, ajouter une prop optionnelle :
   - `onRouteCalculated?: (result: ProfessionalRouteResult) => void`
2. Passer cette prop à `<ProfessionalRoutePolyline onRouteCalculated={...} />`
3. Dans `ModernTaxiInterface`, fournir un handler :
   - `setDistance(result.distance / 1000)`
   - `setRouteData({ distance: result.distance, duration: result.duration, distanceText: result.distanceText, durationText: result.durationText, provider: result.provider })`
4. Mettre `calculatingRoute` à `true` dès qu’on change pickup/destination, et à `false` quand `onRouteCalculated` arrive.

Résultat : dès que la route est tracée, la distance est mise à jour → les prix se recalculent correctement.

---

### Étape B — Fallback robuste si Google JS Directions échoue (précision minimale)
**Fichiers :**
- `src/components/transport/map/ProfessionalRoutePolyline.tsx` (ou `ModernTaxiInterface.tsx` selon pattern choisi)

Si `professionalRouteService` échoue (offline / Maps pas chargé), calculer une distance “secours” :
- soit via `google.maps.geometry.spherical.computeDistanceBetween` (lib geometry déjà chargée)
- soit via un utilitaire Haversine existant (si présent dans vos services)

Puis :
- `distanceKm = fallbackMeters / 1000`
- `duration` approximative (ex: 30 km/h urbain)

But : éviter tout “prix figé” même en mode dégradé.

---

### Étape C — Corriger la devise (XOF vs CDF) partout dans l’UI taxi
Actuellement, plusieurs composants affichent “CDF” en dur.

**Fichiers :**
- `src/components/transport/UnifiedTaxiSheet.tsx` (CTA + `pricePerKm`)
- `src/components/transport/PremiumVehicleCarousel.tsx` (badge devise)
- `src/components/transport/PriceConfirmationModal.tsx` (prix total + économies + labels)
- `src/components/transport/ModernTaxiInterface.tsx` (passe la devise aux enfants)

Plan :
1. Déterminer `currency` depuis `currentCity.currency` (déjà dans `CityConfig`), fallback `'CDF'`.
2. Passer `currency` en props aux composants (sheet, carousel, modal).
3. Remplacer tous les “CDF” hardcodés par `{currency}`.

Résultat : à Abidjan on voit XOF partout, et en RDC CDF partout.

---

### Étape D — Tarification “pro” : respecter minimum_fare + rendre le calcul unique
**Fichiers :**
- `src/hooks/useVehicleTypes.ts`
- `src/types/vehicle.ts` (si on ajoute de nouveaux champs)

1. Dans `useVehicleTypes`, récupérer `minimum_fare` et `currency` depuis `pricing_rules` et les mapper dans les objets véhicule (si on choisit d’exposer ces champs).
2. Calculer le prix final avec :
   - `raw = basePrice + distanceKm * pricePerKm`
   - `final = Math.max(raw, minimumFare ?? 0)`
3. Garder le calcul dynamique dans `ModernTaxiInterface` (ou déplacer la logique dans le hook, mais toujours avec `minimum_fare` appliqué).

Note : même si à Abidjan `minimum_fare == base_price`, cette étape rend le système correct pour toutes les villes.

---

### Étape E — Nettoyage : ne plus dépendre de `secureNavigationService` pour le pricing taxi
**Fichier :**
- `src/components/transport/ModernTaxiInterface.tsx`

- Supprimer/neutraliser `calculateRouteAndPrice()` basé sur `secureNavigationService` (ou le garder uniquement comme fallback secondaire).
- But : éliminer la cause “distance bloquée” (clé HTTP referer).

---

## Correctif de fond (optionnel mais recommandé) : réparer `google-maps-proxy` (clé Google)
Même si on rend le taxi autonome, vos autres modules qui utilisent `google-maps-proxy` (directions/distancematrix) peuvent être impactés.

Action côté Google Cloud Console :
- Créer une **clé serveur** (Directions API / Distance Matrix API) sans “HTTP referrer restriction”
- Restreindre par APIs + quotas, idéalement IP restriction (si possible) ou autre mécanisme adapté à Edge Functions
- Mettre cette clé dans le secret `GOOGLE_MAPS_API_KEY` (ou créer `GOOGLE_MAPS_SERVER_API_KEY` et adapter l’edge function)

---

## Tests de validation (end-to-end)
1) Aller sur `/transport`, ville = Abidjan, destination = Bingerville  
2) Vérifier qu’après le tracé de la route :
   - la distance n’est pas 0 (ex: ~10–25 km selon le point de départ)
   - les cartes véhicules n’affichent plus les prix de base mais des prix dépendants de la distance
   - le bouton “Continuer” reflète le même prix que la carte sélectionnée
3) Vérifier la devise :
   - Abidjan : XOF
   - Kinshasa/Lubumbashi/Kolwezi : CDF
4) Ouvrir le modal de confirmation :
   - distance/km cohérente
   - prix cohérent et même devise

---

## Fichiers impactés (résumé)
- `src/components/transport/ModernTaxiInterface.tsx`
- `src/components/transport/map/OptimizedMapView.tsx`
- `src/components/transport/map/ProfessionalRoutePolyline.tsx` (si fallback / events)
- `src/components/transport/UnifiedTaxiSheet.tsx`
- `src/components/transport/PremiumVehicleCarousel.tsx`
- `src/components/transport/PriceConfirmationModal.tsx`
- `src/hooks/useVehicleTypes.ts`
- `src/types/vehicle.ts` (si on ajoute currency/minimumFare)

---

## Résultat attendu
- Prix taxi “pro”, cohérents et précis, basés sur la distance réelle de la route affichée
- Plus de prix figés (4300/2500/1500) quand la route est visible
- Devise correcte (XOF à Abidjan)
- Expérience stable même si l’API HTTP proxy échoue
