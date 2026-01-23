import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notificationSoundService } from '@/services/notificationSound';
import { toast } from 'sonner';
import { Volume2 } from 'lucide-react';

export const NotificationSoundTest = () => {
  const soundCategories = [
    {
      title: '🛍️ Marketplace',
      sounds: [
        { key: 'newOrder', label: 'Nouvelle commande' },
        { key: 'orderConfirmed', label: 'Commande confirmée' },
        { key: 'paymentReceived', label: 'Paiement reçu' },
        { key: 'productApproved', label: 'Produit approuvé' },
        { key: 'productRejected', label: 'Produit rejeté' },
      ]
    },
    {
      title: '🚗 Transport & Livraison',
      sounds: [
        { key: 'driverAssigned', label: 'Chauffeur assigné' },
        { key: 'driverArrived', label: 'Chauffeur arrivé' },
        { key: 'rideStarted', label: 'Course démarrée' },
        { key: 'deliveryPicked', label: 'Colis récupéré' },
        { key: 'deliveryCompleted', label: 'Livraison terminée' },
      ]
    },
    {
      title: '👨‍💼 Admin & Chat',
      sounds: [
        { key: 'urgentAlert', label: 'Alerte urgente' },
        { key: 'message', label: 'Nouveau message' },
      ]
    },
    {
      title: '🔔 Génériques',
      sounds: [
        { key: 'success', label: 'Succès' },
        { key: 'error', label: 'Erreur' },
        { key: 'warning', label: 'Avertissement' },
        { key: 'info', label: 'Information' },
        { key: 'general', label: 'Notification générale' },
      ]
    }
  ];

  const playSound = (soundKey: string, label: string) => {
    notificationSoundService.playNotificationSound(soundKey as any);
    toast.info(`🔊 ${label}`, { duration: 1500 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          🧪 Test des sons de notifications
        </CardTitle>
        <CardDescription>
          Testez tous les sons de notification disponibles dans Kwenda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {soundCategories.map((category, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{category.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {category.sounds.map((sound) => (
                <Button
                  key={sound.key}
                  variant="outline"
                  size="sm"
                  onClick={() => playSound(sound.key, sound.label)}
                  className="justify-start text-left h-auto py-2 px-3"
                >
                  <span className="text-xs truncate">{sound.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Astuce :</strong> Les sons peuvent être désactivés ou réglés dans les paramètres de notifications.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
