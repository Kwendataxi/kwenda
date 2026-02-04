
# Plan de Correction : Commission Livraison

## Diagnostic du Probleme

### Analyse Comparative des Flux

**TAXI (fonctionne correctement)** :
```
Chauffeur termine course 
  → RideActionPanel.handleCompleteRide()
  → Edge Function: complete-ride-with-commission
  → Calcul commission (12% Kwenda + 0-3% Partenaire)
  → Debit wallet chauffeur
  → Insert ride_commissions
  → Notification chauffeur
```

**LIVRAISON (probleme critique)** :
```
Livreur termine livraison
  → useDriverDeliveryActions.completeDelivery()
  → Edge Function: delivery-status-manager
  → Appel consume-ride (abonnement uniquement)
  → AUCUNE commission prelevee
  → AUCUN enregistrement ride_commissions
  → Livreur garde 100% du montant
```

### Evidence du Probleme
- La table `ride_commissions` est vide (0 enregistrements tous types confondus)
- Le hook `useDriverDispatch.completeOrder()` appelle uniquement `consume-ride` pour les livraisons
- L'Edge Function `delivery-status-manager` ne contient aucune logique de commission
- L'Edge Function `complete-delivery-with-payment` (marketplace) ne preleve pas de commission non plus

---

## Solution Proposee

### Niveau 1 : Unification du Flux de Completion

Modifier le flux livraison pour utiliser la meme Edge Function `complete-ride-with-commission` que le taxi.

### Fichiers a Modifier

#### 1. `src/hooks/useDriverDeliveryActions.tsx`
**Modifications :**
- Remplacer l'appel a `delivery-status-manager` par `complete-ride-with-commission` lors du statut `delivered`
- Ajouter la logique de calcul du montant final
- Afficher le detail de la commission au livreur

```typescript
// AVANT (ligne 96-113)
const completeDelivery = async (...) => {
  return updateDeliveryStatus(orderId, 'delivered', {...});
};

// APRES
const completeDelivery = async (
  orderId: string, 
  recipientName: string, 
  deliveryPhoto?: File, 
  notes?: string
) => {
  // 1. Recuperer les details de la commande
  const { data: order } = await supabase
    .from('delivery_orders')
    .select('estimated_price, actual_price, driver_id')
    .eq('id', orderId)
    .single();

  // 2. Appeler complete-ride-with-commission
  const { data, error } = await supabase.functions.invoke(
    'complete-ride-with-commission',
    {
      body: {
        rideId: orderId,
        rideType: 'delivery',
        driverId: user.id,
        finalAmount: order?.actual_price || order?.estimated_price || 0,
        paymentMethod: 'cash'
      }
    }
  );

  if (error) {
    toast.error('Erreur lors du prelevement de la commission');
    return false;
  }

  // 3. Afficher le resultat
  if (data?.billing_mode === 'subscription') {
    toast.success('Livraison terminee (Abonnement)', {
      description: `Courses restantes: ${data.rides_remaining}`
    });
  } else {
    toast.success('Livraison terminee !', {
      description: `Net: ${data.driver_net_amount?.toLocaleString()} CDF | Commission: ${data.commission?.amount?.toLocaleString()} CDF`
    });
  }

  return true;
};
```

#### 2. `src/hooks/useDriverDispatch.tsx`
**Modifications (lignes 304-325) :**
- Remplacer la logique de completion delivery par un appel a `complete-ride-with-commission`

```typescript
// AVANT
case 'delivery':
  const { error: deliveryError } = await supabase
    .from('delivery_orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .eq('id', orderId);
  
  if (!deliveryError && user) {
    await supabase.functions.invoke('consume-ride', {...});
  }
  success = !deliveryError;
  break;

// APRES
case 'delivery':
  const { data: deliveryOrder } = await supabase
    .from('delivery_orders')
    .select('estimated_price, actual_price')
    .eq('id', orderId)
    .single();

  const { data: deliveryResult, error: deliveryError } = await supabase.functions.invoke(
    'complete-ride-with-commission',
    {
      body: {
        rideId: orderId,
        rideType: 'delivery',
        driverId: user!.id,
        finalAmount: deliveryOrder?.actual_price || deliveryOrder?.estimated_price || 0,
        paymentMethod: 'cash'
      }
    }
  );

  if (!deliveryError && deliveryResult?.success) {
    toast.success('Livraison terminee !', {
      description: deliveryResult.billing_mode === 'subscription'
        ? `Courses restantes: ${deliveryResult.rides_remaining}`
        : `Commission: ${deliveryResult.commission?.amount?.toLocaleString()} CDF`
    });
    success = true;
  }
  break;
```

#### 3. `src/hooks/useUnifiedDeliveryQueue.tsx`
**Modifications (lignes 165-209) :**
- Ajouter l'appel a `complete-ride-with-commission` dans `updateDeliveryStatus`

```typescript
const updateDeliveryStatus = async (status: string) => {
  if (!activeDelivery) return false;

  setLoading(true);
  try {
    // Si statut = delivered, utiliser complete-ride-with-commission
    if (status === 'delivered' || status === 'completed') {
      const { data, error } = await supabase.functions.invoke(
        'complete-ride-with-commission',
        {
          body: {
            rideId: activeDelivery.id,
            rideType: activeDelivery.type === 'marketplace' ? 'delivery' : 'delivery',
            driverId: user!.id,
            finalAmount: activeDelivery.estimated_fee || 0,
            paymentMethod: 'cash'
          }
        }
      );

      if (error) throw error;

      setActiveDelivery(null);
      toast.success('Livraison terminee avec commission prelevee !');
      return true;
    }

    // Sinon, mise a jour normale du statut
    // ... code existant pour autres statuts ...
  } catch (error) {
    // ...
  }
};
```

#### 4. `supabase/functions/delivery-status-manager/index.ts`
**Modifications (lignes 131-163) :**
- Remplacer l'appel a `consume-ride` par `complete-ride-with-commission`

```typescript
// AVANT
if (newStatus === 'delivered' && driverId) {
  console.log(`Livraison terminee - Consommation ride pour ${driverId}`);
  
  const { data: consumeResult, error: consumeError } = await supabase.functions.invoke('consume-ride', {
    body: {
      driver_id: driverId,
      booking_id: orderId,
      service_type: 'delivery'
    }
  });
  // ...
}

// APRES
if (newStatus === 'delivered' && driverId) {
  console.log(`Livraison terminee - Prelevement commission pour ${driverId}`);
  
  const { data: commissionResult, error: commissionError } = await supabase.functions.invoke(
    'complete-ride-with-commission', 
    {
      body: {
        rideId: orderId,
        rideType: 'delivery',
        driverId: driverId,
        finalAmount: currentOrder.estimated_price || currentOrder.actual_price || 0,
        paymentMethod: 'cash'
      }
    }
  );

  if (commissionError) {
    console.error('Erreur commission:', commissionError);
  } else {
    console.log(`Commission prelevee: ${commissionResult?.commission?.amount} CDF`);
    console.log(`Mode: ${commissionResult?.billing_mode}`);
  }
}
```

### Niveau 2 : Ajout Composant Affichage Commission Livraison

#### 5. Nouveau composant `src/components/driver/DeliveryCommissionDetails.tsx`
Creer un composant similaire a `RideCommissionDetails.tsx` pour afficher le detail des commissions livraison.

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, Building, Wallet } from 'lucide-react';

interface DeliveryCommissionDetailsProps {
  deliveryAmount: number;
  kwendaCommission: number;
  kwendaRate: number;
  partnerCommission: number;
  partnerRate: number;
  driverNetAmount: number;
  billingMode: 'subscription' | 'commission';
  ridesRemaining?: number;
}

export const DeliveryCommissionDetails: React.FC<DeliveryCommissionDetailsProps> = ({
  deliveryAmount,
  kwendaCommission,
  kwendaRate,
  partnerCommission,
  partnerRate,
  driverNetAmount,
  billingMode,
  ridesRemaining
}) => {
  if (billingMode === 'subscription') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-green-600" />
            Mode Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {deliveryAmount.toLocaleString()} CDF
          </div>
          <p className="text-sm text-muted-foreground">
            Aucune commission - Courses restantes: {ridesRemaining}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Detail Commission Livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>Montant livraison</span>
          <span className="font-bold">{deliveryAmount.toLocaleString()} CDF</span>
        </div>
        
        <div className="flex justify-between text-orange-600">
          <span>Frais Kwenda ({kwendaRate}%)</span>
          <span>-{kwendaCommission.toLocaleString()} CDF</span>
        </div>
        
        {partnerCommission > 0 && (
          <div className="flex justify-between text-purple-600">
            <span>Frais Partenaire ({partnerRate}%)</span>
            <span>-{partnerCommission.toLocaleString()} CDF</span>
          </div>
        )}
        
        <div className="border-t pt-2 flex justify-between">
          <span className="font-bold">Votre gain net</span>
          <span className="text-xl font-bold text-green-600">
            {driverNetAmount.toLocaleString()} CDF
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Niveau 3 : Tests et Validation

#### 6. Script de test SQL
```sql
-- Verifier les commissions livraison apres implementation
SELECT 
  ride_type,
  COUNT(*) as total,
  SUM(kwenda_commission) as total_kwenda,
  SUM(partner_commission) as total_partner,
  SUM(driver_net_amount) as total_drivers
FROM ride_commissions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ride_type;
```

---

## Resume des Modifications

| Fichier | Action | Impact |
|---------|--------|--------|
| `useDriverDeliveryActions.tsx` | Modifier `completeDelivery` | Fix principal |
| `useDriverDispatch.tsx` | Modifier case `delivery` | Coherence dispatch |
| `useUnifiedDeliveryQueue.tsx` | Ajouter commission | Queue unifiee |
| `delivery-status-manager/index.ts` | Remplacer consume-ride | Edge Function |
| `DeliveryCommissionDetails.tsx` | Creer composant | UX transparence |

---

## Flux Apres Correction

```
Livreur termine livraison
  → Hook/Component appelle completeDelivery()
  → Edge Function: complete-ride-with-commission
  → Verification abonnement actif ?
    → OUI: Decrementer rides_remaining, billing_mode = 'subscription'
    → NON: Calculer 12% Kwenda + 0-3% Partenaire
  → Debiter wallet livreur (si mode commission)
  → Insert ride_commissions (ride_type = 'delivery')
  → Crediter wallet partenaire (si applicable)
  → Notification livreur avec details
  → Mettre a jour statut commande
```

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Wallet insuffisant | Systeme overdue + suspension apres 2 impasses (deja implemente) |
| Double prelevement | Verification ride_commissions avant insert |
| Regression taxi | Aucun changement sur le flux taxi |
| Livreur sans partenaire | partner_rate = 0 par defaut |

---

## Estimation

- **Complexite** : Moyenne
- **Fichiers impactes** : 5
- **Temps estime** : 30-45 minutes
- **Tests requis** : Completion livraison E2E avec verification wallet

