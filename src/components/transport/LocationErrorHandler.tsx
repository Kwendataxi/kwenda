import React from 'react';
import { AlertTriangle, Settings, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onManualLocation: () => void;
  onSearchAddress: () => void;
  loading?: boolean;
}

export const LocationErrorHandler = ({
  error,
  onRetry,
  onManualLocation,
  onSearchAddress,
  loading = false
}: LocationErrorHandlerProps) => {
  const { t } = useLanguage();

  const getErrorContent = () => {
    if (error.includes('Permission')) {
      return {
        icon: <Settings className="h-12 w-12 text-orange-500" />,
        title: 'Permission requise',
        description: 'Activez la géolocalisation dans les paramètres de votre navigateur',
        actions: [
          { label: 'Réessayer', action: onRetry, variant: 'default' as const },
          { label: 'Sélectionner sur carte', action: onManualLocation, variant: 'outline' as const }
        ]
      };
    }

    if (error.includes('HTTPS')) {
      return {
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        title: 'Connexion non sécurisée',
        description: 'La géolocalisation nécessite une connexion HTTPS',
        actions: [
          { label: 'Sélectionner manuellement', action: onManualLocation, variant: 'default' as const }
        ]
      };
    }

    return {
      icon: <MapPin className="h-12 w-12 text-blue-500" />,
      title: 'Position indisponible',
      description: 'Difficultés à obtenir votre position. Choisissez une alternative',
      actions: [
        { label: 'Réessayer', action: onRetry, variant: 'default' as const },
        { label: 'Rechercher une adresse', action: onSearchAddress, variant: 'outline' as const },
        { label: 'Sélectionner sur carte', action: onManualLocation, variant: 'outline' as const }
      ]
    };
  };

  const content = getErrorContent();

  return (
    <Card className="mx-4 my-6">
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          {content.icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {content.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              disabled={loading}
              className="w-full"
            >
              {loading && index === 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Recherche...
                </div>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Search className="h-3 w-3" />
          <span>Vous pouvez aussi taper directement une adresse</span>
        </div>
      </CardContent>
    </Card>
  );
};