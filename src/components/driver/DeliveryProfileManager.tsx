/**
 * 📦 Gestion Profil Livraison
 * Capacité et documents pour livreurs uniquement
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, Bike } from 'lucide-react';
import { VehicleManagementPanel } from './management/VehicleManagementPanel';

export const DeliveryProfileManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        Profil Livraison
      </h2>

      {/* Gestion du véhicule de livraison */}
      <VehicleManagementPanel />

      {/* Capacité de livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Capacité de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📦 Type de véhicule : Moto, Voiture, Camionnette
          </p>
          {/* TODO: Ajouter sélecteur capacité */}
        </CardContent>
      </Card>

      {/* Documents livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents Livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📄 Autorisation transport de marchandises
          </p>
          {/* TODO: Ajouter composant upload documents */}
        </CardContent>
      </Card>
    </div>
  );
};
