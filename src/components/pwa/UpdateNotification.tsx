import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rocket, Download, Clock, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export const UpdateNotification = () => {
  const { shouldShowPrompt, updateInfo, installUpdate, dismissUpdate } = useAppUpdate();

  if (!shouldShowPrompt || !updateInfo) return null;

  const isCritical = updateInfo.severity === 'critical';

  return (
    <Dialog open={shouldShowPrompt} onOpenChange={(open) => !open && !isCritical && dismissUpdate()}>
      <DialogContent className="sm:max-w-md">{!isCritical && (
        <button
          onClick={() => dismissUpdate()}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          ✕
        </button>
      )}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Rocket className="w-8 h-8 text-primary" />
            </motion.div>
            <DialogTitle className="text-xl">
              {isCritical ? '⚠️ Mise à jour critique' : 'Nouvelle version disponible !'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isCritical 
              ? "Une mise à jour de sécurité importante doit être installée pour continuer à utiliser Kwenda."
              : `Kwenda ${updateInfo.version} est prête à être installée avec de nouvelles fonctionnalités et corrections.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Informations sur la mise à jour */}
          <div className="grid grid-cols-2 gap-2">
            {updateInfo.cacheSize && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">Taille</div>
                  <div className="font-medium">{updateInfo.cacheSize}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="text-muted-foreground text-xs">Temps estimé</div>
                <div className="font-medium">&lt; 10s</div>
              </div>
            </div>
          </div>

          {/* Changelog si disponible */}
          {updateInfo.changelog && updateInfo.changelog.length > 0 && (
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Nouveautés :</div>
                <ul className="text-sm space-y-1">
                  {updateInfo.changelog.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isCritical && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                Cette mise à jour corrige des problèmes de sécurité importants. 
                Elle sera installée automatiquement dans quelques secondes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          {!isCritical && (
            <Button
              variant="outline"
              onClick={() => dismissUpdate(24)}
              className="flex-1"
            >
              Plus tard
            </Button>
          )}
          <Button
            onClick={installUpdate}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              Mettre à jour
            </motion.div>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
