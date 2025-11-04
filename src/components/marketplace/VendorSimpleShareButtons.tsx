import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVendorShopUrl } from '@/config/appUrl';

interface VendorSimpleShareButtonsProps {
  vendorId: string;
  vendorName: string;
  productCount: number;
  rating?: number;
}

export const VendorSimpleShareButtons: React.FC<VendorSimpleShareButtonsProps> = ({
  vendorId,
  vendorName,
  productCount,
  rating = 0
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const shopUrl = getVendorShopUrl(vendorId);
  
  // Message enrichi avec emojis
  const shareMessage = `🏪 Découvre ma boutique sur Kwenda Shop !\n\n📍 ${vendorName}\n🛍️ ${productCount} produits disponibles\n⭐ Note ${rating.toFixed(1)}/5\n📍 Kinshasa, RDC\n\n👉 ${shopUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shopUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast({
        title: '✅ Lien copié !',
        description: 'Le lien de votre boutique a été copié.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: 'Impossible de copier le lien.'
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-sm">Partager ma boutique</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choisis comment partager ton lien
        </p>
      </div>
      
      {/* Options de partage (grid 1 colonne) */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-start gap-3 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300"
          onClick={handleWhatsAppShare}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Partager sur WhatsApp</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-start gap-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300"
          onClick={handleTelegram}
        >
          <Send className="h-5 w-5" />
          <span className="font-medium">Partager sur Telegram</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-start gap-3"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
          <span className="font-medium">
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </span>
        </Button>
      </div>
      
      {/* Info lien */}
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground text-center break-all">
          {shopUrl}
        </p>
      </div>
    </div>
  );
};
