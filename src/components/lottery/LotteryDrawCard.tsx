import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Users, Gift, Ticket, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLottery } from '@/hooks/useLottery';
import { useToast } from '@/hooks/use-toast';

interface LotteryDrawCardProps {
  draw: {
    id: string;
    name: string;
    draw_type: string;
    scheduled_date: string;
    status: string;
    min_tickets_required: number;
    max_winners: number;
    total_participants: number;
    prize_pool: any[];
  };
}

export const LotteryDrawCard = ({ draw }: LotteryDrawCardProps) => {
  const { availableTickets, enterDraw } = useLottery();
  const { toast } = useToast();
  const [isEntering, setIsEntering] = useState(false);
  const [ticketsToUse, setTicketsToUse] = useState(draw.min_tickets_required);
  const [showDialog, setShowDialog] = useState(false);

  const handleEnterDraw = async () => {
    if (ticketsToUse < draw.min_tickets_required) {
      toast({
        title: "Erreur",
        description: `Minimum ${draw.min_tickets_required} tickets requis`,
        variant: "destructive"
      });
      return;
    }

    if (ticketsToUse > availableTickets) {
      toast({
        title: "Erreur", 
        description: "Pas assez de tickets disponibles",
        variant: "destructive"
      });
      return;
    }

    setIsEntering(true);
    try {
      await enterDraw(draw.id, ticketsToUse);
      toast({
        title: "Participation confirmée !",
        description: `Vous participez au tirage avec ${ticketsToUse} tickets`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de participer au tirage",
        variant: "destructive"
      });
    } finally {
      setIsEntering(false);
    }
  };

  const getDrawTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-primary';
      case 'weekly': return 'bg-secondary';
      case 'monthly': return 'bg-accent';
      case 'special': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-muted';
    }
  };

  const getDrawTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '⚡';
      case 'weekly': return '🌟';
      case 'monthly': return '💎';
      case 'special': return '🎉';
      default: return '🎲';
    }
  };

  const isDrawSoon = new Date(draw.scheduled_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canParticipate = availableTickets >= draw.min_tickets_required && draw.status === 'scheduled';

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isDrawSoon ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent' : ''
    }`}>
      {isDrawSoon && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-medium rounded-bl-lg">
          Bientôt !
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getDrawTypeIcon(draw.draw_type)}</span>
            <div>
              <CardTitle className="text-lg">{draw.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(draw.scheduled_date), { locale: fr, addSuffix: true })}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getDrawTypeColor(draw.draw_type)} text-white border-0`}
          >
            {draw.draw_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations du tirage */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{draw.total_participants} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span>{draw.max_winners} gagnants max</span>
          </div>
        </div>

        {/* Pool de prix */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Prix à gagner
          </h4>
          <div className="space-y-1">
            {draw.prize_pool.slice(0, 3).map((prize, index) => (
              <div key={index} className="flex justify-between text-xs bg-muted/50 p-2 rounded">
                <span>{prize.prize_name}</span>
                <span className="text-muted-foreground">x{prize.quantity}</span>
              </div>
            ))}
            {draw.prize_pool.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{draw.prize_pool.length - 3} autres prix...
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          {canParticipate ? (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <Ticket className="h-4 w-4 mr-2" />
                  Participer ({draw.min_tickets_required} tickets min)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Participer au tirage</DialogTitle>
                  <DialogDescription>
                    {draw.name} - {format(new Date(draw.scheduled_date), 'PPP à HH:mm', { locale: fr })}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tickets">Nombre de tickets à utiliser</Label>
                    <Input
                      id="tickets"
                      type="number"
                      min={draw.min_tickets_required}
                      max={Math.min(availableTickets, 50)}
                      value={ticketsToUse}
                      onChange={(e) => setTicketsToUse(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Plus de tickets = plus de chances de gagner !
                      <br />
                      Disponibles: {availableTickets} tickets
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleEnterDraw}
                      disabled={isEntering || ticketsToUse > availableTickets}
                      className="flex-1"
                    >
                      {isEntering ? 'Participation...' : `Participer avec ${ticketsToUse} tickets`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled className="w-full">
              {availableTickets < draw.min_tickets_required 
                ? `${draw.min_tickets_required - availableTickets} tickets manquants`
                : 'Tirage terminé'
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};