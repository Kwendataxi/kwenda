import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  Phone,
  MessageSquare,
  Camera,
  User,
  Star,
  Navigation,
  Zap,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { DeliveryRealtimeMap } from './DeliveryRealtimeMap';

interface DeliveryStatus {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
  icon: any;
}

interface DeliveryTrackingProps {
  orderId: string;
  orderData: any;
  onBack: () => void;
}

const DeliveryTracking = ({ orderId, orderData, onBack }: DeliveryTrackingProps) => {
  const { 
    order, 
    loading, 
    error, 
    driverProfile, 
    recipientProfile, 
    driverLocation, 
    statusHistory, 
    statusLabel, 
    price, 
    packageType 
  } = useDeliveryTracking(orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || (!loading && !order)) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-grey-900 mb-2">
            {error?.includes('Format') ? 'Lien invalide' : 'Commande introuvable'}
          </h3>
          <p className="text-grey-600 mb-6">
            {error?.includes('Format') 
              ? 'Ce lien de suivi n\'est pas valide. Vérifiez le lien ou contactez l\'expéditeur.'
              : error || 'Cette commande de livraison n\'existe pas ou n\'est plus accessible.'
            }
          </p>
          <div className="space-y-3">
            <Button onClick={onBack} className="w-full">
              Retour à l'accueil
            </Button>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacter le support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Construire l'historique des statuts avec les données réelles
  const getStatusSteps = () => {
    const allSteps = [
      { key: 'confirmed', title: 'Commande confirmée', description: 'Votre demande de livraison a été acceptée', icon: CheckCircle },
      { key: 'driver_assigned', title: 'Livreur assigné', description: 'Un livreur se dirige vers le point de retrait', icon: User },
      { key: 'picked_up', title: 'Colis récupéré', description: 'Le livreur a récupéré votre colis', icon: Package },
      { key: 'in_transit', title: 'En cours de livraison', description: 'Le colis est en route vers la destination', icon: Truck },
      { key: 'delivered', title: 'Livré', description: 'Colis livré avec succès', icon: CheckCircle }
    ];

    return allSteps.map((step, index) => {
      const historyItem = statusHistory.find(h => h.status === step.key);
      const currentIndex = allSteps.findIndex(s => s.key === order?.status);
      
      return {
        id: step.key,
        title: step.title,
        description: step.description,
        timestamp: historyItem ? new Date(historyItem.changed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
        completed: index <= currentIndex && order?.status !== 'pending',
        current: index === currentIndex,
        icon: step.icon
      };
    });
  };

  const statusSteps = getStatusSteps();

  const isDelivered = order?.status === 'delivered';

  

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-grey-900 mb-2">
          {isDelivered ? 'Livraison terminée !' : 'Suivi de votre livraison'}
        </h2>
        <p className="text-grey-600">
          Livraison #{order.id.slice(-8)} • {packageType}
        </p>
      </div>

      {/* Driver Info */}
      {!isDelivered && (
        <Card className="border-grey-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grey-100 rounded-full flex items-center justify-center text-2xl">
                👨🏿‍💼
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-grey-900">
                  {driverProfile?.display_name || 'Chauffeur assigné'}
                </h3>
                <p className="text-sm text-grey-600">
                  {driverProfile?.phone_number || 'Numéro non disponible'}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Map Tracking */}
      {!isDelivered && order.pickup_coordinates && order.delivery_coordinates && (
        <DeliveryRealtimeMap
          pickupLocation={order.pickup_coordinates as { lat: number; lng: number }}
          deliveryLocation={order.delivery_coordinates as { lat: number; lng: number }}
          driverLocation={driverLocation as { lat: number; lng: number } | undefined}
          status={order.status}
          estimatedTime={order.status === 'in_transit' ? 15 : 30}
        />
      )}

      {/* Estimated Time */}
      {!isDelivered && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-grey-900">Livraison estimée</p>
                  <p className="text-sm text-grey-600">Aujourd'hui</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  {order.delivered_at 
                    ? new Date(order.delivered_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : 'En cours...'
                  }
                </p>
                <p className="text-sm text-grey-600">{price?.toLocaleString()} FC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statut de livraison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusSteps.map((status, index) => (
              <div key={status.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status.completed 
                      ? 'bg-green-500 text-white' 
                      : status.current 
                        ? 'bg-primary text-white animate-pulse' 
                        : 'bg-grey-200 text-grey-500'
                  }`}>
                    <status.icon className="w-5 h-5" />
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-8 mt-2 ${
                      status.completed ? 'bg-green-500' : 'bg-grey-200'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      status.completed || status.current ? 'text-grey-900' : 'text-grey-500'
                    }`}>
                      {status.title}
                    </h4>
                    {status.timestamp && (
                      <span className="text-sm text-grey-500">{status.timestamp}</span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    status.completed || status.current ? 'text-grey-600' : 'text-grey-400'
                  }`}>
                    {status.description}
                  </p>
                  
                  {status.current && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        En cours...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Proof */}
      {isDelivered && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Preuve de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-grey-600 mb-1">Reçu par</p>
                <p className="font-medium">{order.recipient_signature || 'Non spécifié'}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-grey-600 mb-1">Heure de livraison</p>
                <p className="font-medium">
                  {order.delivered_at 
                    ? new Date(order.delivered_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-grey-600 mb-2">Photo de livraison</p>
              <div className="w-full h-32 bg-grey-100 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-grey-400" />
                <span className="ml-2 text-grey-500">Photo disponible</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!isDelivered && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {/* Open map tracking */}}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Suivre sur la carte
          </Button>
        )}
        
        {isDelivered && (
          <Button 
            onClick={onBack}
            className="w-full bg-gradient-primary text-white"
          >
            Nouvelle livraison
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onBack}
          className="w-full"
        >
          Retour à l'accueil
        </Button>
      </div>

      {/* Help */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Besoin d'aide ?</h4>
        <p className="text-sm text-blue-700 mb-3">
          Une question sur votre livraison ? Contactez notre support client.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-blue-700 border-blue-200">
            <Phone className="w-4 h-4 mr-1" />
            Appeler
          </Button>
          <Button size="sm" variant="outline" className="text-blue-700 border-blue-200">
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;