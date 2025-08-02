import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Navigation
} from 'lucide-react';

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
  deliveryId: string;
  onComplete: () => void;
}

const DeliveryTracking = ({ deliveryId, onComplete }: DeliveryTrackingProps) => {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(1);
  const [deliveryInfo] = useState({
    id: deliveryId,
    estimatedDelivery: '14:30',
    driverName: 'Kasongo Mbaya',
    driverPhone: '+243 812 345 678',
    driverRating: 4.9,
    vehicleInfo: 'Moto Honda - KIN 123',
    packageType: 'Petit colis',
    cost: '2,500 FC'
  });

  const [statusHistory, setStatusHistory] = useState<DeliveryStatus[]>([
    {
      id: '1',
      title: 'Commande confirmée',
      description: 'Votre demande de livraison a été acceptée',
      timestamp: '12:30',
      completed: true,
      current: false,
      icon: CheckCircle
    },
    {
      id: '2',
      title: 'Livreur assigné',
      description: 'Un livreur se dirige vers le point de retrait',
      timestamp: '12:45',
      completed: true,
      current: true,
      icon: User
    },
    {
      id: '3',
      title: 'Colis récupéré',
      description: 'Le livreur a récupéré votre colis',
      timestamp: '',
      completed: false,
      current: false,
      icon: Package
    },
    {
      id: '4',
      title: 'En cours de livraison',
      description: 'Le colis est en route vers la destination',
      timestamp: '',
      completed: false,
      current: false,
      icon: Truck
    },
    {
      id: '5',
      title: 'Livré',
      description: 'Colis livré avec succès',
      timestamp: '',
      completed: false,
      current: false,
      icon: CheckCircle
    }
  ]);

  useEffect(() => {
    // Simulation de la progression de la livraison
    const intervals = [3000, 5000, 4000, 3000]; // Durées pour chaque étape
    let currentIndex = 1;

    const progressDelivery = () => {
      if (currentIndex < statusHistory.length - 1) {
        setTimeout(() => {
          setCurrentStatusIndex(currentIndex + 1);
          setStatusHistory(prev => prev.map((status, index) => {
            if (index === currentIndex - 1) {
              return { ...status, current: false, completed: true };
            }
            if (index === currentIndex) {
              return { 
                ...status, 
                current: true, 
                completed: false,
                timestamp: new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              };
            }
            return status;
          }));
          currentIndex++;
          progressDelivery();
        }, intervals[currentIndex - 1]);
      } else {
        // Livraison terminée
        setTimeout(() => {
          setStatusHistory(prev => prev.map((status, index) => {
            if (index === prev.length - 1) {
              return { 
                ...status, 
                current: false, 
                completed: true,
                timestamp: new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              };
            }
            return status;
          }));
        }, 2000);
      }
    };

    progressDelivery();
  }, []);

  const isDelivered = statusHistory[statusHistory.length - 1]?.completed;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-grey-900 mb-2">
          {isDelivered ? 'Livraison terminée !' : 'Suivi de votre livraison'}
        </h2>
        <p className="text-grey-600">
          Livraison #{deliveryId}
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
                <h3 className="font-semibold text-grey-900">{deliveryInfo.driverName}</h3>
                <p className="text-sm text-grey-600">{deliveryInfo.vehicleInfo}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{deliveryInfo.driverRating}</span>
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
                <p className="text-xl font-bold text-primary">{deliveryInfo.estimatedDelivery}</p>
                <p className="text-sm text-grey-600">{deliveryInfo.cost}</p>
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
            {statusHistory.map((status, index) => (
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
                  {index < statusHistory.length - 1 && (
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
                <p className="font-medium">Marie Tshisekedi</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-grey-600 mb-1">Heure de livraison</p>
                <p className="font-medium">14:28</p>
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
            onClick={onComplete}
            className="w-full bg-gradient-primary text-white"
          >
            Nouvelle livraison
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onComplete}
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