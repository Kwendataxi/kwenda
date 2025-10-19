import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModernVendorProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    main_image_url?: string;
    stock_quantity?: number;
    moderation_status: string;
    rejection_reason?: string;
  };
}

export const ModernVendorProductCard = ({ product }: ModernVendorProductCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const isPending = product.moderation_status === 'pending';
    const isApproved = product.moderation_status === 'approved' || product.moderation_status === 'active';
    const isRejected = product.moderation_status === 'rejected';

    if (isPending) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    }

    if (isApproved) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actif
        </Badge>
      );
    }

    if (isRejected) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeté
        </Badge>
      );
    }

    return null;
  };

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 bg-muted/50">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Badge statut en overlay */}
        <div className="absolute top-4 left-4">
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Contenu */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-2 mb-2">{product.title}</h3>
          
          {/* Prix en rouge vif */}
          <p className="text-2xl font-bold text-destructive">
            {product.price.toLocaleString()} FC
          </p>
        </div>
        
        {/* Stock */}
        <p className="text-sm text-muted-foreground">
          Stock: {product.stock_quantity || 0}
        </p>

        {/* Raison de rejet si applicable */}
        {product.moderation_status === 'rejected' && product.rejection_reason && (
          <div className="p-2 bg-destructive/10 rounded-md text-xs text-destructive">
            <strong>Raison:</strong> {product.rejection_reason}
          </div>
        )}
        
        {/* Bouton Modifier */}
        <Button 
          variant="default" 
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          onClick={() => navigate(`/vendeur/modifier-produit/${product.id}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </CardContent>
    </Card>
  );
};
