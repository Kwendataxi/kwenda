import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Facebook, Copy, Check, Mail, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRestaurantUrl } from '@/config/appUrl';

interface RestaurantShareButtonsProps {
  restaurantId: string;
  restaurantName: string;
  menuCount: number;
  rating?: number;
  city: string;
  cuisineType?: string;
}

export const RestaurantShareButtons: React.FC<RestaurantShareButtonsProps> = ({
  restaurantId,
  restaurantName,
  menuCount,
  rating = 0,
  city,
  cuisineType
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [messageCopied, setMessageCopied] = React.useState(false);

  const restaurantUrl = getRestaurantUrl(restaurantId);
  
  const shareMessage = `💥 ${restaurantName} est en ligne sur Kwenda Food !

Découvre notre menu, passe ta commande et fais-toi livrer où que tu sois 🍽️✨

🍴 ${menuCount} plats disponibles
${cuisineType ? `👨‍🍳 Cuisine ${cuisineType}\n` : ''}⭐ Note ${rating.toFixed(1)}/5
📍 ${city}, RDC

👉 Commande maintenant : ${restaurantUrl}`;
  
  const shortMessage = `Restaurant ${restaurantName} sur Kwenda Food - ${restaurantUrl}`;

  const handleWhatsAppShare = () => {
    console.log('[RestaurantShare] Shared via WhatsApp:', { restaurantId, restaurantName, timestamp: new Date().toISOString() });
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    console.log('[RestaurantShare] Shared via Facebook:', { restaurantId, restaurantName });
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(restaurantUrl)}&quote=${encodeURIComponent(`Restaurant ${restaurantName} sur Kwenda Food`)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    console.log('[RestaurantShare] Shared via Telegram:', { restaurantId, restaurantName });
    const url = `https://t.me/share/url?url=${encodeURIComponent(restaurantUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shortMessage)}`;
    window.open(url, '_self');
  };

  const handleEmail = () => {
    const subject = `Restaurant ${restaurantName} sur Kwenda Food`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_self');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(restaurantUrl);
      setCopied(true);
      toast({
        title: 'Lien copié !',
        description: 'Le lien de votre restaurant a été copié.'
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

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setMessageCopied(true);
      toast({
        title: 'Message copié !',
        description: 'Le message complet a été copié avec succès.'
      });
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier le message.'
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Restaurant ${restaurantName}`,
          text: shareMessage,
          url: restaurantUrl
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-4">
      {/* Plateformes principales (2 colonnes) */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-col gap-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300"
          onClick={handleWhatsAppShare}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs font-medium">WhatsApp</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-col gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300"
          onClick={handleFacebookShare}
        >
          <Facebook className="h-4 w-4" />
          <span className="text-xs font-medium">Facebook</span>
        </Button>
      </div>

      {/* Plateformes secondaires (3 colonnes) */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 flex-col gap-1"
          onClick={handleSMS}
        >
          <MessageSquare className="h-3 w-3" />
          <span className="text-xs">SMS</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 flex-col gap-1"
          onClick={handleEmail}
        >
          <Mail className="h-3 w-3" />
          <span className="text-xs">Email</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 flex-col gap-1"
          onClick={handleTelegram}
        >
          <Send className="h-3 w-3" />
          <span className="text-xs">Telegram</span>
        </Button>
      </div>

      {/* Options alternatives */}
      <div className="space-y-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleCopyMessage}
        >
          {messageCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {messageCopied ? 'Message copié !' : 'Copier le message complet'}
        </Button>
        
        {navigator.share && window.isSecureContext && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleNativeShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Plus d'options de partage
          </Button>
        )}
      </div>
    </div>
  );
};
