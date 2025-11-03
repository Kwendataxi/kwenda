import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'kwenda-top-banner-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

export const AppDownloadTopBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, isStandalone, platform, install } = useInstallPrompt();

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Vérifier si le banner a été fermé récemment
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt);
      if (elapsed < DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    // Afficher le banner
    setIsVisible(true);
  }, [isStandalone]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      // Pour iOS, scroll vers les instructions ou afficher un dialog
      alert('📱 Sur iPhone:\n1. Appuyez sur le bouton Partager\n2. Sélectionnez "Sur l\'écran d\'accueil"\n3. Appuyez sur "Ajouter"');
    } else if (canInstall) {
      const success = await install();
      if (success) {
        setIsVisible(false);
      }
    } else {
      // Fallback pour navigateurs non supportés
      window.open('https://kwenda.app/install', '_blank');
    }
  };

  const getMessage = () => {
    switch (platform) {
      case 'ios':
        return {
          title: '📱 Installez Kwenda sur votre iPhone',
          subtitle: 'Accès rapide depuis votre écran d\'accueil',
        };
      case 'android':
        return {
          title: '📱 Installez l\'application Kwenda',
          subtitle: 'Transport • Livraison • Marketplace',
        };
      default:
        return {
          title: '💻 Téléchargez Kwenda Desktop',
          subtitle: 'Disponible sur Windows, Mac et Linux',
        };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-black/95 via-primary/90 to-black/95 backdrop-blur-lg border-b border-white/10 shadow-2xl"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 py-3 md:py-4">
              {/* Icône animée */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-600 shadow-lg"
              >
                <Smartphone className="w-5 h-5 text-white" />
              </motion.div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-white truncate">
                  {message.title}
                </h3>
                <p className="text-xs text-gray-300 truncate">
                  {message.subtitle}
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleInstall}
                size="sm"
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-red-600 hover:from-red-600 hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Télécharger</span>
                </motion.div>
              </Button>

              {/* Bouton fermer */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
