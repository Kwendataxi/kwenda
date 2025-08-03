import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Edit, Trash2, Phone, User } from 'lucide-react';
import { usePartnerDrivers } from '@/hooks/usePartnerDrivers';
import { useLanguage } from '@/contexts/LanguageContext';

export const PartnerDriverManager = () => {
  const { t } = useLanguage();
  const { 
    loading, 
    drivers, 
    addingDriver, 
    addDriverByCode, 
    updateDriverCommission, 
    removeDriver 
  } = usePartnerDrivers();

  const [newDriverCode, setNewDriverCode] = useState('');
  const [newCommissionRate, setNewCommissionRate] = useState(15);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [editCommission, setEditCommission] = useState(15);

  const handleAddDriver = async () => {
    if (newDriverCode.length !== 8) {
      return;
    }

    const success = await addDriverByCode(newDriverCode, newCommissionRate);
    if (success) {
      setNewDriverCode('');
      setNewCommissionRate(15);
      setShowAddDialog(false);
    }
  };

  const handleUpdateCommission = async (driverId: string) => {
    const success = await updateDriverCommission(driverId, editCommission);
    if (success) {
      setEditingDriver(null);
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    await removeDriver(driverId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Chauffeurs</h2>
          <p className="text-muted-foreground">
            Gérez votre flotte de chauffeurs et leurs commissions
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau chauffeur</DialogTitle>
              <DialogDescription>
                Entrez le code unique du chauffeur et définissez son taux de commission
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
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  min="5"
                  max="50"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Pourcentage que vous recevrez sur chaque course
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Chauffeurs Actifs
                </p>
                <p className="text-2xl font-bold">
                  {drivers.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">%</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Commission Moyenne
                </p>
                <p className="text-2xl font-bold">
                  {drivers.length > 0 
                    ? (drivers.reduce((acc, d) => acc + d.commission_rate, 0) / drivers.length).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">FC</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Revenus du Mois
                </p>
                <p className="text-2xl font-bold">0 FC</p>
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
            <div className="space-y-4">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.driver_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Code: {driver.driver_code}</span>
                        {driver.driver_phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {driver.driver_phone}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(driver.added_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {editingDriver === driver.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="5"
                            max="50"
                            value={editCommission}
                            onChange={(e) => setEditCommission(Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCommission(driver.id)}
                          >
                            OK
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDriver(null)}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{driver.commission_rate}%</p>
                          <p className="text-xs text-muted-foreground">Commission</p>
                        </div>
                      )}
                    </div>
                    
                    <Badge 
                      variant={driver.status === 'active' ? 'default' : 'secondary'}
                    >
                      {driver.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDriver(driver.id);
                          setEditCommission(driver.commission_rate);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveDriver(driver.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};