import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Facebook, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorShopShareButtonsProps {
  vendorId: string;
  vendorName: string;
  productCount: number;
  rating?: number;
}

export const VendorShopShareButtons: React.FC<VendorShopShareButtonsProps> = ({
  vendorId,
  vendorName,
  productCount,
  rating = 0
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const shopUrl = `${window.location.origin}/marketplace/shop/${vendorId}`;
  
  const shareMessage = `🏪 Découvre ma boutique sur Kwenda Marketplace !\n\n📍 ${vendorName}\n🛍️ ${productCount} produits disponibles\n⭐ Note ${rating.toFixed(1)}/5\n📍 Kinshasa, RDC\n\nVisite ma boutique : ${shopUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}&quote=${encodeURIComponent(`Boutique ${vendorName} sur Kwenda Marketplace`)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast({
        title: 'Lien copié !',
        description: 'Le lien de votre boutique a été copié.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier le lien.'
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boutique ${vendorName}`,
          text: shareMessage,
          url: shopUrl
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Partager ma boutique</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleWhatsAppShare}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          className="gap-2"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copié !' : 'Copier lien'}
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>
    </div>
  );
};
