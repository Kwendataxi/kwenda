import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePricingRules, ServiceCategory, PricingRule } from '@/hooks/usePricingRules';
import { Loader2, Save, Plus } from 'lucide-react';

export const AdminPricingManager = () => {
  const { rules, isLoading, upsertRule } = usePricingRules();
  const { toast } = useToast();

  const byCategory = useMemo(() => {
    const grouped: Record<ServiceCategory, PricingRule[]> = { transport: [], delivery: [] } as any;
    rules.forEach(r => grouped[r.service_type].push(r));
    return grouped;
  }, [rules]);

  const [editValues, setEditValues] = useState<Record<string, { base_price: string; price_per_km: string; currency: string }>>({});
  const [newRule, setNewRule] = useState<{ service_type: ServiceCategory; vehicle_class: string; base_price: string; price_per_km: string; currency: string }>({
    service_type: 'transport', vehicle_class: '', base_price: '', price_per_km: '', currency: 'CDF'
  });

  const handleSave = async (service_type: ServiceCategory, vehicle_class: string) => {
    const key = `${service_type}:${vehicle_class}`;
    const values = editValues[key];
    try {
      await upsertRule.mutateAsync({
        service_type,
        vehicle_class,
        base_price: Number(values.base_price),
        price_per_km: Number(values.price_per_km),
        currency: values.currency || 'CDF'
      });
      toast({ title: 'Tarif enregistré', description: `${vehicle_class} (${service_type}) mis à jour.` });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!newRule.vehicle_class || !newRule.base_price || !newRule.price_per_km) return;
    try {
      await upsertRule.mutateAsync({
        service_type: newRule.service_type,
        vehicle_class: newRule.vehicle_class,
        base_price: Number(newRule.base_price),
        price_per_km: Number(newRule.price_per_km),
        currency: newRule.currency || 'CDF'
      });
      toast({ title: 'Règle ajoutée', description: `${newRule.vehicle_class} (${newRule.service_type})` });
      setNewRule({ service_type: 'transport', vehicle_class: '', base_price: '', price_per_km: '', currency: 'CDF' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible d\'ajouter', variant: 'destructive' });
    }
  };

  const Row = ({ r }: { r: PricingRule }) => {
    const key = `${r.service_type}:${r.vehicle_class}`;
    const values = editValues[key] || { base_price: String(r.base_price), price_per_km: String(r.price_per_km), currency: r.currency };
    return (
      <div className="grid grid-cols-5 gap-3 items-center p-3 rounded-lg border border-border">
        <div className="col-span-2">
          <p className="text-sm font-medium">{r.vehicle_class}</p>
          <p className="text-xs text-muted-foreground capitalize">{r.service_type}</p>
        </div>
        <Input
          type="number"
          value={values.base_price}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, base_price: e.target.value } }))}
          placeholder="Base"
        />
        <Input
          type="number"
          value={values.price_per_km}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, price_per_km: e.target.value } }))}
          placeholder="/km"
        />
        <div className="flex items-center gap-2">
          <Input
            className="w-24"
            value={values.currency}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, currency: e.target.value } }))}
          />
          <Button size="sm" onClick={() => handleSave(r.service_type, r.vehicle_class)}>
            <Save className="w-4 h-4 mr-1" />
            Sauver
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">Gestion des Tarifs</CardTitle>
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
                <div className="grid grid-cols-6 gap-3 items-center">
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
                    placeholder="Code (ex: eco, premium, flash)"
                    value={newRule.vehicle_class}
                    onChange={(e) => setNewRule(prev => ({ ...prev, vehicle_class: e.target.value }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="Base"
                    value={newRule.base_price}
                    onChange={(e) => setNewRule(prev => ({ ...prev, base_price: e.target.value }))}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="/km"
                    value={newRule.price_per_km}
                    onChange={(e) => setNewRule(prev => ({ ...prev, price_per_km: e.target.value }))}
                  />
                  <Input
                    className="col-span-1"
                    placeholder="Devise"
                    value={newRule.currency}
                    onChange={(e) => setNewRule(prev => ({ ...prev, currency: e.target.value }))}
                  />
                  <Button className="col-span-1" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
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
