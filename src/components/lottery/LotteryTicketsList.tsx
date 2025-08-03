import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LotteryTicketsListProps {
  tickets: Array<{
    id: string;
    ticket_number: string;
    source_type: string;
    source_id?: string;
    earned_date: string;
    status: string;
    multiplier: number;
    expires_at?: string;
  }>;
}

export const LotteryTicketsList = ({ tickets }: LotteryTicketsListProps) => {
  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'transport': return { label: '🚗 Course', color: 'bg-blue-500' };
      case 'delivery': return { label: '📦 Livraison', color: 'bg-green-500' };
      case 'marketplace_buy': return { label: '🛒 Achat', color: 'bg-purple-500' };
      case 'marketplace_sell': return { label: '💰 Vente', color: 'bg-yellow-500' };
      case 'referral': return { label: '👥 Parrainage', color: 'bg-pink-500' };
      case 'daily_login': return { label: '📱 Connexion', color: 'bg-indigo-500' };
      case 'challenge': return { label: '🎯 Défi', color: 'bg-orange-500' };
      default: return { label: '❓ Autre', color: 'bg-gray-500' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'used': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'expired': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'used': return 'Utilisé';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const availableTickets = tickets.filter(t => t.status === 'available');
  const usedTickets = tickets.filter(t => t.status === 'used');
  const expiredTickets = tickets.filter(t => t.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-700">{availableTickets.length}</p>
                <p className="text-sm text-green-600">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-lg font-bold text-gray-700">{usedTickets.length}</p>
                <p className="text-sm text-gray-600">Utilisés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-700">{expiredTickets.length}</p>
                <p className="text-sm text-red-600">Expirés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun ticket pour le moment</h3>
            <p className="text-muted-foreground">
              Utilisez l'application pour gagner vos premiers tickets de tombola !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const sourceInfo = getSourceTypeLabel(ticket.source_type);
            return (
              <Card key={ticket.id} className={`transition-colors ${
                ticket.status === 'available' ? 'bg-green-50/50 border-green-200' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <div>
                          <p className="font-mono text-sm font-semibold">
                            {ticket.ticket_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.earned_date), 'PPP à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className={`${sourceInfo.color} text-white border-0 text-xs`}
                      >
                        {sourceInfo.label}
                      </Badge>
                      
                      {ticket.multiplier > 1 && (
                        <Badge variant="outline" className="text-xs">
                          x{ticket.multiplier}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={ticket.status === 'available' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      {ticket.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expire le {format(new Date(ticket.expires_at), 'PP', { locale: fr })}
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