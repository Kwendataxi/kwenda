
# Plan de Correction : Tarification Cohérente avec Distance

## Diagnostic du Problème

L'interface affiche les prix de base (1500, 2500, 3200 CDF) au lieu des prix calcules avec la distance.

**Cause racine identifiee** : Desynchronisation entre le calcul de route et le chargement des vehicules.

### Flux actuel problematique

```text
1. Destination selectionnee ("Bingerville")
2. calculateRouteAndPrice() appele (debounce 500ms)
3. PENDANT CE TEMPS: useVehicleTypes({ distance: 0 }) charge les vehicules
4. Vehicules affiches avec prix de base (distance = 0)
5. Route calculee → setDistance(15km)
6. useVehicleTypes({ distance: 15 }) devrait recalculer...
7. MAIS le cache React Query peut etre desynchronise
```

### Donnees DB confirmees (Abidjan)

| Vehicule | Base | Par km | Prix 15km attendu |
|----------|------|--------|-------------------|
| Moto     | 1500 | 500    | 9000 XOF          |
| Eco      | 2500 | 1500   | 25000 XOF         |
| Standard | 3200 | 1800   | 30200 XOF         |
| Premium  | 4300 | 2300   | 38800 XOF         |

---

## Solution en 3 Phases

### Phase 1 - Supprimer le double appel au hook

**Fichier : `src/components/transport/UnifiedTaxiSheet.tsx`**

Actuellement `UnifiedTaxiSheet` appelle `useVehicleTypes` alors que `ModernTaxiInterface` le fait deja et passe les vehicules.

**Modification :**
- Supprimer l'appel a `useVehicleTypes` dans `UnifiedTaxiSheet`
- Recevoir les `vehicles` en prop depuis `ModernTaxiInterface`

```typescript
// AVANT (ligne 47)
const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ distance, city });

// APRES
// Recevoir vehicles via props
interface UnifiedTaxiSheetProps {
  // ... existing props
  vehicles: VehicleType[];
  vehiclesLoading: boolean;
}
```

**Fichier : `src/components/transport/ModernTaxiInterface.tsx`**

Passer les vehicules au composant enfant :

```typescript
<UnifiedTaxiSheet
  // ... existing props
  vehicles={vehicles}
  vehiclesLoading={isLoading}
/>
```

---

### Phase 2 - Bloquer l'affichage des vehicules tant que la distance n'est pas calculee

**Fichier : `src/components/transport/ModernTaxiInterface.tsx`**

Ajouter un indicateur de calcul de route en cours :

```typescript
// Condition pour afficher les vehicules
const canShowVehicles = !calculatingRoute && distance > 0;
```

**Fichier : `src/components/transport/UnifiedTaxiSheet.tsx`**

Afficher un skeleton pendant le calcul :

```typescript
{vehiclesLoading || calculatingRoute ? (
  <VehiclesSkeleton />
) : (
  <PremiumVehicleCarousel vehicles={vehicleOptions} ... />
)}
```

---

### Phase 3 - Forcer le recalcul des prix quand la distance change

**Fichier : `src/hooks/useVehicleTypes.ts`**

Probleme : les vehicules sont fetches depuis la DB mais le prix est calcule dans le hook. Si la distance change, le fetch ne se refait pas (memes donnees DB).

**Solution : Calculer les prix dynamiquement dans le composant**

Option A - Hook retourne les donnees brutes, calcul dans le composant :

```typescript
// Dans useVehicleTypes - retourner basePrice et pricePerKm seulement
return {
  id: config.service_type,
  basePrice: pricing?.base_price || 2500,
  pricePerKm: pricing?.price_per_km || 300,
  // Supprimer calculatedPrice ici
};

// Dans ModernTaxiInterface - calculer dynamiquement
const vehiclesWithPrice = vehicles.map(v => ({
  ...v,
  calculatedPrice: Math.round(v.basePrice + (distance * v.pricePerKm))
}));
```

Option B (recommandee) - Desactiver staleTime pour les queryKeys avec distance > 0 :

```typescript
// useVehicleTypes.ts
staleTime: distance > 0 ? 0 : 5 * 60 * 1000, // Pas de cache si distance calculee
```

---

## Fichiers Modifies

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useVehicleTypes.ts` | Supprimer staleTime quand distance > 0, ou retourner prix bruts |
| `src/components/transport/ModernTaxiInterface.tsx` | Passer vehicules a UnifiedTaxiSheet, calculer prix dynamiquement |
| `src/components/transport/UnifiedTaxiSheet.tsx` | Recevoir vehicules en prop au lieu d'appeler le hook |

---

## Resultat Attendu

- Prix affiches = basePrice + (distance × pricePerKm)
- Pour Abidjan-Bingerville (~15km) :
  - Moto: 9000 XOF
  - Eco: 25000 XOF
  - Confort: 30200 XOF
  - Premium: 38800 XOF
- Mise a jour instantanee quand la route est calculee
- Plus de desynchronisation entre distance et prix
