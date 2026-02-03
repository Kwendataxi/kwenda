

# Plan d'Amélioration : Header Livraison Unifié et Professionnel

## Problème identifié

L'interface de livraison affiche **deux boutons de retour** empilés verticalement :

| Niveau | Composant | Header affiché | Bouton retour |
|--------|-----------|----------------|---------------|
| 1 | `Delivery.tsx` (lignes 117-140) | "Kwenda Delivery" + "Livraison express" | Oui |
| 2 | `SlideDeliveryInterface.tsx` (lignes 458-487) | Icone camion + "Livraison" + dots de progression | Oui |

Cette duplication crée une expérience utilisateur confuse et non professionnelle.

---

## Solution : Header Unique Moderne et Professionnel

### Approche

Fusionner les deux headers en un seul header unifié dans `SlideDeliveryInterface.tsx` qui combine :
- Le branding "Kwenda Delivery" 
- Le bouton retour unique
- Les indicateurs de progression (dots)

Et supprimer le header redondant de `Delivery.tsx`.

---

## Modifications Techniques

### Fichier 1 : `src/pages/Delivery.tsx`

**Supprimer le header parent** (lignes 117-140) et garder uniquement le conteneur minimal :

Changements :
- Supprimer le bloc `<header>` de la vue "create"
- Le composant `StepByStepDeliveryInterface` gère tout seul son header
- Garder uniquement la structure minimale du conteneur

### Fichier 2 : `src/components/delivery/SlideDeliveryInterface.tsx`

**Améliorer le header existant** (lignes 458-487) pour un design professionnel unifié :

Améliorations du header :
- Ajouter le logo/icone Package (colis) stylé
- Afficher "Kwenda Delivery" avec le style de marque
- Sous-titre contextuel selon l'étape ("Adresses", "Détails", "Confirmation")
- Bouton retour professionnel avec hover effect
- Progress dots alignés à droite

Design proposé :
```
[←]  [📦]  Kwenda Delivery       [•——•——○]
           Étape 1/3 · Adresses
```

Structure technique :
- Bouton retour : `w-9 h-9`, fond transparent, hover `bg-muted/50`
- Icone Package : fond `bg-primary/10`, `rounded-xl`
- Titre : "Kwenda" bold + "Delivery" en gris
- Sous-titre dynamique selon l'étape courante
- Dots de progression : alignés à droite

---

## Code attendu pour le nouveau header

Le header unifié dans `SlideDeliveryInterface.tsx` :

```tsx
<header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/10 px-4 py-3 safe-area-top">
  <div className="max-w-md mx-auto flex items-center gap-3">
    {/* Bouton retour unique */}
    <button
      onClick={currentStep === 'addresses' ? onCancel : handleBack}
      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors -ml-1"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    
    {/* Logo et titre */}
    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Package className="w-4.5 h-4.5 text-primary" />
    </div>
    
    <div className="flex-1 min-w-0">
      <h1 className="text-base font-medium tracking-tight">
        Kwenda <span className="text-muted-foreground">Delivery</span>
      </h1>
      <p className="text-[11px] text-muted-foreground/60">
        {currentStep === 'addresses' && 'Adresses'}
        {currentStep === 'details' && 'Détails & contacts'}
        {currentStep === 'confirm' && 'Confirmation'}
      </p>
    </div>

    {/* Progress dots */}
    <div className="flex gap-1.5">
      {steps.map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index <= currentStepIndex 
              ? "w-5 bg-primary" 
              : "w-1.5 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  </div>
</header>
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Delivery.tsx` | Supprimer le header redondant (lignes 117-140) |
| `src/components/delivery/SlideDeliveryInterface.tsx` | Améliorer le header existant avec branding unifié |

---

## Résultat attendu

- **Un seul bouton de retour** professionnel
- **Branding cohérent** : "Kwenda Delivery" visible
- **Sous-titre contextuel** : change selon l'étape (Adresses / Détails / Confirmation)
- **Design soft-modern** : backdrop blur, bordure subtile, espacement harmonieux
- **Dots de progression** : indication visuelle de l'avancement

---

## Cohérence avec les autres services

Ce design s'aligne avec les headers existants de :
- **KwendaFoodHeader** : logo + titre + sous-titre contextuel
- **KwendaShopHeader** : icone + "Kwenda Shop" + badge panier
- **ModernTaxiInterface** : header minimaliste avec back + titre

