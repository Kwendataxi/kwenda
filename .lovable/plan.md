
# Plan de Correction - Onboarding et Livraison Kwenda Food

## Diagnostic des Problemes Identifies

### Probleme 1 : Onboarding qui recommence au retour dans l'app

**Cause racine identifiee** : Incoherence dans les cles localStorage pour verifier si l'onboarding a ete vu

| Fichier | Cle utilisee | Probleme |
|---------|--------------|----------|
| `MobileAppEntry.tsx` ligne 21 | `onboarding_seen` (sans contexte) | Cle generique incorrecte |
| `MobileSplash.tsx` ligne 57 | `onboarding_seen::${ctx}` (avec contexte) | Cle correcte |
| `OnboardingRedirect.tsx` ligne 33 | `onboarding_seen::${lastCtx}` (avec contexte) | Cle correcte |
| `Onboarding.tsx` ligne 67 | `onboarding_seen::${ctx}` (avec contexte) | Cle correcte (sauvegarde) |

**Resultat** : `MobileAppEntry.tsx` verifie une cle qui n'existe jamais car elle est sauvegardee avec un suffixe de contexte. L'onboarding semble donc toujours "non vu".

### Probleme 2 : Livraison Kwenda Food incomplete

| Element | Statut | Probleme |
|---------|--------|----------|
| **Commande client** | OK | Edge function `food-order-processor` fonctionne |
| **Dialog frais livraison** | NON INTEGRE | `FoodDeliveryFeeApprovalDialog.tsx` existe mais n'est importe nulle part |
| **Suivi temps reel** | PARTIEL | Hook `useFoodClientOrders` n'inclut pas les commandes `pending_delivery_approval` |
| **Bouton livreur restaurant** | OK | Implemente dans `OrderCard.tsx` |
| **Dashboard chauffeur** | PARTIEL | `useDriverAllDeliveries` interroge `restaurants` au lieu de `restaurant_profiles` |
| **Route tracking** | MANQUANTE | `/unified-tracking/food/:orderId` non definie |

---

## Phase 1 : Correction du Bug Onboarding (CRITIQUE)

### 1.1 - Corriger MobileAppEntry.tsx

**Fichier** : `src/components/navigation/MobileAppEntry.tsx`

**Modification** : Aligner la verification sur le meme format que les autres composants

```typescript
// AVANT (ligne 21)
const onboardingSeen = localStorage.getItem("onboarding_seen") === "1";

// APRES
const ctx = localStorage.getItem("last_context") || "client";
const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
```

### 1.2 - Ajouter persistance supplementaire dans Onboarding.tsx

**Fichier** : `src/pages/Onboarding.tsx`

**Modification** : Sauvegarder egalement la cle generique comme fallback

```typescript
// Ajouter apres ligne 67
localStorage.setItem("onboarding_seen", "1"); // Fallback generique
```

### 1.3 - Proteger le contexte dans MobileSplash.tsx

**Fichier** : `src/pages/MobileSplash.tsx`

**Modification** : Verifier les deux cles (specifique et generique)

```typescript
// Ligne 57 - APRES
const onboardingSeenGeneric = localStorage.getItem("onboarding_seen") === "1";
const onboardingSeenContextual = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
const onboardingSeen = onboardingSeenGeneric || onboardingSeenContextual;
```

---

## Phase 2 : Integration du Dialog d'Approbation des Frais Food

### 2.1 - Integrer le dialog dans FoodOrders.tsx

**Fichier** : `src/pages/food/FoodOrders.tsx`

**Modifications** :
1. Importer `FoodDeliveryFeeApprovalDialog`
2. Ajouter l'etat pour suivre les commandes en attente d'approbation
3. Afficher le dialog automatiquement

```typescript
import { FoodDeliveryFeeApprovalDialog } from '@/components/food/FoodDeliveryFeeApprovalDialog';
import { useEffect, useState } from 'react';

// Dans le composant
const [pendingApprovalOrder, setPendingApprovalOrder] = useState<any>(null);

useEffect(() => {
  const pending = activeOrders.find(o => 
    o.status === 'pending_delivery_approval' || 
    o.delivery_payment_status === 'pending_approval'
  );
  if (pending) {
    setPendingApprovalOrder(pending);
  }
}, [activeOrders]);

// Dans le JSX, avant le closing </div>
{pendingApprovalOrder && (
  <FoodDeliveryFeeApprovalDialog
    order={{
      id: pendingApprovalOrder.id,
      status: 'pending_delivery_approval',
      customer_id: pendingApprovalOrder.client_id,
      total_amount: pendingApprovalOrder.total_amount,
      delivery_fee: pendingApprovalOrder.delivery_fee,
      restaurant: { name: pendingApprovalOrder.restaurant_name },
      items: pendingApprovalOrder.items
    }}
    open={!!pendingApprovalOrder}
    onOpenChange={() => setPendingApprovalOrder(null)}
    onApproved={() => {
      setPendingApprovalOrder(null);
      refetch();
    }}
  />
)}
```

### 2.2 - Modifier useFoodClientOrders.tsx pour inclure delivery_payment_status

**Fichier** : `src/hooks/useFoodClientOrders.tsx`

**Modifications** :
1. Ajouter `delivery_payment_status` dans le type `FoodOrder`
2. Mapper le champ depuis la requete

```typescript
// Dans l'interface FoodOrder (ajouter)
delivery_payment_status?: string;

// Dans le mapping (ligne 120)
delivery_payment_status: order.delivery_payment_status,
```

---

## Phase 3 : Correction du Hook useDriverAllDeliveries

### 3.1 - Corriger la requete food_orders

**Fichier** : `src/hooks/useDriverAllDeliveries.ts`

**Probleme** : La requete utilise `restaurants` mais la table s'appelle `restaurant_profiles`

```typescript
// AVANT (ligne 178)
restaurant:restaurants(name, address, coordinates)

// APRES
restaurant:restaurant_profiles(restaurant_name, address, coordinates)
```

### 3.2 - Adapter le normalizer

```typescript
// Ligne 111
pickupLocation: order.restaurant?.address || order.restaurant?.restaurant_name || 'Restaurant',

// Ligne 125
restaurantName: order.restaurant?.restaurant_name,
```

---

## Phase 4 : Ajout de la Route de Tracking Unifiee

### 4.1 - Creer la page de tracking food

**Nouveau fichier** : `src/pages/food/FoodTracking.tsx`

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { FoodOrderTracking } from '@/components/food/FoodOrderTracking';

export default function FoodTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  if (!orderId) {
    navigate('/food/orders');
    return null;
  }

  return (
    <FoodOrderTracking 
      orderId={orderId} 
      onBack={() => navigate('/food/orders')} 
    />
  );
}
```

### 4.2 - Ajouter la route dans SharedRoutes.tsx

**Fichier** : `src/routes/SharedRoutes.tsx`

```typescript
// Ajouter import
const FoodTracking = lazy(() => import('@/pages/food/FoodTracking'));

// Ajouter route (apres les routes Food existantes)
<Route 
  path="/unified-tracking/food/:orderId" 
  element={
    <ProtectedRoute>
      <Suspense fallback={<RouteLoadingFallback />}>
        <FoodTracking />
      </Suspense>
    </ProtectedRoute>
  } 
/>
```

---

## Phase 5 : Amelioration du Flux de Livraison

### 5.1 - Mettre a jour FoodOrderTracking.tsx pour inclure les infos livreur

**Fichier** : `src/components/food/FoodOrderTracking.tsx`

**Modifications** :
1. Ajouter les champs driver dans la requete
2. Afficher une carte avec le livreur quand il est assigne

```typescript
// Modifier la requete (ligne 48 et 72)
.select(`
  id, order_number, status, total_amount, created_at,
  estimated_delivery_time, delivery_fee, delivery_address,
  driver_id,
  driver:chauffeurs!driver_id(
    display_name,
    phone_number,
    profile_photo_url,
    current_location
  ),
  restaurant_profiles (
    restaurant_name,
    phone_number
  )
`)
```

### 5.2 - Ajouter section livreur dans le tracking

```typescript
// Apres la section Restaurant (ligne 190)
{order.driver && (
  <Card>
    <CardHeader>
      <CardTitle>Votre livreur</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center gap-4">
      {order.driver.profile_photo_url && (
        <img 
          src={order.driver.profile_photo_url} 
          alt={order.driver.display_name}
          className="w-12 h-12 rounded-full object-cover"
        />
      )}
      <div className="flex-1">
        <p className="font-semibold">{order.driver.display_name}</p>
        <p className="text-sm text-muted-foreground">{order.driver.phone_number}</p>
      </div>
      <Button 
        size="sm" 
        onClick={() => window.location.href = `tel:${order.driver.phone_number}`}
      >
        <Phone className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
)}
```

---

## Phase 6 : Gestion des Statuts Manquants

### 6.1 - Ajouter les statuts manquants dans FoodOrderTracking.tsx

```typescript
const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmee', icon: CheckCircle2, color: 'bg-blue-500' },
  preparing: { label: 'En preparation', icon: Package, color: 'bg-orange-500' },
  ready: { label: 'Pret', icon: CheckCircle2, color: 'bg-green-500' },
  driver_assigned: { label: 'Livreur assigne', icon: Truck, color: 'bg-indigo-500' },
  picked_up: { label: 'En livraison', icon: Truck, color: 'bg-purple-500' },
  delivered: { label: 'Livre', icon: CheckCircle2, color: 'bg-green-600' },
  cancelled: { label: 'Annulee', icon: XCircle, color: 'bg-red-500' },
  pending_delivery_approval: { label: 'Approbation livraison', icon: Clock, color: 'bg-amber-500' },
};
```

### 6.2 - Ajouter les memes statuts dans FoodOrderCard.tsx

---

## Resume des Fichiers a Modifier

| Fichier | Type | Priorite |
|---------|------|----------|
| `src/components/navigation/MobileAppEntry.tsx` | Correction | CRITIQUE |
| `src/pages/Onboarding.tsx` | Correction | CRITIQUE |
| `src/pages/MobileSplash.tsx` | Correction | HAUTE |
| `src/pages/food/FoodOrders.tsx` | Integration dialog | HAUTE |
| `src/hooks/useFoodClientOrders.tsx` | Ajout champ | HAUTE |
| `src/hooks/useDriverAllDeliveries.ts` | Correction table | HAUTE |
| `src/routes/SharedRoutes.tsx` | Ajout route | MOYENNE |
| `src/pages/food/FoodTracking.tsx` | Creation | MOYENNE |
| `src/components/food/FoodOrderTracking.tsx` | Amelioration | MOYENNE |
| `src/components/food/FoodOrderCard.tsx` | Ajout statuts | BASSE |

---

## Tests de Validation

### Onboarding
- [ ] Ouvrir l'app pour la premiere fois -> Onboarding s'affiche
- [ ] Terminer l'onboarding -> Redirection vers /auth
- [ ] Fermer et rouvrir l'app -> Pas d'onboarding, directement auth ou dashboard
- [ ] Se connecter puis fermer/rouvrir -> Directement dashboard (pas d'onboarding)

### Kwenda Food
- [ ] Commander un repas -> Commande creee avec succes
- [ ] Restaurant confirme -> Client recoit notification
- [ ] Restaurant demande livreur -> Dialog d'approbation s'affiche cote client
- [ ] Client accepte les frais -> Livreur assigne
- [ ] Livreur confirme pickup -> Statut mis a jour temps reel
- [ ] Livreur confirme livraison -> Commande terminee
- [ ] Bouton "Suivre" dans FoodOrderCard -> Ouvre la page de tracking

