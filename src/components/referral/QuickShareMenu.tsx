import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Send, Smartphone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickShareMenuProps {
  referralCode: string;
  userType: 'client' | 'driver' | 'partner' | 'admin';
  reward: number;
  children: React.ReactNode;
}

export const QuickShareMenu: React.FC<QuickShareMenuProps> = ({
  referralCode,
  userType,
  reward,
  children
}) => {
  const { toast } = useToast();

  const getShareMessage = () => {
    const rewardText = userType === 'client' ? '500 CDF' : '2000 CDF';
    
    if (userType === 'client') {
      return `🚗 Rejoignez-moi sur KwendaTaxi avec le code ${referralCode} et obtenez ${rewardText} de crédit gratuit ! Commandez maintenant : https://kwenda.taxi`;
    } else {
      return `🚕 Devenez chauffeur KwendaTaxi avec mon code ${referralCode} et obtenez ${rewardText} de bonus ! Inscription : https://kwenda.taxi/driver`;
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleTelegramShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://t.me/share/url?text=${message}`, '_blank');
  };

  const handleSMSShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`sms:?body=${message}`, '_blank');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(getShareMessage());
      toast({
        title: "Message copié !",
        description: "Le message de parrainage a été copié dans le presse-papier.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le message.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code de parrainage KwendaTaxi',
          text: getShareMessage(),
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyMessage();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground mb-3">Partager rapidement</h4>
          
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            size="sm"
            className="w-full justify-start bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
            WhatsApp
          </Button>

          <Button
            onClick={handleTelegramShare}
            variant="outline"
            size="sm"
            className="w-full justify-start bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border-[#0088cc]/30"
          >
            <Send className="h-4 w-4 mr-2 text-[#0088cc]" />
            Telegram
          </Button>

          <Button
            onClick={handleSMSShare}
            variant="outline"
            size="sm"
            className="w-full justify-start bg-congo-blue/10 hover:bg-congo-blue/20 border-congo-blue/30"
          >
            <Smartphone className="h-4 w-4 mr-2 text-congo-blue" />
            SMS
          </Button>

          <div className="border-t pt-2">
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier le message
            </Button>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              size="sm"
              className="w-full justify-start mt-2"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Plus d'options
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};