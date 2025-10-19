import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useLocation } from "react-router-dom";

const BANNER_DISMISSED_KEY = 'kwenda-install-banner-dismissed';
const BANNER_DISMISS_DAYS = 7;

export const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const location = useLocation();

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (isInstalled) return;

    // Afficher uniquement sur la landing page "/"
    if (location.pathname !== '/') return;

    // Vérifier si le banner a été fermé récemment
    const dismissedUntil = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        return;
      }
    }

    // Afficher après 3 secondes pour ne pas être intrusif
    const timer = setTimeout(() => {
      if (canInstall) {
        setShouldShow(true);
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, location.pathname]);

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

  if (!isVisible || !shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <Card className="shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-gray-900 dark:to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">
                📱 Installez l'application Kwenda
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Accédez plus rapidement à vos services VTC, livraison et marketplace
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstall} 
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Installer
                </Button>
                <Button 
                  onClick={handleDismiss} 
                  size="sm" 
                  variant="ghost"
                >
                  Plus tard
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleDismiss}
              size="icon"
              variant="ghost"
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
