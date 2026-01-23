import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceTogglePanel from '@/components/admin/ServiceTogglePanel';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ServiceAnalyticsDashboard } from '@/components/admin/analytics/ServiceAnalyticsDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ServiceManagementPanel = () => {
  const { configurations, loading, createService, updateService } = useServiceConfigurations();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    service_type: '',
    service_category: 'taxi' as any,
    display_name: '',
    description: '',
    is_active: true
  });

  const handleCreate = () => {
    createService({
      service_type: formData.service_type,
      service_category: formData.service_category,
      display_name: formData.display_name,
      description: formData.description || '',
      requirements: [],
      features: [],
      vehicle_requirements: {},
      is_active: formData.is_active
    });
    setIsCreateDialogOpen(false);
    setFormData({
      service_type: '',
      service_category: 'taxi',
      display_name: '',
      description: '',
      is_active: true
    });
  };

  const handleEdit = () => {
    if (selectedService) {
      updateService({
        id: selectedService.id,
        display_name: formData.display_name,
        description: formData.description,
        is_active: formData.is_active
      });
      setIsEditDialogOpen(false);
      setSelectedService(null);
    }
  };

  const openEditDialog = (service: any) => {
    setSelectedService(service);
    setFormData({
      service_type: service.service_type,
      service_category: service.service_category,
      display_name: service.display_name,
      description: service.description || '',
      is_active: service.is_active
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Services</h2>
          <p className="text-muted-foreground">
            Activez, désactivez et configurez les services de la plateforme
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau service</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau service à la plateforme
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(value: any) => setFormData({ ...formData, service_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxi">Taxi / VTC</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="rental">Location</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="food">Food Delivery</SelectItem>
                    <SelectItem value="lottery">Tombola</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de service</Label>
                <Input
                  placeholder="ex: taxi-bus, moto-taxi, vip"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                />
              </div>

              <div>
                <Label>Nom d'affichage</Label>
                <Input
                  placeholder="ex: Taxi Bus"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Description du service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Service actif</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="quick-view" className="w-full">
        <TabsList>
          <TabsTrigger value="quick-view">Vue rapide</TabsTrigger>
          <TabsTrigger value="detailed">Configuration détaillée</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-view" className="space-y-4">
          <ServiceTogglePanel />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4">
            {configurations.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{service.display_name}</CardTitle>
                      <CardDescription>
                        {service.service_category} - {service.service_type}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={(checked) => {
                          updateService({ id: service.id, is_active: checked });
                        }}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {configurations.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.display_name}</CardTitle>
                <CardDescription>Statistiques et métriques du service</CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceAnalyticsDashboard service={service} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le service</DialogTitle>
            <DialogDescription>
              Modifiez les informations du service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom d'affichage</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Service actif</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
