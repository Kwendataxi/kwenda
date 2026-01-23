import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  MessageSquare, 
  Star,
  CheckCircle,
  Car,
  Navigation,
  CreditCard
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  price: number;
  estimatedTime: number;
}

interface Location {
  address: string;
  coordinates: [number, number];
}

interface BookingFlowProps {
  pickup: Location;
  destination: Location;
  selectedVehicle: Vehicle;
  distance: number;
  onBookingComplete: () => void;
  onCancel: () => void;
}

type BookingStep = 'confirm' | 'booking' | 'searching' | 'found' | 'enroute' | 'arrived';

const BookingFlow = ({ 
  pickup, 
  destination, 
  selectedVehicle, 
  distance,
  onBookingComplete,
  onCancel 
}: BookingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('confirm');
  const [notes, setNotes] = useState('');
  const [driverInfo, setDriverInfo] = useState({
    name: 'Mbuyi Kabongo',
    phone: '+243 812 345 678',
    rating: 4.8,
    vehicle: 'Toyota Corolla - ABC 123 CD',
    photo: '👨🏿‍💼'
  });
  const [estimatedArrival, setEstimatedArrival] = useState('');

  useEffect(() => {
    if (currentStep === 'booking') {
      // Simulation de la recherche de chauffeur
      const timer = setTimeout(() => {
        setCurrentStep('searching');
        
        setTimeout(() => {
          setCurrentStep('found');
          const arrivalTime = new Date();
          arrivalTime.setMinutes(arrivalTime.getMinutes() + selectedVehicle.estimatedTime);
          setEstimatedArrival(arrivalTime.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }));
        }, 3000);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedVehicle.estimatedTime]);

  const handleBooking = () => {
    setCurrentStep('booking');
  };

  const simulateDriverArrival = () => {
    setCurrentStep('enroute');
    setTimeout(() => {
      setCurrentStep('arrived');
    }, 2000);
  };

  if (currentStep === 'confirm') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-grey-900 mb-2">Confirmer votre trajet</h2>
          <p className="text-grey-600">Vérifiez les détails avant de confirmer</p>
        </div>

        <Card className="border-grey-100">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2 mt-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-0.5 h-8 bg-grey-200"></div>
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-grey-600">Départ</p>
                  <p className="font-medium text-grey-900">{pickup.address}</p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Arrivée</p>
                  <p className="font-medium text-grey-900">{destination.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-grey-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-grey-900">{selectedVehicle.name}</h3>
                <p className="text-sm text-grey-600">{distance.toFixed(1)} km • ~{selectedVehicle.estimatedTime} min</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  {selectedVehicle.price.toLocaleString()} CDF
                </p>
                <p className="text-sm text-grey-600">Prix estimé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <label className="text-sm font-medium text-grey-900">Note pour le chauffeur (optionnel)</label>
          <Textarea
            placeholder="Instructions spéciales, points de repère..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-white border-grey-100 rounded-xl"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border-grey-200"
          >
            Annuler
          </Button>
          <Button
            onClick={handleBooking}
            className="flex-1 h-12 rounded-xl bg-gradient-primary text-white"
          >
            Confirmer le trajet
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'booking' || currentStep === 'searching') {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Car className="w-10 h-10 text-primary animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-grey-900 mb-2">
            {currentStep === 'booking' ? 'Confirmation...' : 'Recherche d\'un chauffeur'}
          </h2>
          <p className="text-grey-600">
            {currentStep === 'booking' 
              ? 'Traitement de votre demande' 
              : 'Nous cherchons le chauffeur le plus proche'
            }
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full h-12 rounded-xl border-grey-200"
        >
          Annuler la recherche
        </Button>
      </div>
    );
  }

  if (currentStep === 'found' || currentStep === 'enroute' || currentStep === 'arrived') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-grey-900 mb-2">
            {currentStep === 'found' && 'Chauffeur trouvé !'}
            {currentStep === 'enroute' && 'En route vers vous'}
            {currentStep === 'arrived' && 'Chauffeur arrivé'}
          </h2>
          <p className="text-grey-600">
            {currentStep === 'found' && `Arrivée prévue à ${estimatedArrival}`}
            {currentStep === 'enroute' && 'Votre chauffeur arrive'}
            {currentStep === 'arrived' && 'Votre chauffeur vous attend'}
          </p>
        </div>

        <Card className="border-grey-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grey-100 rounded-full flex items-center justify-center text-2xl">
                {driverInfo.photo}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-grey-900">{driverInfo.name}</h3>
                <p className="text-sm text-grey-600">{driverInfo.vehicle}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{driverInfo.rating}</span>
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

        <Card className="border-grey-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-grey-900">Détails du trajet</h4>
              <span className="text-sm text-primary font-medium">
                {selectedVehicle.price.toLocaleString()} CDF
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-grey-600">Départ</p>
                  <p className="text-grey-900">{pickup.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                <div>
                  <p className="text-grey-600">Arrivée</p>
                  <p className="text-grey-900">{destination.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {currentStep === 'found' && (
            <>
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12 rounded-xl border-grey-200"
              >
                Annuler
              </Button>
              <Button
                onClick={simulateDriverArrival}
                className="flex-1 h-12 rounded-xl bg-gradient-primary text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Suivre en temps réel
              </Button>
            </>
          )}
          
          {currentStep === 'enroute' && (
            <Button
              onClick={() => setCurrentStep('arrived')}
              className="w-full h-12 rounded-xl bg-gradient-primary text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Voir sur la carte
            </Button>
          )}
          
          {currentStep === 'arrived' && (
            <Button
              onClick={onBookingComplete}
              className="w-full h-12 rounded-xl bg-gradient-primary text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Commencer le trajet
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default BookingFlow;