import { useState, useEffect } from 'react';
import { Ticket, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLottery } from '@/hooks/useLottery';

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
      const timer = setTimeout(() => setAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
    setLastTicketCount(availableTickets);
  }, [availableTickets, lastTicketCount]);

  // Nombre de gains non réclamés
  const unclaimedWins = myWins.filter(win => win.status === 'pending').length;

  if (loading) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <Button
        onClick={onOpenLottery}
        size="lg"
        className={`
          relative h-14 px-4 bg-gradient-to-r from-purple-500 to-pink-500 
          hover:from-purple-600 hover:to-pink-600 text-white shadow-xl
          transition-all duration-300 hover:scale-105 rounded-2xl
          ${animate ? 'animate-bounce' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Ticket className="h-6 w-6" />
            {animate && (
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
            )}
          </div>
          
          <div className="text-left">
            <div className="text-sm font-bold">Tombola</div>
            <div className="text-xs opacity-90">
              {availableTickets} ticket{availableTickets !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Badge pour nouveaux tickets */}
        {animate && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 animate-pulse"
          >
            Nouveau!
          </Badge>
        )}

        {/* Badge pour gains non réclamés */}
        {unclaimedWins > 0 && (
          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold animate-pulse">
            <Gift className="h-3 w-3 mr-1" />
            {unclaimedWins}
          </div>
        )}

        {/* Effet de lueur */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10" />
      </Button>
    </div>
  );
};