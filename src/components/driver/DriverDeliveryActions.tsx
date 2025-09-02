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
import { supabase } from '@/integrations/supabase/client';
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
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);

  const updateStatus = async (newStatus: string, additionalData: any = {}) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delivery-status-manager', {
        body: {
          orderId: order.id,
          newStatus,
          driverId: (await supabase.auth.getUser()).data.user?.id,
          driverNotes: notes || undefined,
          locationCoordinates: await getCurrentLocation(),
          ...additionalData
        }
      });

      if (error) throw error;

      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      onStatusUpdate();
      setNotes('');
      setRecipientName('');
      setDeliveryPhoto(null);

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return undefined;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'picked_up': return 'Colis récupéré';
      case 'in_transit': return 'En cours de livraison';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  const handleDeliveryComplete = async () => {
    if (!recipientName.trim()) {
      toast.error('Veuillez entrer le nom du destinataire');
      return;
    }

    const deliveryProof = {
      recipient_name: recipientName,
      delivery_time: new Date().toISOString(),
      photo_taken: !!deliveryPhoto
    };

    await updateStatus('delivered', { 
      deliveryProof,
      recipientSignature: recipientName // Simplified signature
    });
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'confirmed':
      case 'driver_assigned':
        return (
          <div className="space-y-3">
            <Button 
              onClick={() => updateStatus('picked_up')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Confirmer la récupération
            </Button>
          </div>
        );

      case 'picked_up':
        return (
          <div className="space-y-3">
            <Button 
              onClick={() => updateStatus('in_transit')}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Démarrer la livraison
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
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer la livraison
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
    
    if (coords?.lat && coords?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
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