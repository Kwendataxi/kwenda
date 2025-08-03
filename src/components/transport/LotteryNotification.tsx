import { useEffect, useState } from 'react';
import { Ticket, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LotteryNotificationProps {
  show: boolean;
  ticketCount: number;
  sourceType: string;
  multiplier?: number;
  onClose: () => void;
  onViewLottery?: () => void;
}

export const LotteryNotification = ({ 
  show, 
  ticketCount, 
  sourceType, 
  multiplier = 1,
  onClose,
  onViewLottery 
}: LotteryNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-close après 5 secondes
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Attendre la fin de l'animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const getSourceLabel = (type: string) => {
    switch (type) {
      case 'transport': return '🚗 Course terminée';
      case 'delivery': return '📦 Livraison réussie';
      case 'marketplace_buy': return '🛒 Achat effectué';
      case 'marketplace_sell': return '💰 Vente réalisée';
      case 'referral': return '👥 Parrainage';
      case 'daily_login': return '📱 Connexion quotidienne';
      case 'challenge': return '🎯 Défi accompli';
      case 'rating': return '⭐ Évaluation 5 étoiles';
      default: return '🎫 Action récompensée';
    }
  };

  if (!show && !isVisible) return null;

  return (
    <div className={`
      fixed top-4 left-4 right-4 z-50 transition-all duration-300 
      ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
    `}>
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animation de ticket */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative bg-gradient-to-br from-primary to-primary-glow p-3 rounded-full">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    🎉 Tickets de tombola gagnés !
                  </h3>
                  {multiplier > 1 && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      x{multiplier} BONUS
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getSourceLabel(sourceType)} • <span className="font-medium text-primary">+{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onViewLottery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewLottery}
                  className="text-xs"
                >
                  Voir tombola
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};