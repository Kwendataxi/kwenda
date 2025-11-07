import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Shield, Users, Zap, DollarSign, Award } from 'lucide-react';

interface BiddingExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
}

export const BiddingExplanationDialog = ({
  open,
  onOpenChange,
  onActivate
}: BiddingExplanationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            🎯 Mode Enchères
            <Badge variant="secondary" className="ml-2">Nouveau</Badge>
          </DialogTitle>
          <DialogDescription>
            Laissez les chauffeurs vous proposer le meilleur prix !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avantages Client */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Pour vous (Client)
            </h3>
            
            <div className="grid gap-3">
              <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <TrendingDown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Économisez jusqu'à 50%</p>
                  <p className="text-sm text-muted-foreground">
                    Les chauffeurs peuvent proposer des prix plus bas que le tarif estimé
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Transparence totale</p>
                  <p className="text-sm text-muted-foreground">
                    Comparez les offres des chauffeurs et choisissez librement
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Meilleur service</p>
                  <p className="text-sm text-muted-foreground">
                    Les chauffeurs sont motivés pour offrir un excellent service
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Vous décidez du prix final</p>
                  <p className="text-sm text-muted-foreground">
                    Acceptez l'offre qui correspond à votre budget
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Avantages Chauffeur */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Pour les chauffeurs
            </h3>
            
            <div className="grid gap-3">
              <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <Zap className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pas d'assignation forcée</p>
                  <p className="text-sm text-muted-foreground">
                    Les chauffeurs choisissent les courses qu'ils veulent faire
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <DollarSign className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Flexibilité tarifaire</p>
                  <p className="text-sm text-muted-foreground">
                    Proposez un prix adapté à la distance et conditions
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <Award className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Compétition équitable</p>
                  <p className="text-sm text-muted-foreground">
                    Tous les chauffeurs proches voient la demande en même temps
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comment ça marche */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold">⏱️ Comment ça marche ?</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                <span>Activez le mode enchères et lancez votre recherche</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                <span>Les chauffeurs proches (15km) reçoivent une notification</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                <span>Vous recevez leurs offres en temps réel pendant 5 minutes</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">4.</span>
                <span>Choisissez la meilleure offre et confirmez</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">5.</span>
                <span>Le chauffeur est notifié et vient vous chercher !</span>
              </li>
            </ol>
          </div>

          {/* Limites de prix */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <p className="text-sm">
              <span className="font-semibold">ℹ️ Bon à savoir :</span> Les offres sont limitées entre 50% et 150% du tarif estimé pour garantir des prix équitables.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          <Button onClick={onActivate} className="gap-2">
            🎯 Activer le mode enchères
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
