import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Edit, Trash2, Home, Building, Star } from 'lucide-react';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';

export const SavedAddressesSection = () => {
  const { 
    addresses, 
    saveAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress,
    getAddressesByType,
    isLoading 
  } = useSavedAddresses();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    city: 'Kinshasa',
    commune: '',
    quartier: '',
    address_type: 'personal' as 'personal' | 'business',
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      label: '',
      address_line: '',
      city: 'Kinshasa',
      commune: '',
      quartier: '',
      address_type: 'personal',
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleSave = async () => {
    if (editingAddress) {
      await updateAddress(editingAddress.id, formData);
    } else {
      await saveAddress(formData);
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address_line: address.address_line,
      city: address.city,
      commune: address.commune || '',
      quartier: address.quartier || '',
      address_type: address.address_type,
      is_default: address.is_default,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      await deleteAddress(id);
    }
  };

  const AddressCard = ({ address }: { address: any }) => (
    <Card className={`relative ${address.is_default ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {address.address_type === 'business' ? (
                <Building className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Home className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium">{address.label}</h4>
                {address.is_default && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Par défaut
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{address.address_line}</p>
              <p className="text-xs text-muted-foreground">
                {[address.quartier, address.commune, address.city].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {!address.is_default && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDefaultAddress(address.id)}
                className="h-8 w-8 p-0"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(address)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(address.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mes Adresses</CardTitle>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                  </DialogTitle>
                  <DialogDescription>
                    Ajoutez vos adresses fréquentes pour un accès rapide
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="label">Nom de l'adresse</Label>
                    <Input
                      id="label"
                      placeholder="Ex: Maison, Bureau, Gym..."
                      value={formData.label}
                      onChange={(e) => setFormData({...formData, label: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Adresse complète</Label>
                    <Input
                      id="address"
                      placeholder="Numéro, avenue, rue..."
                      value={formData.address_line}
                      onChange={(e) => setFormData({...formData, address_line: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commune">Commune</Label>
                      <Input
                        id="commune"
                        placeholder="Ex: Gombe"
                        value={formData.commune}
                        onChange={(e) => setFormData({...formData, commune: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quartier">Quartier</Label>
                      <Input
                        id="quartier"
                        placeholder="Ex: Socimat"
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="type">Type d'adresse</Label>
                    <Select value={formData.address_type} onValueChange={(value: 'personal' | 'business') => setFormData({...formData, address_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personnelle</SelectItem>
                        <SelectItem value="business">Professionnelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="default" className="text-sm">
                      Définir comme adresse par défaut
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={!formData.label || !formData.address_line}>
                      {editingAddress ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Gérez vos adresses sauvegardées pour des commandes plus rapides
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-4">
              {/* Adresses personnelles */}
              {getAddressesByType('personal').length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Adresses personnelles
                  </h4>
                  <div className="space-y-3">
                    {getAddressesByType('personal').map((address) => (
                      <AddressCard key={address.id} address={address} />
                    ))}
                  </div>
                </div>
              )}

              {/* Adresses professionnelles */}
              {getAddressesByType('business').length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Adresses professionnelles
                  </h4>
                  <div className="space-y-3">
                    {getAddressesByType('business').map((address) => (
                      <AddressCard key={address.id} address={address} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucune adresse sauvegardée</p>
              <p className="text-xs">Ajoutez vos adresses fréquentes pour gagner du temps</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};