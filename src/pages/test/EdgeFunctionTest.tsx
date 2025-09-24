import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function EdgeFunctionTest() {
  const [isTestingRide, setIsTestingRide] = useState(false);
  const [isTestingDelivery, setIsTestingDelivery] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const testRideDispatcher = async () => {
    setIsTestingRide(true);
    try {
      console.log('🧪 Testing ride-dispatcher...');
      
      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          booking_id: 'test-booking-' + Date.now(),
          pickup_coordinates: {
            lat: -4.3217,
            lng: 15.3069
          },
          service_type: 'taxi',
          radius_km: 15
        }
      });

      if (error) throw error;

      const result = {
        function: 'ride-dispatcher',
        status: 'success',
        data: data,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      toast({
        title: "✅ Test réussi",
        description: "Ride dispatcher fonctionne correctement",
      });

    } catch (error: any) {
      console.error('❌ Ride dispatcher error:', error);
      const result = {
        function: 'ride-dispatcher',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setResults(prev => [...prev, result]);
      toast({
        title: "❌ Test échoué",
        description: `Erreur: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingRide(false);
    }
  };

  const testDeliveryDispatcher = async () => {
    setIsTestingDelivery(true);
    try {
      console.log('🧪 Testing delivery-dispatcher...');
      
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          orderId: 'test-delivery-' + Date.now(),
          pickupLat: -4.3217,
          pickupLng: 15.3069,
          deliveryType: 'flash'
        }
      });

      if (error) throw error;

      const result = {
        function: 'delivery-dispatcher',
        status: 'success',
        data: data,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      toast({
        title: "✅ Test réussi",
        description: "Delivery dispatcher fonctionne correctement",
      });

    } catch (error: any) {
      console.error('❌ Delivery dispatcher error:', error);
      const result = {
        function: 'delivery-dispatcher',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setResults(prev => [...prev, result]);
      toast({
        title: "❌ Test échoué",
        description: `Erreur: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingDelivery(false);
    }
  };

  const testFindNearbyDrivers = async () => {
    try {
      console.log('🧪 Testing find_nearby_drivers function...');
      
      const { data, error } = await supabase.rpc('find_nearby_drivers', {
        pickup_lat: -4.3217,
        pickup_lng: 15.3069,
        service_type_param: 'transport',
        radius_km: 15
      });

      if (error) throw error;

      const result = {
        function: 'find_nearby_drivers',
        status: 'success',
        data: data,
        driversFound: data?.length || 0,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      toast({
        title: "✅ Test réussi",
        description: `${data?.length || 0} chauffeurs trouvés`,
      });

    } catch (error: any) {
      console.error('❌ Find nearby drivers error:', error);
      const result = {
        function: 'find_nearby_drivers',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setResults(prev => [...prev, result]);
      toast({
        title: "❌ Test échoué",
        description: `Erreur: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🔧 Test des Edge Functions Critiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testRideDispatcher}
              disabled={isTestingRide}
              variant="outline"
            >
              {isTestingRide ? "Testing..." : "🚗 Test Ride Dispatcher"}
            </Button>
            
            <Button 
              onClick={testDeliveryDispatcher}
              disabled={isTestingDelivery}
              variant="outline"
            >
              {isTestingDelivery ? "Testing..." : "🚚 Test Delivery Dispatcher"}
            </Button>
            
            <Button 
              onClick={testFindNearbyDrivers}
              variant="outline"
            >
              🔍 Test Find Drivers
            </Button>
          </div>

          <Button 
            onClick={() => setResults([])}
            variant="secondary"
            className="w-full"
          >
            🗑️ Effacer les résultats
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {result.status === 'success' ? '✅' : '❌'} {result.function}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {result.driversFound !== undefined && (
                        <p className="text-sm font-medium">
                          {result.driversFound} chauffeurs trouvés
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <p className="text-sm text-red-600 mt-2">
                      Erreur: {result.error}
                    </p>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer">
                        Voir les détails
                      </summary>
                      <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}