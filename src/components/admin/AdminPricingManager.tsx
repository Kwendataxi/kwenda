import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePricingRules, ServiceCategory, PricingRule } from '@/hooks/usePricingRules';
import { PricingUpdateNotification } from './PricingUpdateNotification';
import { Loader2, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';

export const AdminPricingManager = () => {
  const { rules, isLoading, upsertRule, deactivateRule } = usePricingRules();
  const { toast } = useToast();

  const byCategory = useMemo(() => {
    const grouped: Record<ServiceCategory, PricingRule[]> = { transport: [], delivery: [] } as any;
    rules.forEach(r => grouped[r.service_type].push(r));
    return grouped;
  }, [rules]);

  const [editValues, setEditValues] = useState<Record<string, { base_price: number; price_per_km: number; price_per_minute: number; minimum_fare: number; surge_multiplier: number; currency: string }>>({});
  const [newRule, setNewRule] = useState({
    service_type: 'transport' as ServiceCategory,
    vehicle_class: '',
    base_price: 0,
    price_per_km: 0,
    price_per_minute: 0,
    minimum_fare: 0,
    surge_multiplier: 1.0,
    currency: 'CDF',
    city: 'Kinshasa'
  });
  const [deletingRule, setDeletingRule] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>();

  const handleSave = async (rule: PricingRule) => {
    const key = `${rule.service_type}:${rule.vehicle_class}`;
    const values = editValues[key];
    if (!values) return;
    
    try {
      await upsertRule.mutateAsync({
        service_type: rule.service_type,
        vehicle_class: rule.vehicle_class,
        base_price: values.base_price,
        price_per_km: values.price_per_km,
        price_per_minute: values.price_per_minute,
        minimum_fare: values.minimum_fare,
        surge_multiplier: values.surge_multiplier,
        currency: values.currency,
        city: rule.city
      });
      toast({ title: 'Tarif enregistré', description: `${rule.vehicle_class} (${rule.service_type}) mis à jour.` });
      setLastUpdate(new Date());
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!newRule.vehicle_class || !newRule.base_price || !newRule.price_per_km) return;
    try {
      await upsertRule.mutateAsync(newRule);
      toast({ 
        title: 'Règle ajoutée', 
        description: `${newRule.vehicle_class} (${newRule.service_type}) - Prix actualisé en temps réel` 
      });
      setNewRule({ 
        service_type: 'transport', 
        vehicle_class: '', 
        base_price: 0, 
        price_per_km: 0, 
        price_per_minute: 0,
        minimum_fare: 0,
        surge_multiplier: 1.0,
        currency: 'CDF', 
        city: 'Kinshasa' 
      });
      setLastUpdate(new Date());
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible d\'ajouter', variant: 'destructive' });
    }
  };

  const handleDelete = async (rule: PricingRule) => {
    if (deletingRule) return;
    setDeletingRule(rule.id);
    try {
      await deactivateRule.mutateAsync(rule.id);
      toast({ 
        title: 'Règle supprimée', 
        description: `${rule.vehicle_class} (${rule.service_type}) désactivée` 
      });
      setLastUpdate(new Date());
    } catch (e: any) {
      toast({ 
        title: 'Erreur', 
        description: e.message || 'Impossible de supprimer', 
        variant: 'destructive' 
      });
    } finally {
      setDeletingRule(null);
    }
  };

  const Row = ({ r }: { r: PricingRule }) => {
    const key = `${r.service_type}:${r.vehicle_class}`;
    const values = editValues[key] || { 
      base_price: r.base_price, 
      price_per_km: r.price_per_km, 
      price_per_minute: r.price_per_minute || 0,
      minimum_fare: r.minimum_fare || 0,
      surge_multiplier: r.surge_multiplier || 1,
      currency: r.currency 
    };
    const isDeleting = deletingRule === r.id;
    const isSaving = upsertRule.isPending;
    
    return (
      <div className="grid grid-cols-8 gap-2 items-center p-3 rounded-lg border border-border bg-card">
        <div className="col-span-2">
          <p className="text-sm font-medium text-card-foreground">{r.vehicle_class}</p>
          <p className="text-xs text-muted-foreground capitalize">{r.service_type}</p>
        </div>
        <Input
          type="number"
          value={values.base_price}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, base_price: parseFloat(e.target.value) || 0 } }))}
          placeholder="Base"
          disabled={isSaving || isDeleting}
          className="w-20"
        />
        <Input
          type="number"
          value={values.price_per_km}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, price_per_km: parseFloat(e.target.value) || 0 } }))}
          placeholder="/km"
          disabled={isSaving || isDeleting}
          className="w-20"
        />
        <Input
          type="number"
          value={values.price_per_minute}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, price_per_minute: parseFloat(e.target.value) || 0 } }))}
          placeholder="/min"
          disabled={isSaving || isDeleting}
          className="w-20"
        />
        <Input
          type="number"
          value={values.minimum_fare}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, minimum_fare: parseFloat(e.target.value) || 0 } }))}
          placeholder="Min"
          disabled={isSaving || isDeleting}
          className="w-20"
        />
        <Input
          type="number"
          step="0.1"
          value={values.surge_multiplier}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, surge_multiplier: parseFloat(e.target.value) || 1 } }))}
          placeholder="Surge"
          disabled={isSaving || isDeleting}
          className="w-20"
        />
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            onClick={() => handleSave(r)}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="destructive" 
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la règle de tarification pour <strong>{r.vehicle_class}</strong> ({r.service_type}) ?
                  <br /><br />
                  Cette action désactivera immédiatement la règle et affectera les calculs de prix en temps réel sur l'application client.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDelete(r)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PricingUpdateNotification lastUpdate={lastUpdate} />
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            Gestion des Tarifs
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Synchronisation temps réel
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des règles...
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3">Transport</h3>
                <div className="space-y-2">
                  {byCategory.transport.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune règle active.</p>
                  )}
                  {byCategory.transport.map(r => (
                    <Row key={r.id} r={r} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Livraison</h3>
                <div className="space-y-2">
                  {byCategory.delivery.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune règle active.</p>
                  )}
                  {byCategory.delivery.map(r => (
                    <Row key={r.id} r={r} />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">Ajouter une règle</h3>
                <div className="grid grid-cols-8 gap-2 items-center">
                  <Select value={newRule.service_type} onValueChange={(v: ServiceCategory) => setNewRule(prev => ({ ...prev, service_type: v }))}>
                    <SelectTrigger className="col-span-1">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="delivery">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="col-span-1"
                    placeholder="Code (ex: eco)"
                    value={newRule.vehicle_class}
                    onChange={(e) => setNewRule(prev => ({ ...prev, vehicle_class: e.target.value }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="Base"
                    value={newRule.base_price || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="/km"
                    value={newRule.price_per_km || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, price_per_km: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="/min"
                    value={newRule.price_per_minute || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, price_per_minute: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="Min"
                    value={newRule.minimum_fare || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, minimum_fare: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    step="0.1"
                    placeholder="Surge"
                    value={newRule.surge_multiplier || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, surge_multiplier: parseFloat(e.target.value) || 1 }))}
                  />
                  <Button className="col-span-1" onClick={handleCreate}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};