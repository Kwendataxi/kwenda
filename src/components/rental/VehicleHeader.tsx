import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VehicleHeaderProps {
  vehicleName: string;
}

export const VehicleHeader: React.FC<VehicleHeaderProps> = ({ vehicleName }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vehicleName,
          text: `Découvrez ${vehicleName} sur Kwenda`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papier",
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite 
        ? "Ce véhicule a été retiré de vos favoris" 
        : "Ce véhicule a été ajouté à vos favoris",
    });
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 shrink-0"
          onClick={() => navigate('/rental')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-1">
            {vehicleName}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={handleFavorite}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
