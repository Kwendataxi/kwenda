import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trophy, Gift, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLottery } from '@/hooks/useLottery';
import { useToast } from '@/hooks/use-toast';

interface LotteryWinsListProps {
  wins: Array<{
    id: string;
    draw_id: string;
    prize_details: any;
    prize_value: number;
    currency: string;
    status: string;
    claimed_at?: string;
    expires_at?: string;
  }>;
}

export const LotteryWinsList = ({ wins }: LotteryWinsListProps) => {
  const { claimWin } = useLottery();
  const { toast } = useToast();

  const handleClaimWin = async (winId: string) => {
    try {
      await claimWin(winId);
      toast({
        title: "Gain réclamé !",
        description: "Votre gain a été ajouté à votre compte",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réclamer le gain",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'claimed': return 'bg-green-500';
      case 'credited': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'À réclamer';
      case 'claimed': return 'Réclamé';
      case 'credited': return 'Crédité';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const getPrizeIcon = (prizeType: string) => {
    if (prizeType?.includes('Crédit') || prizeType?.includes('cash')) {
      return '💰';
    } else if (prizeType?.includes('Course') || prizeType?.includes('Livraison')) {
      return '🚗';
    } else if (prizeType?.includes('Tickets')) {
      return '🎫';
    }
    return '🎁';
  };

  return (
    <div className="space-y-4">
      {wins.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun gain pour le moment</h3>
            <p className="text-muted-foreground">
              Participez aux tirages pour avoir une chance de gagner !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {wins.map((win) => {
            const prizeName = win.prize_details?.name || win.prize_details?.prize_name || 'Prix mystère';
            const canClaim = win.status === 'pending' && (!win.expires_at || new Date(win.expires_at) > new Date());
            
            return (
              <Card 
                key={win.id} 
                className={`transition-colors ${
                  win.status === 'pending' ? 'bg-yellow-50/50 border-yellow-200' : 
                  win.status === 'claimed' || win.status === 'credited' ? 'bg-green-50/50 border-green-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getPrizeIcon(prizeName)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{prizeName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Valeur: {win.prize_value.toLocaleString()} {win.currency}
                        </p>
                        {win.claimed_at && (
                          <p className="text-xs text-muted-foreground">
                            Réclamé le {format(new Date(win.claimed_at), 'PPP', { locale: fr })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`${getStatusColor(win.status)} text-white border-0`}
                      >
                        {getStatusLabel(win.status)}
                      </Badge>
                      
                      {canClaim && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimWin(win.id)}
                          className="text-xs"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          Réclamer
                        </Button>
                      )}
                      
                      {win.expires_at && win.status === 'pending' && (
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Expire le {format(new Date(win.expires_at), 'PP', { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};