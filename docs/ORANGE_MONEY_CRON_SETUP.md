# 🔄 Configuration Cron Job Orange Money Retry

## Objectif

Automatiser la vérification et la résolution des transactions Orange Money bloquées en statut `processing`.

---

## 📋 Prérequis

1. **Extension pg_cron activée** dans Supabase
2. **Extension pg_net activée** dans Supabase
3. Edge function `orange-money-retry` déployée

---

## 🛠️ Installation

### Étape 1 : Activer les extensions

Exécutez ces requêtes SQL dans l'éditeur SQL de Supabase :

```sql
-- Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Activer pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Étape 2 : Créer le Cron Job

```sql
-- Programmer le retry toutes les 5 minutes
SELECT cron.schedule(
  'orange-money-retry-job',  -- Nom du job
  '*/5 * * * *',              -- Toutes les 5 minutes
  $$
  SELECT
    net.http_post(
        url := 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-retry',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU"}'::jsonb,
        body := json_build_object('timestamp', now())::jsonb
    ) as request_id;
  $$
);
```

### Étape 3 : Vérifier que le job est actif

```sql
-- Lister tous les jobs cron
SELECT * FROM cron.job;

-- Vérifier l'historique d'exécution
SELECT * FROM cron.job_run_details 
WHERE jobname = 'orange-money-retry-job'
ORDER BY start_time DESC 
LIMIT 10;
```

---

## ⚙️ Configuration avancée

### Modifier la fréquence

```sql
-- Toutes les 3 minutes
SELECT cron.alter_job('orange-money-retry-job', '*/3 * * * *');

-- Toutes les 10 minutes
SELECT cron.alter_job('orange-money-retry-job', '*/10 * * * *');

-- Toutes les heures
SELECT cron.alter_job('orange-money-retry-job', '0 * * * *');
```

### Désactiver temporairement

```sql
-- Supprimer le job
SELECT cron.unschedule('orange-money-retry-job');
```

### Réactiver

Réexécutez simplement la commande de création (Étape 2).

---

## 📊 Monitoring

### Vérifier les logs du job

```sql
-- Logs des 24 dernières heures
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'orange-money-retry-job'
  AND start_time >= NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
```

### Voir les transactions traitées

```sql
-- Transactions expirées par le cron dans les dernières 24h
SELECT 
  transaction_id,
  amount,
  currency,
  created_at,
  updated_at,
  metadata->>'expired_at' as expired_at,
  metadata->>'auto_expired' as auto_expired
FROM payment_transactions
WHERE 
  payment_provider = 'orange'
  AND status = 'failed'
  AND metadata->>'auto_expired' = 'true'
  AND updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

---

## 🔍 Fonctionnement détaillé

### Ce que fait le job :

1. **Récupère** les transactions `processing` depuis > 10 minutes
2. **Vérifie** si la transaction a plus de 24h :
   - Si OUI → Marque comme `failed` (expirée)
   - Si NON → Continue à surveiller
3. **Notifie** les utilisateurs des transactions expirées
4. **Log** toutes les actions pour monitoring

### Règles de gestion :

| Âge de la transaction | Action |
|-----------------------|--------|
| < 10 minutes | ✅ Aucune action (normal) |
| 10 minutes - 24h | ⏳ Surveillance active |
| > 24 heures | ❌ Expiration automatique |

---

## 🚨 Alertes et notifications

### Créer une alerte si trop de transactions bloquées

```sql
-- Créer une fonction pour alerter si > 10 transactions en processing
CREATE OR REPLACE FUNCTION alert_stuck_transactions()
RETURNS void AS $$
DECLARE
  stuck_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stuck_count
  FROM payment_transactions
  WHERE status = 'processing'
    AND payment_provider = 'orange'
    AND created_at < NOW() - INTERVAL '30 minutes';
  
  IF stuck_count > 10 THEN
    -- Insérer notification admin
    INSERT INTO admin_notifications (
      title,
      message,
      severity,
      type,
      data
    ) VALUES (
      '🚨 Alerte Orange Money',
      format('%s transactions Orange Money bloquées depuis > 30 minutes', stuck_count),
      'error',
      'payment_alert',
      json_build_object('count', stuck_count, 'provider', 'orange')
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Programmer l'alerte toutes les heures
SELECT cron.schedule(
  'alert-stuck-orange-transactions',
  '0 * * * *',  -- Toutes les heures
  'SELECT alert_stuck_transactions();'
);
```

---

## 🧪 Tests

### Tester manuellement le job

```sql
-- Appeler directement l'edge function
SELECT
  net.http_post(
      url := 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-retry',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU"}'::jsonb,
      body := '{"test": true}'::jsonb
  ) as request_id;
```

### Créer une transaction de test

```sql
-- Insérer une fausse transaction vieille de 25h
INSERT INTO payment_transactions (
  user_id,
  amount,
  currency,
  payment_method,
  payment_provider,
  transaction_id,
  status,
  created_at
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Prendre un user existant
  1000,
  'CDF',
  'mobile_money',
  'orange',
  'TEST_EXPIRED_' || extract(epoch from now())::text,
  'processing',
  NOW() - INTERVAL '25 hours'  -- Transaction de 25h
);

-- Attendre 5 minutes puis vérifier si elle est passée en 'failed'
```

---

## 📈 Métriques de performance

### Dashboard SQL pour KPIs

```sql
-- Transactions traitées par le cron dans les 7 derniers jours
SELECT 
  DATE(updated_at) as date,
  COUNT(*) as expired_count,
  SUM(amount) as total_amount_expired
FROM payment_transactions
WHERE 
  payment_provider = 'orange'
  AND status = 'failed'
  AND metadata->>'auto_expired' = 'true'
  AND updated_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY date DESC;
```

---

## 🆘 Troubleshooting

### Le job ne s'exécute pas

**Causes possibles :**
1. Extensions pg_cron ou pg_net non activées
2. Mauvaise URL de l'edge function
3. Token d'autorisation expiré

**Solution :**
```sql
-- Vérifier les extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- Vérifier les erreurs du job
SELECT * FROM cron.job_run_details 
WHERE jobname = 'orange-money-retry-job'
  AND status = 'failed'
ORDER BY start_time DESC;
```

### Le job s'exécute mais ne traite rien

**Vérifier les logs de l'edge function :**
1. Aller dans Supabase Dashboard → Edge Functions
2. Sélectionner `orange-money-retry`
3. Voir les logs d'exécution

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ Utiliser le token `anon` (pas de `service_role` dans pg_cron)
2. ✅ Limiter les permissions de pg_cron
3. ✅ Monitorer les logs régulièrement
4. ✅ Tester en staging avant production

---

## 📚 Ressources

- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Cron syntax validator](https://crontab.guru/)
- [pg_net documentation](https://github.com/supabase/pg_net)

---

**🎯 Une fois configuré, le système surveillera automatiquement vos transactions Orange Money 24/7 !**
