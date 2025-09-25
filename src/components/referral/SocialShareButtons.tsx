import React from 'react';
import { Button } from '@/components/ui/button';
import { CongoButton } from '@/components/ui/CongoComponents';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Mail, 
  Copy, 
  Share2,
  Phone 
} from 'lucide-react';

interface SocialShareButtonsProps {
  referralCode: string;
  userType: 'client' | 'driver' | 'admin' | 'partner';
  reward: number;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ 
  referralCode, 
  userType, 
  reward 
}) => {
  const { toast } = useToast();

  const getShareMessage = () => {
    const baseUrl = "https://kwenda.taxi";
    
    if (userType === 'driver' || userType === 'admin' || userType === 'partner') {
      return `🚗💼 Deviens chauffeur sur Kwenda Taxi Congo !

Utilise mon code de parrainage : ${referralCode}
🎁 Gagne ${reward} CDF de bonus !

✅ Plus de courses, plus de revenus
✅ Application moderne et fiable
✅ Support chauffeur 24/7

Télécharge l'app : ${baseUrl}`;
    } else {
      return `🚗💰 Rejoins-moi sur Kwenda Taxi Congo !

Utilise mon code : ${referralCode}
🎁 Bonus de ${reward} CDF pour toi !

✅ Transport sûr et rapide
✅ Prix transparents
✅ Chauffeurs vérifiés

Télécharge l'app : ${baseUrl}`;
    }
  };

  const shareMessage = getShareMessage();

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://kwenda.taxi')}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleSMSShare = () => {
    const url = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.open(url);
  };

  const handleEmailShare = () => {
    const subject = userType === 'driver' ? 'Deviens chauffeur sur Kwenda Taxi !' : 'Rejoins-moi sur Kwenda Taxi !';
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(url);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast({
        title: "Message copié !",
        description: "Le message de parrainage a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le message",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: userType === 'driver' ? 'Deviens chauffeur sur Kwenda Taxi !' : 'Rejoins-moi sur Kwenda Taxi !',
          text: shareMessage,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyMessage();
        }
      }
    } else {
      handleCopyMessage();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Partage ton code sur :
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <CongoButton
          variant="success"
          size="sm"
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </CongoButton>

        <CongoButton
          variant="info"
          size="sm"
          onClick={handleTelegramShare}
          className="flex items-center gap-2 text-sm"
        >
          <Send className="h-4 w-4" />
          Telegram
        </CongoButton>

        <CongoButton
          variant="warning"
          size="sm"
          onClick={handleSMSShare}
          className="flex items-center gap-2 text-sm"
        >
          <Phone className="h-4 w-4" />
          SMS
        </CongoButton>

        <CongoButton
          variant="default"
          size="sm"
          onClick={handleEmailShare}
          className="flex items-center gap-2 text-sm"
        >
          <Mail className="h-4 w-4" />
          Email
        </CongoButton>
      </div>

      <div className="flex gap-2">
        <CongoButton
          variant="default"
          size="sm"
          onClick={handleCopyMessage}
          className="flex-1 text-sm"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copier le message
        </CongoButton>

        <CongoButton
          variant="success"
          size="sm"
          onClick={handleNativeShare}
          className="flex-1 text-sm"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </CongoButton>
      </div>

      {/* Preview du message */}
      <div className="mt-4 p-3 bg-muted rounded-lg border">
        <div className="text-xs text-muted-foreground mb-2">Aperçu du message :</div>
        <div className="text-sm whitespace-pre-line">{shareMessage}</div>
      </div>
    </div>
  );
};