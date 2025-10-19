/**
 * 🚗 Gestion Profil VTC
 * Documents et véhicule pour chauffeurs VTC uniquement
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, FileText, Shield } from 'lucide-react';
import { VehicleManagementPanel } from './management/VehicleManagementPanel';

export const VTCProfileManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Car className="h-5 w-5 text-orange-600" />
        Profil VTC
      </h2>

      {/* Gestion du véhicule VTC */}
      <VehicleManagementPanel />

      {/* Documents VTC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents VTC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📄 Permis de conduire, assurance, carte grise à jour
          </p>
          {/* TODO: Ajouter composant upload documents */}
        </CardContent>
      </Card>
    </div>
  );
};
