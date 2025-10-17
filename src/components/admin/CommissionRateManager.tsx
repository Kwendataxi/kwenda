import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Percent } from 'lucide-react';

export const CommissionRateManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    default_rate: 5.00,
    min_rate: 3.00,
    max_rate: 15.00,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_commission_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      setConfigId(data.id);
      setConfig({
        default_rate: data.default_commission_rate,
        min_rate: data.min_commission_rate,
        max_rate: data.max_commission_rate,
      });
    } catch (error: any) {
      console.error('Error fetching config:', error);
    }
  };

  const updateConfig = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!configId) {
        toast({
          title: 'Erreur',
          description: 'Configuration non trouvée',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('restaurant_commission_config')
        .update({
          default_commission_rate: config.default_rate,
          min_commission_rate: config.min_rate,
          max_commission_rate: config.max_rate,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: '✅ Configuration mise à jour',
        description: 'Les nouveaux taux de commission sont actifs',
      });
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration des taux de commission
        </CardTitle>
        <CardDescription>
          Définissez les taux de commission appliqués aux restaurants qui choisissent le modèle "commission par vente"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Taux par défaut (%)
            </label>
            <Input
              type="number"
              step="0.01"
              min={config.min_rate}
              max={config.max_rate}
              value={config.default_rate}
              onChange={(e) => setConfig({ ...config, default_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Appliqué aux nouveaux restaurants
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Taux minimum (%)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={config.max_rate}
              value={config.min_rate}
              onChange={(e) => setConfig({ ...config, min_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Limite basse autorisée
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Taux maximum (%)</label>
            <Input
              type="number"
              step="0.01"
              min={config.min_rate}
              max="50"
              value={config.max_rate}
              onChange={(e) => setConfig({ ...config, max_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Limite haute autorisée
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Aperçu des commissions</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Commande 10 000 CDF → Commission: {Math.round(10000 * (config.default_rate / 100))} CDF</p>
            <p>• Commande 50 000 CDF → Commission: {Math.round(50000 * (config.default_rate / 100))} CDF</p>
            <p>• Commande 100 000 CDF → Commission: {Math.round(100000 * (config.default_rate / 100))} CDF</p>
          </div>
        </div>

        <Button 
          onClick={updateConfig} 
          disabled={loading || config.default_rate < config.min_rate || config.default_rate > config.max_rate} 
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </CardContent>
    </Card>
  );
};
