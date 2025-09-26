import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock, 
  Star,
  Package,
  RefreshCw,
  ChevronLeft,
  Info,
  User,
  Send
} from 'lucide-react';
import { useRealTimeDeliveryTracking } from '@/hooks/useRealTimeDeliveryTracking';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface EnhancedDeliveryTrackerProps {
  orderId: string;
  onBack?: () => void;
}

export default function EnhancedDeliveryTracker({ 
  orderId, 
  onBack 
}: EnhancedDeliveryTrackerProps) {
  const [showChat, setShowChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    sendMessage,
    callDriver,
    callClient,
    refreshTracking,
    getStatusLabel
  } = useRealTimeDeliveryTracking({
    orderId,
    enableDriverTracking: true,
    enableChat: true
  });

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    const success = await sendMessage(messageText);
    if (success) {
      setMessageText('');
      toast.success('Message envoyé');
    }
  };

  if (loading && !trackingData.order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-muted rounded animate-pulse" />
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-destructive/20 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Erreur de suivi</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={refreshTracking} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!trackingData.order) return null;

  const order = trackingData.order;
  const driverProfile = trackingData.driverProfile;
  const driverLocation = trackingData.driverLocation;

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'success';
    if (status === 'cancelled') return 'destructive';
    if (order.driver_id) return 'primary';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="touch-manipulation">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span className="font-medium">Livraison</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-orange-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <Button variant="ghost" size="icon" onClick={refreshTracking} className="touch-manipulation">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{getStatusLabel(order.status)}</h2>
                    <p className="text-sm text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any} className="px-3 py-1">
                    {order.delivery_type?.toUpperCase()}
                  </Badge>
                </div>
                
                <Progress value={trackingData.eta ? 75 : 25} className="h-2" />
                
                {trackingData.eta && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Arrivée dans {trackingData.eta} min</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Driver Card */}
        {driverProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {driverProfile.profile_photo_url ? (
                        <img 
                          src={driverProfile.profile_photo_url} 
                          alt={driverProfile.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{driverProfile.display_name}</h3>
                      {driverProfile.vehicle_model && (
                        <p className="text-sm text-muted-foreground">
                          {driverProfile.vehicle_model}
                          {driverProfile.vehicle_plate && ` • ${driverProfile.vehicle_plate}`}
                        </p>
                      )}
                      {driverProfile.rating_average && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {driverProfile.rating_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={callDriver} 
                      className="flex-1 h-12 touch-manipulation"
                      disabled={!driverProfile.phone_number}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12 touch-manipulation"
                      onClick={() => setShowChat(!showChat)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-medium">Itinéraire</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Départ</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.pickup_location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l border-dashed border-muted-foreground/30 h-6" />
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Arrivée</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.delivery_location}
                      </p>
                    </div>
                  </div>
                </div>
                
                {driverLocation && (
                  <Button 
                    onClick={() => {
                      const url = `https://maps.google.com/?q=${driverLocation.lat},${driverLocation.lng}`;
                      window.open(url, '_blank');
                    }} 
                    variant="outline" 
                    className="w-full h-12 touch-manipulation"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir sur la carte
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <h3 className="font-medium">Chat avec le chauffeur</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {trackingData.chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          msg.sender_type === 'driver' 
                            ? 'bg-muted mr-auto' 
                            : 'bg-primary text-primary-foreground ml-auto'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.sent_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Votre message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      size="icon"
                      disabled={!messageText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}