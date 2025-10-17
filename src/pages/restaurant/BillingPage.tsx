import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PaymentModelSelector } from '@/components/restaurant/PaymentModelSelector';
import { useRestaurantSubscription } from '@/hooks/useRestaurantSubscription';

export default function BillingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { activeSubscription } = useRestaurantSubscription();

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Profil restaurant non trouvé',
          variant: 'destructive',
        });
        navigate('/restaurant/dashboard');
        return;
      }

      setRestaurantId(profile.id);
    } catch (error: any) {
      console.error('Error loading restaurant data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/restaurant/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
            <h1 className="text-3xl font-bold">Modèle de facturation</h1>
            <p className="text-muted-foreground">
              Choisissez comment vous souhaitez payer pour Kwenda Food
            </p>
          </div>
        </div>

        {restaurantId && (
          <PaymentModelSelector 
            restaurantId={restaurantId}
            hasActiveSubscription={!!activeSubscription}
          />
        )}
      </div>
    </div>
  );
}
