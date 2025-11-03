import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import { Card } from '@/components/ui/card';
import { ApproveAllRentalsButton } from '@/components/admin/ApproveAllRentalsButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AdminRentalModeration() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['rental-moderation-stats'],
    queryFn: async () => {
      const { data: pending } = await supabase
        .from('rental_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'pending');

      const { data: approved } = await supabase
        .from('rental_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'approved');

      const { data: rejected } = await supabase
        .from('rental_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'rejected');

      return {
        pending: pending?.length || 0,
        approved: approved?.length || 0,
        rejected: rejected?.length || 0
      };
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <UniversalAppHeader title="Modération Location" showBackButton={true} />

      <div className="max-w-4xl mx-auto p-4 pt-20 space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">🚗 Modération des Véhicules</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
                  <div className="text-sm text-muted-foreground">En attente</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                </Card>

                <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200">
                  <div className="text-sm text-muted-foreground">Approuvés</div>
                  <div className="text-3xl font-bold text-green-600">{stats?.approved || 0}</div>
                </Card>

                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200">
                  <div className="text-sm text-muted-foreground">Rejetés</div>
                  <div className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</div>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">⚡ Action rapide</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Approuver tous les véhicules en attente de modération en un clic.
                    Cette action est irréversible.
                  </p>
                  <ApproveAllRentalsButton />
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>💡 <strong>Note :</strong> Les véhicules approuvés seront immédiatement visibles par les clients dans l'interface de location.</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
