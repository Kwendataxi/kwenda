import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, MessageCircle, Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface SellerInfoCardProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  totalSales: number;
  productCount?: number;
  responseRate?: number;
}

export const SellerInfoCard: React.FC<SellerInfoCardProps> = ({
  sellerId,
  sellerName,
  sellerAvatar,
  sellerRating,
  totalSales,
  productCount = 0,
  responseRate = 95
}) => {
  const navigate = useNavigate();

  const handleVisitShop = () => {
    navigate(`/marketplace/vendor/${sellerId}/shop`);
  };

  const handleStartChat = () => {
    toast.info('Chat avec le vendeur à venir');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Store className="h-5 w-5" />
          Informations vendeur
        </h3>
        
        {/* Profil vendeur cliquable */}
        <div 
          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={handleVisitShop}
        >
          <img 
            src={sellerAvatar || '/placeholder.svg'}
            alt={sellerName}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-background shadow-md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold line-clamp-1">{sellerName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {sellerRating.toFixed(1)}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
        
        {/* Stats vendeur */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/20 rounded">
            <p className="text-xs text-muted-foreground">Produits</p>
            <p className="text-lg font-bold">{productCount}</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded">
            <p className="text-xs text-muted-foreground">Ventes</p>
            <p className="text-lg font-bold">{totalSales}</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded">
            <p className="text-xs text-muted-foreground whitespace-nowrap">Taux réponse</p>
            <p className="text-lg font-bold text-green-600">{responseRate}%</p>
          </div>
        </div>
        
        {/* Bouton chat */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleStartChat}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contacter le vendeur
        </Button>
      </CardContent>
    </Card>
  );
};
