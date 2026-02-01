
## Diagnostic (cause racine)

L’écran “Problème détecté / Tentative de récupération automatique” vient du composant global **`SafetyNet`** (error boundary + auto-recovery).

En inspectant les logs du navigateur, l’erreur qui fait crasher l’app en boucle est :

- **`useNavigate() may be used only in the context of a <Router> component.`**
- Call stack : `useJobNotifications.tsx` → `JobNotificationListener` → rendu dans `App.tsx`

### Pourquoi ça bloque tout
Dans `src/App.tsx`, on rend actuellement :
- `<JobNotificationListener />` **avant** `<BrowserRouter>`

Or `useJobNotifications()` appelle `useNavigate()` dès l’exécution du hook, et **React Router n’existe pas encore** (pas de contexte `<Router>`), donc ça jette une exception au render → `SafetyNet` prend le relais → re-try → re-crash → boucle.

---

## Objectif de la correction

1) **Supprimer le crash au démarrage** (bloquant)  
2) **Empêcher les boucles de recovery** déclenchées par `SafetyNet`/`HealthOrchestrator`  
3) (Optionnel mais recommandé) **Corriger le faux “réseau instable”** (HealthMonitor) qui ping Supabase sans headers et reçoit 401 en permanence

---

## Changements à faire (plan d’implémentation)

### Étape 1 — Fix critique : remettre JobNotificationListener dans le Router
**Fichier : `src/App.tsx`**

- Déplacer `<JobNotificationListener />` **à l’intérieur** de `<BrowserRouter>`.
- Emplacement conseillé (simple et sûr) :
  - Juste après `<BrowserRouter>` et avant les autres composants de navigation (`NativeBackHandler`, `NavigationGuard`, etc.)

**Avant (actuel)**
- `<JobNotificationListener />` est rendu avant `<BrowserRouter>`

**Après (cible)**
- `<BrowserRouter>`
  - `<JobNotificationListener />`
  - `<NativeBackHandler />`
  - `<HistoryBarrierManager />`
  - `<NavigationGuard> ... </NavigationGuard>`
- `</BrowserRouter>`

✅ Résultat attendu : `useNavigate()` a un Router disponible, plus d’exception, donc plus de blocage.

---

### Étape 2 — Hardening (pour éviter qu’un déplacement futur recasse tout)
**Fichier : `src/hooks/useJobNotifications.tsx`**

Objectif : rendre le code “anti-crash” même si quelqu’un remet le listener hors Router.

Deux options (choisir 1) :

#### Option A (recommandée) — Séparer “core hook” et “navigation”
- Garder `useJobNotificationsCore()` sans dépendance à React Router.
- Dans `JobNotificationListener`, qui est rendu dans le Router, utiliser `useNavigate()` puis passer un callback `onOpenJob(url)` au core hook.
- Le core hook ne connaît plus `useNavigate`.

✅ Avantage : navigation SPA conservée sans risque de crash global.

#### Option B (simple) — Remplacer `useNavigate()` par `window.location.assign`
- Supprimer `useNavigate()` dans le hook.
- Sur clic “Voir l’offre” : `window.location.assign(`/job/${job.id}`)`

✅ Avantage : impossible de crasher hors Router.
⚠️ Inconvénient : navigation full reload (moins “app-like”).

---

### Étape 3 — Bonus stabilité : corriger le ping réseau HealthMonitor (éviter le 401 permanent)
**Fichier : `src/services/HealthMonitor.ts`**

Constat :
- `checkNetwork()` fait un `HEAD` sur `https://...supabase.co/rest/v1/` **sans apikey/authorization**
- Supabase répond **401**, ce qui fausse la métrique “network unstable”.

Correction recommandée :
- Remplacer le ping par un endpoint “public” ou un appel qui inclut les headers.
  - Option sûre : `GET https://...supabase.co/auth/v1/health` (si disponible)
  - Ou ping via Supabase client (qui porte déjà les headers) :
    - `await supabase.auth.getSession()` (ne teste pas la DB mais teste la connectivité)
    - ou un `select` très léger sur une table publique réellement accessible
  - Ou un Edge Function “health_check” (vous avez déjà le pattern `body.health_check === true` sur certaines functions) : ping 1 requête rapide, réponse “ok”.

✅ Résultat attendu : Health Score plus fidèle, moins de “degraded”, moins d’auto-actions inutiles.

---

## Vérifications / tests à faire après correction

1) Ouvrir `/` (web preview + mobile) :
   - Plus d’écran “Problème détecté”
   - Plus d’erreur `useNavigate() may be used only...` dans la console

2) Vérifier les notifications Job :
   - Activer le toggle (si présent)
   - Créer un job “active” (ou simuler insert en test)
   - Toast apparaît
   - Clic “Voir l’offre” ouvre `/job/:id` correctement

3) Vérifier les métriques Health (si étape 3 appliquée) :
   - Les requêtes HEAD vers `/rest/v1/` ne doivent plus échouer
   - Health status ne doit pas passer “degraded” juste à cause du ping

---

## Fichiers impactés

- **À modifier (critique)** :
  - `src/App.tsx`

- **À modifier (hardening recommandé)** :
  - `src/hooks/useJobNotifications.tsx`

- **À modifier (stabilité recommandée)** :
  - `src/services/HealthMonitor.ts`

---

## Risques & contournements

- Si l’utilisateur est bloqué en boucle même après fix (cache PWA/service worker) :
  - vider cache PWA / forcer “hard reload”
  - vérifier `UpdateNotification / AutoUpdateService` (mais la cause principale actuelle est bien `useNavigate` hors Router)

---

## Résultat attendu

- App qui démarre normalement (plus de crash loop)
- SafetyNet ne s’active plus sur `/`
- Notifications “Kwenda Job” fonctionnelles sans casser l’app
- Health monitor plus fiable (moins de fausses alertes réseau)
