import React from 'react';
import { Building2, Mail, Phone, MapPin, Shield, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export const PartnerProfileHeader: React.FC = () => {
  const { user } = useAuth();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="card-floating p-6 animate-pulse">
        <div className="h-24 bg-muted rounded-lg" />
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationBadge = () => {
    switch (partner?.verification_status) {
      case 'verified':
        return <Badge className="bg-green-500">Vérifié</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Non vérifié</Badge>;
    }
  };

  return (
    <Card className="card-floating p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar et Upload */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            <AvatarImage src={''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {partner?.company_name ? getInitials(partner.company_name) : 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-body-sm text-muted-foreground">Logo entreprise</p>
          </div>
        </div>

        {/* Informations principales */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h2 className="text-heading-lg font-bold text-card-foreground">
                {partner?.company_name || 'Entreprise'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getVerificationBadge()}
                {partner?.is_active ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Inactif
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-body-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{partner?.email || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{partner?.phone_number || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{partner?.business_type || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {partner?.service_areas?.join(', ') || 'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-body-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Statut: <span className="font-medium text-card-foreground">{partner?.verification_status || 'Pending'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Membre depuis: <span className="font-medium text-card-foreground">
                  {partner?.created_at ? format(new Date(partner.created_at), 'MMM yyyy') : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
