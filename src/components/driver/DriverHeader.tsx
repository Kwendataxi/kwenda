import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Car, Package } from 'lucide-react';

interface DriverHeaderProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({ serviceType }) => {
  const Icon = serviceType === 'taxi' ? Car : Package;

  return (
    <header className="mb-3">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-primary/5 border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-none">Espace Chauffeur</h1>
              <p className="text-xs text-muted-foreground">Moderne, fluide et simple d'utilisation</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {serviceType === 'taxi' ? 'Taxi' : serviceType === 'delivery' ? 'Livraison' : 'Chauffeur'}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default DriverHeader;
