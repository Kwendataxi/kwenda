# Orange Money B2B RDC Webhook

Webhook handler pour recevoir les notifications de statut de paiement d'Orange Money RDC (API B2B).

## 📋 Vue d'ensemble

Ce webhook reçoit les notifications asynchrones d'Orange Money après l'initiation d'un paiement via l'API `/transactions/omdcashin`. Il met à jour le statut des transactions dans la base de données Kwenda.

## 🔗 Endpoints

### 1. Notifications (Production)
```
POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications
```

**Utilisé par** : Orange Money pour envoyer les notifications de statut.

**Authentification** : Aucune (endpoint public configuré dans `supabase/config.toml`)

### 2. Health Check
```
GET https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/health
```

**Utilisé pour** : Vérifier que le webhook est opérationnel.

**Réponse** :
```json
{
  "status": "ok",
  "service": "orange-money-webhook",
  "timestamp": "2025-11-18T08:34:49.000Z",
  "endpoints": {
    "notifications": "/orange-money-webhook/notifications",
    "health": "/orange-money-webhook/health"
  }
}
```

## 📨 Format du Payload (Orange → Kwenda)

Orange Money envoie ce payload après traitement du paiement :

```typescript
{
  partnerTransactionId: string;        // ID de transaction Kwenda (ex: "KWENDA_1755901635480_n5wj5wyd2")
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;              // ID de transaction Orange (ex: "OM-12345678")
  amount?: number;                     // Montant du paiement
  currency?: string;                   // Devise (CDF)
  peerId?: string;                     // Numéro de téléphone Orange
  errorCode?: string;                  // Code d'erreur (si FAILED)
  errorMessage?: string;               // Message d'erreur (si FAILED)
}
```

### Exemples de payloads

#### ✅ Paiement réussi (SUCCESS)
```json
{
  "partnerTransactionId": "KWENDA_1755901635480_n5wj5wyd2",
  "transactionStatus": "SUCCESS",
  "transactionId": "OM-12345678",
  "amount": 5000,
  "currency": "CDF",
  "peerId": "243999999999"
}
```

#### ❌ Paiement échoué (FAILED)
```json
{
  "partnerTransactionId": "KWENDA_1755901635480_error123",
  "transactionStatus": "FAILED",
  "transactionId": "OM-12345679",
  "amount": 5000,
  "currency": "CDF",
  "errorCode": "INSUFFICIENT_FUNDS",
  "errorMessage": "Solde insuffisant"
}
```

#### ⏳ Paiement en attente (PENDING)
```json
{
  "partnerTransactionId": "KWENDA_1755901635480_pending",
  "transactionStatus": "PENDING",
  "transactionId": "OM-12345680",
  "amount": 5000,
  "currency": "CDF"
}
```

## 🔄 Flux de traitement

1. **Réception** : Le webhook reçoit la notification POST sur `/notifications`
2. **Validation** : Vérification des champs requis (`partnerTransactionId`, `transactionStatus`)
3. **Recherche** : Recherche de la transaction dans `payment_transactions` par `transaction_id`
4. **Mise à jour** : 
   - Si `SUCCESS` : `status = 'completed'`
   - Si `FAILED` : `status = 'failed'` + métadonnées d'erreur
   - Si `PENDING` : `status = 'pending'`
5. **Réponse** : Toujours retourne `200 OK` (même en cas d'erreur) pour éviter les retry infinis d'Orange

## 🧪 Tests

### Test manuel avec curl

```bash
# Test avec transaction existante
curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "partnerTransactionId": "KWENDA_1755901635480_n5wj5wyd2",
    "transactionStatus": "SUCCESS",
    "transactionId": "OM-TEST-12345",
    "amount": 500,
    "currency": "CDF"
  }'
```

### Script de test automatisé

```bash
# Rendre le script exécutable
chmod +x test-orange-webhook.sh

# Lancer tous les tests
./test-orange-webhook.sh

# Tester avec une transaction spécifique
./test-orange-webhook.sh KWENDA_1755901635480_n5wj5wyd2
```

Le script teste :
- ✅ Health check
- ✅ Endpoint invalide (404)
- ✅ Notification SUCCESS
- ✅ Notification FAILED
- ✅ Notification PENDING
- ✅ Champs manquants (erreur)

## 📊 Logs disponibles

Les logs détaillés incluent :
- 🍊 Timestamp de chaque requête
- 🍊 Méthode HTTP et path
- 📱 Payload complet reçu
- 🔍 Recherche de transaction (avec comptage)
- ✅ Confirmation de mise à jour
- ❌ Erreurs avec détails de debugging

### Accéder aux logs

**Supabase Dashboard** :
```
https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/orange-money-webhook/logs
```

**CLI Supabase** :
```bash
supabase functions logs orange-money-webhook --project-ref wddlktajnhwhyquwcdgf
```

## ⚙️ Configuration Orange Money

Pour que le webhook fonctionne, Orange Money doit configurer l'URL de notification dans leur dashboard B2B :

```
URL de notification : https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications
Méthode : POST
Content-Type : application/json
```

## 🐛 Debugging

### Transaction introuvable (404)

**Symptôme** : Le webhook retourne "Transaction not found but acknowledged"

**Causes possibles** :
1. Le `partnerTransactionId` ne correspond à aucune transaction dans `payment_transactions`
2. La transaction existe mais avec un autre `transaction_id`
3. La transaction a été supprimée

**Solution** :
- Vérifier les logs du webhook (affiche les 5 dernières transactions Orange)
- Vérifier la table `payment_transactions` :
  ```sql
  SELECT * FROM payment_transactions 
  WHERE payment_provider = 'orange' 
  AND transaction_id = 'KWENDA_xxx';
  ```

### Webhook non appelé par Orange

**Symptôme** : Aucun log du webhook malgré un paiement initié

**Causes possibles** :
1. URL de notification non configurée chez Orange Money
2. Problème réseau entre Orange et Supabase
3. Orange n'a pas encore traité le paiement

**Solution** :
- Contacter le support Orange Money B2B RDC
- Vérifier que l'URL est correcte dans leur dashboard
- Utiliser `orange-money-retry` pour les transactions bloquées

## 🔗 Fichiers liés

- **Initiation paiement** : `supabase/functions/mobile-money-payment/index.ts`
- **Retry automatique** : `supabase/functions/orange-money-retry/index.ts`
- **Configuration** : `supabase/config.toml`
- **Tests** : `test-orange-webhook.sh`

## 📚 Documentation Orange Money

- API B2B RDC : https://api.orange.com/
- Endpoint OAuth : `POST /oauth/v3/token`
- Endpoint paiement : `POST /transactions/omdcashin`
- Format téléphone : `243XXXXXXXXX` (sans +)

## 🛡️ Sécurité

- **CORS** : Activé (`Access-Control-Allow-Origin: *`)
- **Authentification** : Aucune (webhook public pour Orange)
- **Validation** : Vérification des champs requis
- **Idempotence** : Toujours retourne 200 OK pour éviter les retry
- **RLS** : Utilise `service_role_key` pour bypasser les policies

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase
2. Tester avec le script `test-orange-webhook.sh`
3. Vérifier la configuration dans le dashboard Orange Money
4. Contacter le support technique Orange Money B2B RDC
