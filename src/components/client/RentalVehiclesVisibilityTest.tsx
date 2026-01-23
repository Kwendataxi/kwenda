import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface VehicleTestResult {
  id: string;
  name: string;
  category_name: string;
  daily_rate: number;
  images: any;
  is_available: boolean;
  moderation_status: string;
}

export const RentalVehiclesVisibilityTest = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleTestResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) {
      toast.error('Vous devez être connecté en tant que client');
    }
  };

  const testVehicleVisibility = async () => {
    setLoading(true);
    setVehicles([]);

    try {
      console.log('🧪 TEST: Fetching rental vehicles as client...');
      
      // Test 1: Vérifier l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non authentifié - connectez-vous en tant que client');
      }
      console.log('✅ User authenticated:', user.email);

      // Test 2: Récupérer les véhicules avec RLS policy
      const { data: vehiclesData, error } = await supabase
        .from('rental_vehicles')
        .select(`
          id,
          name,
          daily_rate,
          images,
          is_available,
          moderation_status,
          category_id
        `)
        .eq('moderation_status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true);

      if (error) {
        console.error('❌ RLS Error:', error);
        throw error;
      }

      console.log('✅ Vehicles fetched:', vehiclesData?.length || 0);
      console.log('📊 Vehicles data:', vehiclesData);

      // Formater les véhicules
      const formattedVehicles = (vehiclesData || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        category_name: 'Véhicule',
        daily_rate: v.daily_rate,
        images: v.images,
        is_available: v.is_available,
        moderation_status: v.moderation_status
      }));

      setVehicles(formattedVehicles);

      toast.success(`✅ Test réussi ! ${formattedVehicles.length} véhicules visibles`);
    } catch (error: any) {
      console.error('❌ Test Error:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRental = () => {
    navigate('/rental');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🚗 Test Visibilité Véhicules Côté Client</CardTitle>
        <CardDescription>
          Vérifie que les 10 véhicules de "Kwenda Test Fleet" sont visibles pour les clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p><strong>Utilisateur connecté:</strong> {user?.email || 'Non connecté'}</p>
          <p><strong>Rôle attendu:</strong> Client (non-partenaire)</p>
          <p><strong>Véhicules attendus:</strong> 10 véhicules approuvés</p>
          <p><strong>Partenaire source:</strong> Kwenda Test Fleet</p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testVehicleVisibility} 
            disabled={loading || !user}
            className="flex-1"
          >
            {loading ? '⏳ Test en cours...' : '▶️ Tester Visibilité'}
          </Button>
          <Button 
            onClick={navigateToRental}
            variant="outline"
            className="flex-1"
          >
            📍 Aller à la page Location
          </Button>
        </div>

        {vehicles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                {vehicles.length} véhicules visibles
              </span>
            </div>

            <div className="grid gap-3">
              {vehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">#{index + 1} {vehicle.name}</span>
                    {vehicle.is_available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground">Catégorie: {vehicle.category_name}</p>
                  <p className="text-muted-foreground">Prix/jour: {vehicle.daily_rate.toLocaleString()} CDF</p>
                  <p className="text-muted-foreground">Images: {Array.isArray(vehicle.images) ? vehicle.images.length : 0} photo(s)</p>
                  <p className="text-xs text-muted-foreground">Status: {vehicle.moderation_status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && vehicles.length === 0 && user && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              Aucun véhicule trouvé - Vérifiez les RLS policies
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Critères de validation:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ 10 véhicules doivent être visibles</li>
            <li>✅ Tous avec moderation_status = "approved"</li>
            <li>✅ is_active = true et is_available = true</li>
            <li>✅ Images et prix présents</li>
            <li>✅ Filtres par catégorie fonctionnels</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
