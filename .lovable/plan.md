
# Plan de Correction : Erreur Rate Limiting et Flux Livraison

## Diagnostic du Probleme

### Cause Racine Identifiee
L'erreur **"ThrottlerException: Too Many Requests"** est causee par des **appels multiples dupliques** a `complete-ride-with-commission` lors de la completion d'une livraison.

### Flux Actuel (Problematique)

```text
Driver termine livraison
  ├─> completeDelivery() → complete-ride-with-commission (APPEL #1)
  └─> updateDeliveryStatus('delivered')
        ├─> complete-ride-with-commission (APPEL #2)
        └─> delivery-status-manager Edge Function
              └─> complete-ride-with-commission (APPEL #3)
```

**3 appels simultanes** declenchent le rate limiter Supabase!

### Fichiers Concernes
| Fichier | Probleme |
|---------|----------|
| `src/components/delivery/DeliveryDriverInterface.tsx` | Appelle `completeDelivery()` PUIS `updateDeliveryStatus('delivered')` |
| `src/hooks/useDriverDeliveryActions.tsx` | `completeDelivery()` appelle `complete-ride-with-commission` |
| `src/hooks/useUnifiedDeliveryQueue.tsx` | `updateDeliveryStatus('delivered')` appelle aussi `complete-ride-with-commission` |
| `supabase/functions/delivery-status-manager/index.ts` | Statut 'delivered' appelle aussi `complete-ride-with-commission` |
| `src/components/driver/DriverDeliveryDashboard.tsx` | Mise a jour directe DB sans commission (incoherent) |

---

## Solution Proposee

### Principe : Un Seul Point d'Entree pour la Commission

Le flux doit etre :
1. **Client-side** : Appelle `complete-ride-with-commission` UNE SEULE FOIS
2. **Server-side** : `delivery-status-manager` ne doit PAS appeler la commission (elle est deja faite cote client)
3. **Coherence** : Tous les composants utilisent le meme hook unifie

### Modifications Requises

#### 1. `src/components/delivery/DeliveryDriverInterface.tsx`
**Probleme** : Double appel (completeDelivery + updateDeliveryStatus)
**Solution** : Utiliser UNIQUEMENT `updateDeliveryStatus('delivered')` qui gere tout

```typescript
// AVANT (double appel)
const handleCompleteDelivery = async () => {
  const success = await completeDelivery(activeDelivery.id, recipientName, undefined, notes);
  if (success) {
    await updateDeliveryStatus('delivered'); // 2EME APPEL
  }
};

// APRES (appel unique)
const handleCompleteDelivery = async () => {
  // updateDeliveryStatus gere deja tout (commission + update status)
  const success = await updateDeliveryStatus('delivered');
  if (success) {
    setNotes('');
    setRecipientName('');
  }
};
```

#### 2. `src/hooks/useUnifiedDeliveryQueue.tsx`
**Probleme** : Appelle complete-ride-with-commission mais aussi met a jour la table
**Solution** : Ajouter les donnees de preuve de livraison (recipient, notes)

```typescript
// Ajouter un parametre optionnel pour les donnees de completion
const updateDeliveryStatus = async (
  status: string, 
  completionData?: { recipientName?: string; notes?: string }
) => {
  if (!activeDelivery || !user) return false;

  setLoading(true);
  try {
    if (status === 'delivered' || status === 'completed') {
      const { data, error } = await supabase.functions.invoke(
        'complete-ride-with-commission',
        {
          body: {
            rideId: activeDelivery.id,
            rideType: 'delivery',
            driverId: user.id,
            finalAmount: activeDelivery.estimated_fee || 0,
            paymentMethod: 'cash',
            // Ajouter les donnees de completion
            deliveryProof: completionData ? {
              recipient_name: completionData.recipientName,
              notes: completionData.notes,
              delivery_time: new Date().toISOString()
            } : undefined
          }
        }
      );

      if (error) throw error;

      // NE PAS FAIRE de mise a jour supplementaire ici
      // complete-ride-with-commission met deja a jour le statut
      
      setActiveDelivery(null);
      // Afficher resultat...
      return true;
    }
    // ... reste du code
  }
};
```

#### 3. `supabase/functions/delivery-status-manager/index.ts`
**Probleme** : Appelle `complete-ride-with-commission` quand statut = 'delivered'
**Solution** : SUPPRIMER cet appel car la commission est geree cote client

```typescript
// AVANT (lignes 132-178)
if (newStatus === 'delivered' && driverId) {
  const { data: commissionResult } = await supabase.functions.invoke(
    'complete-ride-with-commission', 
    { body: {...} }
  );
  // ...
}

// APRES - SUPPRIMER ce bloc entier
// La commission est geree par le client (useUnifiedDeliveryQueue)
// delivery-status-manager ne doit que:
// - Mettre a jour le statut
// - Creer l'historique
// - Envoyer les notifications
// - Rendre le chauffeur disponible
```

#### 4. `src/hooks/useDriverDeliveryActions.tsx`
**Probleme** : `completeDelivery()` fait un appel separe a la commission
**Solution** : Deprecier cette fonction, utiliser `useUnifiedDeliveryQueue.updateDeliveryStatus`

```typescript
// Marquer comme deprecated et rediriger vers le flux unifie
const completeDelivery = async (
  orderId: string, 
  recipientName: string, 
  deliveryPhoto?: File, 
  notes?: string
) => {
  console.warn('⚠️ completeDelivery() est deprecie. Utiliser updateDeliveryStatus()');
  
  // Simplement mettre a jour le statut via delivery-status-manager
  // La commission sera geree par le hook unifie
  return updateDeliveryStatus(orderId, 'delivered', {
    deliveryProof: {
      recipient_name: recipientName,
      delivery_time: new Date().toISOString(),
      photo_taken: !!deliveryPhoto,
      driver_notes: notes
    }
  });
};
```

#### 5. `src/components/driver/DriverDeliveryDashboard.tsx`
**Probleme** : Mise a jour directe sans commission
**Solution** : Utiliser le hook unifie pour garantir la commission

```typescript
// AVANT (lignes 201-260) - mise a jour directe
const completeDelivery = async () => {
  await supabase
    .from('delivery_orders')
    .update({ status: 'delivered', ... })
    .eq('id', selectedDelivery);
};

// APRES - utiliser le hook unifie
import { useUnifiedDeliveryQueue } from '@/hooks/useUnifiedDeliveryQueue';

const { updateDeliveryStatus } = useUnifiedDeliveryQueue();

const completeDelivery = async () => {
  const success = await updateDeliveryStatus('delivered');
  if (success) {
    // Reset UI...
  }
};
```

---

## Flux Corrige

```text
Driver termine livraison
  └─> updateDeliveryStatus('delivered') 
        └─> complete-ride-with-commission (APPEL UNIQUE)
              ├─> Verifie abonnement ou calcule commission
              ├─> Debite wallet si mode commission
              ├─> Insert ride_commissions
              └─> Met a jour statut 'completed'
```

---

## Tests de Validation

### Test 1 : Completion Livraison Directe
1. Accepter une livraison directe sur `/driver/delivery`
2. Passer par tous les statuts (picked_up -> in_transit -> delivered)
3. Verifier : UN SEUL appel a `complete-ride-with-commission` dans les logs
4. Verifier : Commission enregistree dans `ride_commissions`

### Test 2 : Completion Livraison Marketplace
1. Accepter une livraison marketplace
2. Terminer la livraison
3. Verifier : Pas d'erreur "Too Many Requests"
4. Verifier : Wallet debite correctement

### Test 3 : Mode Abonnement
1. Chauffeur avec abonnement actif
2. Terminer une livraison
3. Verifier : `rides_remaining` decremente de 1
4. Verifier : Pas de debit wallet

---

## Resume des Modifications

| Fichier | Action | Impact |
|---------|--------|--------|
| `DeliveryDriverInterface.tsx` | Supprimer double appel | Fix rate limiting |
| `useUnifiedDeliveryQueue.tsx` | Ajouter completionData | Point d'entree unique |
| `delivery-status-manager/index.ts` | Supprimer appel commission | Eviter duplication |
| `useDriverDeliveryActions.tsx` | Deprecier completeDelivery | Coherence |
| `DriverDeliveryDashboard.tsx` | Utiliser hook unifie | Garantir commission |

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Commission deja prelevee avant fix | Verifier `ride_commissions` avant insert (idempotence) |
| Composants non migres | Logs warning pour detecter appels deprecies |
| Edge Function timeout | complete-ride-with-commission optimise (<5s) |

---

## Estimation

- **Complexite** : Moyenne
- **Fichiers impactes** : 5
- **Temps estime** : 25-35 minutes
- **Tests requis** : Completion livraison E2E sans rate limiting
