
# Correction Erreur Interne et Modele Hybride Abonnement/Commission

## Probleme 1 : Erreur Interne

**Cause identifiee** : L'Edge Function `complete-ride-with-commission` interroge la table `commission_settings` avec les colonnes `platform_percentage` et `partner_percentage`, mais ces colonnes n'existent pas - les vraies colonnes sont `platform_rate` et `admin_rate`.

```text
EDGE FUNCTION:
  .select('platform_percentage, partner_percentage')  ❌ N'existe pas

TABLE REELLE commission_settings:
  - platform_rate (12%)
  - admin_rate (0%)  
  - driver_rate (85%)
```

---

## Probleme 2 : Abonnement Obligatoire

Actuellement dans `RideActionPanel.tsx` (lignes 195-219), le code **bloque** les chauffeurs sans abonnement actif. Vous souhaitez un modele **hybride** ou l'abonnement est optionnel.

---

## Solution : Modele Hybride

### Deux Modes de Fonctionnement

| Mode | Commission par Course | Abonnement |
|------|----------------------|------------|
| **Sans abonnement** | 12% Kwenda + 0-3% partenaire preleves sur chaque course | Aucun paiement fixe |
| **Avec abonnement** | 0% commission | Paiement fixe (semaine/mois) avec courses limitees ou illimitees |

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHAUFFEUR ACCEPTE UNE COURSE                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Verification abonnement actif ?                                            │
│  ├─ ✅ OUI → rides_remaining > 0 ?                                          │
│  │   ├─ ✅ → Course sans commission (abonnement utilise)                    │
│  │   └─ ❌ → Bascule en mode commission                                     │
│  │                                                                          │
│  └─ ❌ NON → Mode commission active                                         │
│       → 12% Kwenda + 0-3% partenaire preleves a la fin                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Modifications Techniques

### 1. Corriger l'Edge Function (Erreur Interne)

**Fichier** : `supabase/functions/complete-ride-with-commission/index.ts`

Corriger les noms de colonnes (lignes 54-58) :

```typescript
// AVANT (colonnes incorrectes)
const { data: commissionSettings } = await supabase
  .from('commission_settings')
  .select('platform_percentage, partner_percentage')
  .eq('service_type', rideType)
  .single();

// APRES (colonnes correctes)
const { data: commissionSettings } = await supabase
  .from('commission_settings')
  .select('platform_rate, admin_rate, driver_rate')
  .eq('service_type', rideType)
  .eq('is_active', true)
  .maybeSingle();

const platformRate = commissionSettings?.platform_rate || 12.0;
const adminRate = commissionSettings?.admin_rate || 0;
```

### 2. Rendre l'abonnement optionnel

**Fichier** : `src/components/driver/RideActionPanel.tsx`

Modifier `handleAccept` pour permettre aux chauffeurs sans abonnement de travailler :

```typescript
const handleAccept = async () => {
  if (!user?.id) return;
  setLoading(true);

  // Verifier si le chauffeur a un abonnement actif (optionnel)
  const { data: subscription } = await supabase
    .from('driver_subscriptions')
    .select('id, rides_remaining, status, end_date')
    .eq('driver_id', user.id)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .maybeSingle();

  // Determiner le mode de facturation
  const hasActiveSubscription = subscription && subscription.rides_remaining > 0;
  
  if (hasActiveSubscription) {
    // Mode abonnement : pas de commission, utilise les courses incluses
    console.log('✅ Mode abonnement actif');
    toast.success('Course acceptee', {
      description: `Courses restantes: ${subscription.rides_remaining - 1}`
    });
  } else {
    // Mode commission : 12% + partenaire preleves a la fin
    console.log('💰 Mode commission active');
    toast.info('Mode commission', {
      description: 'La commission sera prelevee a la fin de la course'
    });
  }

  // Accepter la course dans tous les cas
  await updateStatus('driver_arrived');
  setLoading(false);
};
```

### 3. Adapter l'Edge Function pour le modele hybride

**Fichier** : `supabase/functions/complete-ride-with-commission/index.ts`

Ajouter la logique pour verifier si le chauffeur a un abonnement actif :

```typescript
// Avant de calculer la commission, verifier l'abonnement
const { data: subscription } = await supabase
  .from('driver_subscriptions')
  .select('id, rides_remaining, status')
  .eq('driver_id', driverId)
  .eq('status', 'active')
  .maybeSingle();

let commissionAmount = 0;
let driverNetAmount = finalAmount;
let billingMode: 'subscription' | 'commission' = 'commission';

if (subscription && subscription.rides_remaining > 0) {
  // Mode abonnement : pas de commission
  billingMode = 'subscription';
  console.log('📋 Mode abonnement - pas de commission');
  
  // Decrementer les courses restantes
  await supabase
    .from('driver_subscriptions')
    .update({ rides_remaining: subscription.rides_remaining - 1 })
    .eq('id', subscription.id);
    
} else {
  // Mode commission : prelever les frais
  billingMode = 'commission';
  
  // Recuperer le taux du partenaire si applicable
  const { data: partnerDriver } = await supabase
    .from('partner_drivers')
    .select('commission_rate, partner_id')
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .maybeSingle();

  const kwendaRate = commissionSettings?.platform_rate || 12.0;
  const partnerRate = Math.min(partnerDriver?.commission_rate || 0, 3.0); // Max 3%
  const totalRate = kwendaRate + partnerRate;

  commissionAmount = (finalAmount * totalRate) / 100;
  driverNetAmount = finalAmount - commissionAmount;
  
  console.log(`💰 Mode commission: ${totalRate}% (Kwenda ${kwendaRate}% + Partenaire ${partnerRate}%)`);
  
  // Prelever du wallet...
}
```

### 4. Ajouter un indicateur dans ride_commissions

Modifier l'insertion pour tracker le mode de facturation :

```typescript
await supabase.from('ride_commissions').insert({
  ride_id: rideId,
  driver_id: driverId,
  ride_amount: finalAmount,
  commission_rate: billingMode === 'subscription' ? 0 : totalCommissionRate,
  commission_amount: commissionAmount,
  driver_net_amount: driverNetAmount,
  payment_status: billingMode === 'subscription' ? 'subscription' : paymentStatus,
  billing_mode: billingMode,  // Nouveau champ
  subscription_id: subscription?.id || null
});
```

---

## Resume des Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `supabase/functions/complete-ride-with-commission/index.ts` | Corriger noms colonnes, ajouter logique hybride |
| `src/components/driver/RideActionPanel.tsx` | Rendre abonnement optionnel, afficher mode facturation |

---

## Avantages du Modele Hybride

| Aspect | Sans Abonnement | Avec Abonnement |
|--------|-----------------|-----------------|
| **Cout initial** | Gratuit | Paiement fixe |
| **Commission/course** | 12% Kwenda + 0-3% partenaire | 0% |
| **Ideal pour** | Chauffeurs occasionnels | Chauffeurs actifs (> 10 courses/semaine) |
| **Risque Kwenda** | Faible (paiement garanti) | Moyen (abonnement d'avance) |

---

## Exemple Comparatif

Un chauffeur fait 20 courses a 10,000 CDF chacune :

```text
MODE COMMISSION:
  Revenus bruts: 200,000 CDF
  Commission Kwenda (12%): -24,000 CDF
  Commission Partenaire (2%): -4,000 CDF
  Net chauffeur: 172,000 CDF

MODE ABONNEMENT (Pack 20 courses = 35,000 CDF):
  Revenus bruts: 200,000 CDF
  Abonnement paye: -35,000 CDF
  Net chauffeur: 165,000 CDF

→ Pour ce volume, le mode commission est plus avantageux.
→ Au-dela de ~25 courses, l'abonnement devient rentable.
```

Cette approche flexible permet aux chauffeurs de choisir selon leur activite.
