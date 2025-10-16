import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const BANNER_DISMISSED_KEY = 'kwenda-install-banner-dismissed';
const BANNER_DISMISS_DAYS = 7;

export const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, isInstalled, install } = useInstallPrompt();

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (isInstalled) return;

    // Vérifier si le banner a été fermé récemment
    const dismissedUntil = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        return;
      }
    }

    // Afficher après 3 secondes
    const timer = setTimeout(() => {
      if (canInstall) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Enregistrer la fermeture pour 7 jours
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + BANNER_DISMISS_DAYS);
    localStorage.setItem(BANNER_DISMISSED_KEY, dismissUntil.toISOString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500 p-4">
      <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-2xl">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base">
                Installer Kwenda Taxi
              </p>
              <p className="text-xs sm:text-sm text-white/90">
                Accès rapide depuis votre écran d'accueil
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={handleInstall}
            >
              Installer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
