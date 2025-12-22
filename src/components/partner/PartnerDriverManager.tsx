import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Trash2, Phone, User, Car, Percent, Settings } from 'lucide-react';
import { usePartnerDrivers } from '@/hooks/usePartnerDrivers';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DriverCommissionRateDialog } from './DriverCommissionRateDialog';

export const PartnerDriverManager = () => {
  const { t } = useLanguage();
  const { 
    loading, 
    drivers, 
    addingDriver, 
    addDriverByCode, 
    removeDriver,
    fetchPartnerDrivers
  } = usePartnerDrivers();

  const [newDriverCode, setNewDriverCode] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assignedVehicles, setAssignedVehicles] = useState<Record<string, any>>({});
  const [commissionDialogDriver, setCommissionDialogDriver] = useState<{
    id: string;
    driver_id: string;
    driver_name: string;
    commission_rate?: number;
  } | null>(null);

  // Charger les véhicules assignés
  useEffect(() => {
    loadAssignedVehicles();
  }, [drivers]);

  const loadAssignedVehicles = async () => {
    if (drivers.length === 0) return;

    const driverIds = drivers.map(d => d.id);
    const { data } = await supabase
      .from('partner_taxi_vehicles')
      .select('assigned_driver_id, name, license_plate')
      .in('assigned_driver_id', driverIds);

    if (data) {
      const vehicleMap: Record<string, any> = {};
      data.forEach(v => {
        if (v.assigned_driver_id) {
          vehicleMap[v.assigned_driver_id] = v;
        }
      });
      setAssignedVehicles(vehicleMap);
    }
  };

  const handleAddDriver = async () => {
    if (newDriverCode.length !== 8) {
      return;
    }

    const success = await addDriverByCode(newDriverCode);
    if (success) {
      setNewDriverCode('');
      setShowAddDialog(false);
    }
  };

  const handleRemoveDriver = async (assignmentId: string, driverId: string) => {
    await removeDriver(assignmentId, driverId);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Gestion des Chauffeurs</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez votre flotte de chauffeurs et leurs abonnements
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ajouter un chauffeur</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau chauffeur</DialogTitle>
              <DialogDescription>
                Entrez le code unique du chauffeur pour l'ajouter à votre flotte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver-code">Code Chauffeur (8 caractères)</Label>
                <Input
                  id="driver-code"
                  placeholder="Ex: ABC123XY"
                  value={newDriverCode}
                  onChange={(e) => setNewDriverCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Le chauffeur doit vous communiquer son code unique
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAddDriver}
                disabled={newDriverCode.length !== 8 || addingDriver}
              >
                {addingDriver ? 'Ajout...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="card-modern">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Chauffeurs Actifs
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {drivers.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-modern">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-green-600">5%</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Gains Abonnements
                </p>
                <p className="text-xl sm:text-2xl font-bold">0 CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-modern sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-blue-600">CDF</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Revenus du Mois
                </p>
                <p className="text-xl sm:text-2xl font-bold">0 CDF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Chauffeurs</CardTitle>
          <CardDescription>
            Liste de tous les chauffeurs de votre flotte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucun chauffeur dans votre flotte
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter votre premier chauffeur
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{driver.driver_name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="font-mono">Code: {driver.driver_code}</span>
                          {driver.driver_phone && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate">{driver.driver_phone}</span>
                              </span>
                            </>
                          )}
                        </div>
                        {assignedVehicles[driver.id] && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                            <Car className="h-3 w-3" />
                            <span>
                              {assignedVehicles[driver.id].name} ({assignedVehicles[driver.id].license_plate})
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Ajouté le {new Date(driver.added_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {/* Commission badge */}
                    <button 
                      onClick={() => setCommissionDialogDriver({
                        id: driver.id,
                        driver_id: driver.driver_id,
                        driver_name: driver.driver_name || 'Chauffeur',
                        commission_rate: driver.commission_rate
                      })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                    >
                      <Percent className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {driver.commission_rate ?? 2.5}%
                      </span>
                      <Settings className="h-3 w-3 text-green-600/50 dark:text-green-400/50" />
                    </button>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <Badge 
                        variant={driver.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {driver.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveDriver(driver.id, driver.driver_id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de configuration du taux de commission */}
      <DriverCommissionRateDialog
        open={!!commissionDialogDriver}
        onOpenChange={(open) => !open && setCommissionDialogDriver(null)}
        driver={commissionDialogDriver}
        onSuccess={fetchPartnerDrivers}
      />
    </div>
  );
};