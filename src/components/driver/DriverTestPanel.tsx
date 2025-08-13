import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  TestTube, 
  Package, 
  Car, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface DriverTestPanelProps {
  className?: string;
}

const DriverTestPanel: React.FC<DriverTestPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const result = `${emoji} ${message}`;
    setTestResults(prev => [...prev, result]);
    
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  const createTestDeliveryOrder = async () => {
    if (!user) {
      addResult('Utilisateur non connecté', 'error');
      return;
    }

    try {
      const testOrder = {
        user_id: user.id,
        pickup_location: 'Position détectée',
        delivery_location: 'Commune de Gombe, Kinshasa',
        pickup_coordinates: { lat: -4.3217, lng: 15.3069, type: 'current' },
        delivery_coordinates: { lat: -4.3256, lng: 15.3145, type: 'database' },
        delivery_type: 'flex',
        estimated_price: 5500,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(testOrder)
        .select()
        .single();

      if (error) {
        addResult(`Erreur création commande test: ${error.message}`, 'error');
        return;
      }

      addResult(`Commande test créée: ${data.id}`, 'success');
      
      // Maintenant appeler le dispatcher
      try {
        const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke('delivery-dispatcher', {
          body: {
            action: 'find_drivers',
            order_id: data.id
          }
        });

        if (dispatchError) {
          addResult(`Erreur dispatch: ${dispatchError.message}`, 'error');
        } else {
          addResult(`Dispatch réussi: ${JSON.stringify(dispatchData)}`, 'success');
        }
      } catch (dispatchErr: any) {
        addResult(`Erreur appel dispatcher: ${dispatchErr.message}`, 'error');
      }

    } catch (err: any) {
      addResult(`Erreur générale: ${err.message}`, 'error');
    }
  };

  const createTestTaxiRide = async () => {
    if (!user) {
      addResult('Utilisateur non connecté', 'error');
      return;
    }

    try {
      const testRide = {
        user_id: user.id,
        pickup_location: 'Position détectée',
        destination: 'Aéroport de N\'djili, Kinshasa',
        pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
        destination_coordinates: { lat: -4.3856, lng: 15.4446 },
        vehicle_class: 'standard',
        estimated_price: 12000,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('ride_requests')
        .insert(testRide)
        .select()
        .single();

      if (error) {
        addResult(`Erreur création course test: ${error.message}`, 'error');
        return;
      }

      addResult(`Course test créée: ${data.id}`, 'success');

      // Appeler le dispatcher taxi
      try {
        const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke('ride-dispatcher', {
          body: {
            action: 'find_drivers',
            ride_request_id: data.id
          }
        });

        if (dispatchError) {
          addResult(`Erreur dispatch taxi: ${dispatchError.message}`, 'error');
        } else {
          addResult(`Dispatch taxi réussi: ${JSON.stringify(dispatchData)}`, 'success');
        }
      } catch (dispatchErr: any) {
        addResult(`Erreur appel dispatcher taxi: ${dispatchErr.message}`, 'error');
      }

    } catch (err: any) {
      addResult(`Erreur générale: ${err.message}`, 'error');
    }
  };

  const testDriverLocation = async () => {
    if (!user) {
      addResult('Utilisateur non connecté', 'error');
      return;
    }

    try {
      // Vérifier la présence du chauffeur dans driver_locations
      const { data: locationData, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', user.id)
        .single();

      if (locationError) {
        addResult(`Pas de localisation chauffeur trouvée: ${locationError.message}`, 'error');
        
        // Créer une entrée de test
        const { error: insertError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: user.id,
            latitude: -4.3217,
            longitude: 15.3069,
            is_online: true,
            is_available: true,
            vehicle_class: 'standard',
            last_ping: new Date().toISOString()
          });

        if (insertError) {
          addResult(`Erreur création localisation: ${insertError.message}`, 'error');
        } else {
          addResult('Localisation chauffeur créée avec succès', 'success');
        }
      } else {
        addResult(`Localisation chauffeur trouvée: en ligne=${locationData.is_online}, disponible=${locationData.is_available}`, 'success');
      }

      // Vérifier le profil chauffeur
      const { data: profileData, error: profileError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        addResult(`Pas de profil chauffeur trouvé: ${profileError.message}`, 'error');
      } else {
        addResult(`Profil chauffeur trouvé: actif=${profileData.is_active}, vérifié=${profileData.verification_status}`, 'success');
      }

    } catch (err: any) {
      addResult(`Erreur test localisation: ${err.message}`, 'error');
    }
  };

  const runFullTest = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('🚀 Début des tests complets...', 'info');
    
    // Test 1: Vérification profil et localisation
    addResult('Test 1: Vérification profil chauffeur', 'info');
    await testDriverLocation();
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Création commande livraison
    addResult('Test 2: Création commande livraison test', 'info');
    await createTestDeliveryOrder();
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Création course taxi
    addResult('Test 3: Création course taxi test', 'info');
    await createTestTaxiRide();
    
    addResult('🏁 Tests terminés', 'info');
    setTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Panel de Test Chauffeur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Test Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={testDriverLocation} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <Car className="h-4 w-4 mr-2" />
            Test Localisation
          </Button>
          
          <Button 
            onClick={createTestDeliveryOrder} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <Package className="h-4 w-4 mr-2" />
            Test Livraison
          </Button>
          
          <Button 
            onClick={createTestTaxiRide} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <Car className="h-4 w-4 mr-2" />
            Test Taxi
          </Button>
          
          <Button 
            onClick={runFullTest} 
            disabled={testing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Complet
          </Button>
        </div>

        {/* Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Résultats des tests:</h4>
              <Button 
                onClick={clearResults} 
                size="sm" 
                variant="ghost"
              >
                Effacer
              </Button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-lg text-xs font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <p>
            Utilisez ces tests pour vérifier que le système de dispatch fonctionne correctement.
            Les commandes de test seront visibles dans l'interface si tout fonctionne.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverTestPanel;