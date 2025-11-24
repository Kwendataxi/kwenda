# 🍊 Mobile Money Payment - Orange Money B2B RDC

## Configuration Orange Money B2B RDC Officielle

### Base URL
```
ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-b2b/v1/cd
```

### Endpoint Unique
```http
POST https://api.orange.com/orange-money-b2b/v1/cd/transactions
```

**⚠️ IMPORTANT** : Il n'y a qu'UN SEUL endpoint `/transactions` pour Orange Money B2B RDC.
- ❌ Pas de `/cashout`
- ❌ Pas de `/cashin`
- ❌ Pas de `/omdcashin`
- ✅ Uniquement `/transactions`

### Headers Requis
```http
Authorization: Bearer <access_token>
Content-Type: application/json
X-Pos-Id: GeQpqUI
```

### Body Request (Cashout)
```json
{
  "amount": 10000,
  "currency": "CDF",
  "partnerTransactionId": "KWENDA_1234567890_ABC123",
  "receiverMSISDN": "243999123456",
  "description": "Kwenda Cashout"
}
```

### Champs Obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `amount` | number | Montant en CDF (500-500000) | `10000` |
| `currency` | string | Devise (toujours "CDF") | `"CDF"` |
| `partnerTransactionId` | string | ID unique transaction partenaire | `"KWENDA_1234_ABC"` |
| `receiverMSISDN` | string | Numéro avec préfixe 243 (12 chiffres) | `"243999123456"` |
| `description` | string | Description de la transaction | `"Kwenda Cashout"` |

### Format Numéro de Téléphone

**⚠️ IMPORTANT : Orange Money B2B RDC n'utilise PAS le code pays "243" dans le body**

**receiverMSISDN** doit être au format local (9 chiffres uniquement) :

| Input Client | Normalisation | receiverMSISDN |
|--------------|---------------|----------------|
| `0855354014` | Retirer `0` | `855354014` |
| `+243855354014` | Retirer `+243` | `855354014` |
| `243855354014` | Retirer `243` | `855354014` |

**Règles** :
- ✅ **9 chiffres uniquement** (sans préfixe)
- ✅ Format : `XXXXXXXXX`
- ❌ **Pas de code pays "243"**
- ❌ Pas d'espaces, tirets ou parenthèses

### Header X-Pos-Id

Le `POS_ID` (`GeQpqUI`) doit être dans le **header** `X-Pos-Id`, **PAS dans le body**.

```typescript
// ✅ CORRECT
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Pos-Id': 'GeQpqUI'
}

// ❌ INCORRECT
body: {
  amount: 10000,
  posId: 'GeQpqUI' // ❌ Pas dans le body !
}
```

### Response Success (200/201)

```json
{
  "transactionId": "MP240123.1234.A12345",
  "transactionStatus": "SUCCESS",
  "partnerTransactionId": "KWENDA_1234567890_ABC123",
  "amount": 10000,
  "currency": "CDF"
}
```

### Response Error (400/401/404/500)

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid receiver MSISDN format",
    "details": "Expected format: 243XXXXXXXXX"
  }
}
```

## Secrets Supabase Requis

```bash
# OAuth 2-legged
ORANGE_MONEY_CLIENT_ID="votre_client_id"
ORANGE_MONEY_CLIENT_SECRET="votre_client_secret"

# API B2B RDC
ORANGE_MONEY_API_URL="https://api.orange.com/orange-money-b2b/v1/cd"
ORANGE_MONEY_POS_ID="GeQpqUI"

# Auth header (optionnel, calculé automatiquement si absent)
ORANGE_MONEY_AUTH_HEADER="Basic <base64(client_id:client_secret)>"
```

## Limites Orange Money RDC

- **Montant minimum** : 500 CDF
- **Montant maximum** : 500,000 CDF
- **Rate limit** : 5 requêtes/minute par utilisateur
- **Timeout requête** : 30 secondes

## Logs de Debug

Tous les logs sont au format JSON structuré pour faciliter le monitoring :

```json
{
  "timestamp": "2025-11-21T19:45:00.000Z",
  "event": "orange_money_b2b_cashout_init",
  "user_id": "uuid-user",
  "amount": 10000,
  "currency": "CDF",
  "transaction_id": "KWENDA_1234567890_ABC123",
  "receiver_msisdn": "243855354014",
  "msisdn_format": "international_with_243",
  "full_endpoint": "https://api.orange.com/orange-money-b2b/v1/cd/transactions",
  "payload": { /* ... */ },
  "headers": {
    "has_auth": true,
    "has_pos_id": true
  }
}
```

## Références

- [Documentation Orange Money B2B RDC](https://developer.orange.com/apis/orange-money-b2b-cd/getting-started)
- Endpoint Token OAuth : `https://api.orange.com/oauth/v3/token`
- Endpoint Transactions : `https://api.orange.com/orange-money-b2b/v1/cd/transactions`

## Support

En cas de problème avec l'API Orange Money :
- Vérifier les logs edge function : [Supabase Logs](https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs)
- Contacter le support Orange Developer : support@developer.orange.com
- Documentation complète : https://developer.orange.com/apis/orange-money-b2b-cd
