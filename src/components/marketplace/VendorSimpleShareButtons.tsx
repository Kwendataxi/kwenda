import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [linkGenerated, setLinkGenerated] = React.useState(false);

  // ✅ Validation UUID côté client
  React.useEffect(() => {
    if (!vendorId || vendorId.length !== 36) {
      console.error('[VendorShare] Invalid vendor ID:', vendorId);
      toast({
        variant: 'destructive',
        title: '⚠️ Erreur de configuration',
        description: 'Votre ID boutique est invalide. Contactez le support Kwenda.'
      });
    }
  }, [vendorId, toast]);

  const shopUrl = getVendorShopUrl(vendorId);
  
  // Debug log pour vérifier l'UUID et le lien généré
  console.log('[VendorShare] Current state:', {
    vendorId,
    length: vendorId?.length,
    isValid: vendorId?.length === 36,
    shopUrl,
    timestamp: new Date().toISOString()
  });
  
  // Message enrichi avec emojis
  const shareMessage = `💥 ${vendorName} est en ligne sur Kwenda Shop !

Découvre nos produits, passe ta commande et fais-toi livrer où que tu sois 📦✨

📊 ${productCount} produits disponibles
⭐ Note ${rating.toFixed(1)}/5
📍 Kinshasa, RDC

👉 Visite la boutique maintenant : ${shopUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shopUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleGenerateNewLink = () => {
    setLinkGenerated(true);
    toast({
      title: '✅ Nouveau lien généré',
      description: 'Ce lien est maintenant prêt à être partagé.',
    });
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
          {!linkGenerated ? 'Générez votre lien de partage' : 'Choisis comment partager ton lien'}
        </p>
      </div>
      
      {/* Bouton de génération de lien */}
      {!linkGenerated && (
        <Alert>
          <AlertDescription className="space-y-3">
            <p className="text-sm">Cliquez pour préparer votre lien de partage unique</p>
            <Button 
              onClick={handleGenerateNewLink}
              className="w-full"
              variant="default"
            >
              🔄 Générer un nouveau lien
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Options de partage (visibles après génération) */}
      {linkGenerated && (
        <>
          {/* Affichage du lien généré */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-xs font-semibold">Votre lien unique :</p>
            <p className="text-xs font-mono break-all">{shopUrl}</p>
            <p className="text-xs text-muted-foreground">
              ✅ UUID : {vendorId.slice(0, 8)}...{vendorId.slice(-8)} ({vendorId.length} car.)
            </p>
          </div>
          
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
        </>
      )}
    </div>
  );
};
