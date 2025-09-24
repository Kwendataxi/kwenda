import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus } from 'lucide-react';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { AddressShortcutButton } from './AddressShortcutButton';

export const QuickAddressSelector = () => {
  const { addresses, isLoading } = useSavedAddresses();
  
  // Obtenir les 3 adresses les plus utilisées
  const topAddresses = [...addresses]
    .sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (b.usage_count || 0) - (a.usage_count || 0);
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="p-4">
          <div className="animate-pulse flex space-x-2">
            <div className="rounded-full bg-muted h-4 w-4"></div>
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-2 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Adresses récentes</h3>
        <AddressShortcutButton variant="ghost" size="sm" showIcon={false} />
      </div>
      
      {topAddresses.length > 0 ? (
        <div className="space-y-2">
          {topAddresses.map((address) => (
            <Card key={address.id} className="bg-card border border-border hover:bg-accent/50 cursor-pointer transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{address.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{address.address_line}</p>
                  </div>
                  {address.is_default && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border border-border">
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">Aucune adresse sauvegardée</p>
            <AddressShortcutButton variant="outline" size="sm" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};