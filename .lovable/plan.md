
Contexte et diagnostic (pas à pas)
1) Ce qui casse exactement
- Sur /delivery, les champs “Adresse de collecte / livraison” utilisent `AutocompleteLocationInput`.
- `AutocompleteLocationInput` s’appuie sur le hook `useGooglePlacesAutocomplete`.
- `useGooglePlacesAutocomplete` appelle les Edge Functions :
  - `google-places-autocomplete` (pour les suggestions)
  - `google-place-details` (pour récupérer les coordonnées d’un lieu sélectionné)

2) Pourquoi Taxi “fonctionne” alors que Livraison “ne fonctionne pas”
- Le Taxi affiche la carte et calcule la route via l’API JavaScript Google Maps chargée dans le navigateur (via `googleMapsLoader`). Cette API JS fonctionne avec une clé restreinte par domaine (HTTP referrer), car le navigateur envoie un referrer.
- La Livraison, elle, fait l’autocomplete via Edge Function (côté serveur). Dans un Edge Runtime, il n’y a pas de referrer. Or vos logs Edge montrent clairement :
  - `REQUEST_DENIED API keys with referer restrictions cannot be used with this API.`
- Donc : la clé “Taxi” (clé web / referrer) ne peut pas marcher côté Edge Function. C’est normal.

3) Confirmation par les logs
- Logs `google-places-autocomplete` : `REQUEST_DENIED … referer restrictions …` (confirmé).
- Le secret `GOOGLE_MAPS_API_KEY` est bien présent, mais configuré comme une clé “web” (referrer restricted), ce qui est incompatible avec les appels Google Places Web Service depuis une Edge Function.

Objectif
A) Rendre la recherche d’adresses Livraison 100% fonctionnelle immédiatement en réutilisant la même clé/l’approche que le Taxi (API JS navigateur).
B) Garder une architecture pro : fallback robuste, pas de crash UI, et possibilité de réactiver les Edge Functions si vous configurez une vraie clé serveur plus tard.
C) Préparer un suivi colis “pro” (fiable côté carte) en s’assurant que la brique “adresse → coordonnées” est stable.

Solution proposée (2 niveaux, optimal et robuste)

Niveau 1 — Fix immédiat (recommandé) : fallback automatique vers Google Maps JS (même clé que Taxi)
Idée : si l’Edge Function renvoie `REQUEST_DENIED` / 500, on bascule automatiquement sur l’API Places du navigateur :
- `google.maps.places.AutocompleteService` pour les suggestions
- `google.maps.places.PlacesService` pour les détails (coords, adresse formatée)
Cette approche utilise la clé chargée via `googleMapsLoader` (donc “la clé du taxi”), et évite complètement le problème des restrictions serveur.

Implémentation (fichiers et étapes)
1) Modifier `src/hooks/useGooglePlacesAutocomplete.ts`
   - Ajouter un mode “provider” : `edge` (par défaut) -> si échec “clé referrer” alors `client_js`.
   - Détection d’échec :
     - si `supabaseError` contient 500 + message “REQUEST_DENIED”
     - ou si la réponse `data.error` contient “Google API: REQUEST_DENIED”
     - ou si les logs/texte contiennent “referer restrictions”
     => activer un flag `forceClientProvider = true` (stocké en `useRef` ou `useState`, mais stable sur la session).
   - Ajouter une fonction interne `ensurePlacesJsReady()` :
     - `await googleMapsLoader.load(['places'])`
     - Vérifier `window.google?.maps?.places`
   - Implémenter `searchWithClientJs(input)` :
     - Créer/maintenir `AutocompleteService` (via `useRef`)
     - Construire la requête avec :
       - `input`
       - `locationBias` (lat/lng existant déjà dans le hook)
       - `radius`
       - `types` (si compatibles)
       - `componentRestrictions: { country: ['cd', 'ci'] }` (cohérent avec l’edge function)
       - `language: 'fr'`
       - `sessionToken` : utiliser `new google.maps.places.AutocompleteSessionToken()`
     - Mapper les résultats vers votre format `AutocompletePrediction` (placeId, description, structuredFormatting, etc.)
   - Implémenter `getPlaceDetailsWithClientJs(placeId)` :
     - Créer une `PlacesService` avec un div “dummy” (pas besoin d’une map affichée)
     - `getDetails({ placeId, fields: ['geometry','formatted_address','name','types','place_id'], sessionToken })`
     - Retourner votre `PlaceDetails` interne (id, placeId, name, address, coordinates, types)
   - Maintenir le debounce + abort logic :
     - Le debounce reste identique.
     - L’“abort” côté JS n’existe pas de la même façon : on gère en ignorant les retours si un `requestId` local a changé (pattern “latest request wins”), pour éviter des “résultats fantômes”.

2) (Optionnel mais conseillé) Ajuster `src/components/location/AutocompleteLocationInput.tsx`
   - Améliorer l’expérience quand on bascule en fallback :
     - Si on détecte la bascule vers JS, afficher un micro-indicateur discret (sans alerter l’utilisateur) ou juste continuer silencieusement.
   - S’assurer que les messages d’erreur ne bloquent pas l’UI :
     - éviter les erreurs “brutes” venant de Google, garder : “Recherche indisponible, utilisez le GPS ou un lieu populaire”.

Résultat attendu du Niveau 1
- Sur /delivery, la saisie d’adresse affiche immédiatement des suggestions (même clé et même comportement que Taxi).
- Le choix d’une suggestion renvoie des coordonnées valides, donc la commande peut continuer.
- Plus de 500 bloquants côté UX, même si l’Edge Function reste en erreur.

Niveau 2 — Fix “infrastructure” (recommandé pour le long terme) : une vraie clé serveur pour Edge Functions
Même si le fallback JS règle le problème utilisateur, il est préférable d’avoir une clé serveur pour :
- Edge Functions Places (autocomplete + details)
- éventuellement d’autres appels Google Web Service (directions/distancematrix/geocode côté serveur) si vous en avez besoin ailleurs

Ce qu’il faudra faire côté Google Cloud Console (action user)
1) Créer une nouvelle clé “Server” (ou “Unrestricted application restrictions”)
2) Application restrictions : None (pas de HTTP referrer)
3) API restrictions : limiter strictement à (minimum) :
   - Places API
   - Geocoding API (si nécessaire)
   - Directions API / Distance Matrix API (si nécessaire)
4) Activer la facturation Google (Places nécessite souvent billing)
5) Mettre cette clé dans Supabase Secrets en remplacement de `GOOGLE_MAPS_API_KEY` ou dans un nouveau secret dédié (ex: `GOOGLE_MAPS_SERVER_API_KEY`)

Amélioration code (si on choisit un nouveau secret dédié)
- Mettre à jour :
  - `supabase/functions/google-places-autocomplete/index.ts`
  - `supabase/functions/google-place-details/index.ts`
  pour lire d’abord `GOOGLE_MAPS_SERVER_API_KEY`, sinon fallback `GOOGLE_MAPS_API_KEY`.
Ainsi, vous pourrez garder une clé “web” pour le front (si besoin) et une clé “server” pour les edge functions.

Tests de validation (end-to-end)
1) /delivery
- Taper “Ici” / “Gombe” / “Cocody” selon la ville : les suggestions doivent apparaître.
- Sélectionner une suggestion : vérifier que `lat/lng` sont définis (pas 0,0).
- Continuer vers “Détails” puis “Confirmation” sans crash.

2) /transport (taxi)
- Vérifier qu’il n’y a aucune régression sur la carte + calcul de route + sélection adresses.

3) Mode dégradé
- Couper internet : l’input doit afficher “lieux populaires” / “recherches récentes” et le bouton GPS doit rester utilisable.

Livraison “suivi colis pro” (ce que ce fix débloque)
- Une fois l’autocomplete fiable, vos écrans de tracking (ex: `DeliveryLiveTracker`, `DeliveryTrackingPage`, `DeliveryMapPreview`) deviennent stables car les commandes auront des coordonnées correctes dès la création.
- Après ce correctif, on pourra optimiser le tracking “pro” (realtime, états, carte, ETA) sans être bloqué par “adresse introuvable”.

Fichiers concernés (résumé)
- Principal (fix immédiat) :
  - `src/hooks/useGooglePlacesAutocomplete.ts`
  - (optionnel UX) `src/components/location/AutocompleteLocationInput.tsx`
- Optionnel (fix infra long terme) :
  - `supabase/functions/google-places-autocomplete/index.ts`
  - `supabase/functions/google-place-details/index.ts`

Risques / points d’attention
- L’API JS Places nécessite que la librairie `places` soit chargée : on la charge via `googleMapsLoader.load(['places'])` dans le hook fallback.
- Les “types” ne sont pas tous supportés de la même manière entre Web Service et JS SDK : on gardera une stratégie conservative (types vides ou “establishment/geocode”) si besoin.
- Sur mobile Capacitor, l’approche JS fonctionne tant que la clé est autorisée pour votre domaine/app (comme pour Taxi).

Livrable final attendu
- Livraison : champ adresse totalement fonctionnel, moderne, sans crash.
- Un comportement “pro” : fallback automatique, stable, silencieux, avec alternative GPS et lieux populaires.
