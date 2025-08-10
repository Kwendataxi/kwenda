import { useState, useEffect } from 'react';
import { Ticket, Gift, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLottery } from '@/hooks/useLottery';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface LotteryTicketFloaterProps {
  onOpenLottery: () => void;
}

export const LotteryTicketFloater = ({ onOpenLottery }: LotteryTicketFloaterProps) => {
  const { availableTickets, myWins, loading } = useLottery();
  const [animate, setAnimate] = useState(false);
  const [lastTicketCount, setLastTicketCount] = useState(0);

  // Animation quand nouveaux tickets
  useEffect(() => {
    if (availableTickets > lastTicketCount && lastTicketCount > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), NOTIFICATION_CONFIG.LOTTERY_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
    setLastTicketCount(availableTickets);
  }, [availableTickets, lastTicketCount]);

  // Nombre de gains non réclamés
  const unclaimedWins = myWins.filter(win => win.status === 'pending').length;

  if (loading) return null;

  // Ne pas afficher si pas de tickets et pas de gains
  if (availableTickets === 0 && unclaimedWins === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        onClick={onOpenLottery}
        className={`
          relative cursor-pointer group
          h-8 px-3 rounded-full
          backdrop-blur-xl bg-gradient-to-r from-primary/20 to-accent/20
          border border-white/20 shadow-lg
          transition-all duration-500 ease-out
          hover:scale-110 hover:shadow-xl hover:shadow-primary/25
          ${animate ? 'animate-pulse' : availableTickets > 0 ? 'animate-pulse-glow' : ''}
          ${availableTickets === 0 ? 'opacity-60' : 'opacity-95'}
        `}
      >
        {/* Contenu principal */}
        <div className="flex items-center gap-2 h-full">
          <div className="relative">
            <Ticket className="h-3.5 w-3.5 text-primary-foreground" />
            
            {/* Animation burst pour nouveaux tickets */}
            {animate && (
              <>
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse opacity-30" />
              </>
            )}
          </div>
          
          <span className="text-xs font-bold text-primary-foreground leading-none">
            {availableTickets}
          </span>
        </div>

        {/* Badge gains non réclamés - position optimisée */}
        {unclaimedWins > 0 && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center">
            <Gift className="h-2 w-2" />
          </div>
        )}

        {/* Effet glassmorphism glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 blur-sm -z-10 group-hover:blur-md transition-all duration-300" />
        
        {/* Particle effect sur hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Sparkles className="h-2 w-2 text-yellow-400 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
};