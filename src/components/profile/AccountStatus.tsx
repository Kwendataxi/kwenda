import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useUserVerification } from '@/hooks/useUserVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Shield, Store } from 'lucide-react';

export const AccountStatus = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { verification, loading: verificationLoading, getVerificationProgress } = useUserVerification();

  if (profileLoading || verificationLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = getVerificationProgress();
  const canSell = verification?.phone_verified && verification?.verification_level !== 'none';

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          Statut du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut général */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.user_type === 'client' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            )}
            <span className="font-medium">Compte {profile?.user_type || 'client'}</span>
          </div>
          <Badge variant={profile?.user_type === 'client' ? 'default' : 'secondary'}>
            {profile?.user_type === 'client' ? 'Actif' : 'En configuration'}
          </Badge>
        </div>

        {/* Progression de vérification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Vérification</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Statut de vente */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Autorisation de vente</span>
          </div>
          <Badge variant={canSell ? 'default' : 'secondary'}>
            {canSell ? 'Autorisé' : 'Vérification requise'}
          </Badge>
        </div>

        {/* Actions rapides */}
        {!canSell && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Complétez la vérification de votre téléphone et téléchargez une pièce d'identité pour vendre sur la marketplace.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};