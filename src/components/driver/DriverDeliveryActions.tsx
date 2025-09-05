import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Camera,
  Navigation,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useDriverDeliveryActions } from '@/hooks/useDriverDeliveryActions';
import { secureLocation, isValidLocation } from '@/utils/locationValidation';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
}

interface DriverDeliveryActionsProps {
  order: DeliveryOrder;
  onStatusUpdate: () => void;
}

const DriverDeliveryActions: React.FC<DriverDeliveryActionsProps> = ({ order, onStatusUpdate }) => {
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  
  // Utiliser le hook optimisé pour les actions livreur
  const {
    loading,
    confirmPickup,
    startDelivery,
    completeDelivery,
    getStatusLabel
  } = useDriverDeliveryActions();

  // Actions simplifiées utilisant le hook optimisé
  const handlePickupConfirm = async () => {
    const success = await confirmPickup(order.id, notes);
    if (success) {
      onStatusUpdate();
      setNotes('');
      toast.success('Colis récupéré avec succès! 📦');
    }
  };

  const handleStartDelivery = async () => {
    const success = await startDelivery(order.id);
    if (success) {
      onStatusUpdate();
      toast.success('Livraison démarrée! 🚗');
    }
  };

  const handleDeliveryComplete = async () => {
    if (!recipientName.trim()) {
      toast.error('Veuillez entrer le nom du destinataire');
      return;
    }

    const success = await completeDelivery(
      order.id,
      recipientName,
      deliveryPhoto || undefined,
      notes
    );
    
    if (success) {
      onStatusUpdate();
      setNotes('');
      setRecipientName('');
      setDeliveryPhoto(null);
      toast.success('Livraison terminée! Excellent travail! 🎉');
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'confirmed':
      case 'driver_assigned':
        return (
          <div className="space-y-3">
            <Button 
              onClick={handlePickupConfirm}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Confirmation...' : 'Confirmer la récupération'}
            </Button>
          </div>
        );

      case 'picked_up':
        return (
          <div className="space-y-3">
            <Button 
              onClick={handleStartDelivery}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? 'Démarrage...' : 'Démarrer la livraison'}
            </Button>
          </div>
        );

      case 'in_transit':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="recipient">Nom du destinataire *</Label>
                <Input
                  id="recipient"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label htmlFor="photo">Photo de livraison</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setDeliveryPhoto(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  <Camera className="w-4 h-4 text-grey-500" />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleDeliveryComplete}
              disabled={loading || !recipientName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Finalisation...' : 'Confirmer la livraison'}
            </Button>
          </div>
        );

      case 'delivered':
        return (
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-green-700">Livraison terminée !</p>
            <p className="text-sm text-grey-600">Excellent travail 👏</p>
          </div>
        );

      default:
        return null;
    }
  };

  const openNavigation = () => {
    const coords = order.status === 'confirmed' || order.status === 'driver_assigned' 
      ? order.pickup_coordinates 
      : order.delivery_coordinates;
    
    // Sécuriser les coordonnées avant navigation
    const secureCoords = coords ? secureLocation(coords) : null;
    
    if (secureCoords && isValidLocation(secureCoords)) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${secureCoords.lat},${secureCoords.lng}`;
      window.open(url, '_blank');
    } else {
      toast.error('Coordonnées invalides pour la navigation');
    }
  };

  return (
    <Card className="border-grey-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Livraison {order.delivery_type.toUpperCase()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations de livraison */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Point de retrait</p>
              <p className="text-sm text-grey-600">{order.pickup_location}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Destination</p>
              <p className="text-sm text-grey-600">{order.delivery_location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-grey-500" />
            <div>
              <span className="font-medium text-sm">Prix: </span>
              <span className="text-primary font-semibold">{order.estimated_price?.toLocaleString()} FC</span>
            </div>
          </div>
        </div>

        {/* Notes du chauffeur */}
        <div>
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Commentaires sur la livraison..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Actions principales */}
        {renderActionButtons()}

        {/* Actions secondaires */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openNavigation}
            className="flex-1"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Navigation
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-10 h-8 p-0"
          >
            <Phone className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-10 h-8 p-0"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverDeliveryActions;