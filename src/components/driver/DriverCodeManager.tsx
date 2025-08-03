import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, QrCode, UserCheck } from 'lucide-react';
import { useDriverCode } from '@/hooks/useDriverCode';
import { useLanguage } from '@/contexts/LanguageContext';

export const DriverCodeManager = () => {
  const { t } = useLanguage();
  const { 
    loading, 
    driverCode, 
    partnerAssignment, 
    generateCode, 
    shareCode, 
    copyCode 
  } = useDriverCode();

  return (
    <div className="space-y-6">
      {/* Driver Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Mon Code Partenaire
          </CardTitle>
          <CardDescription>
            Partagez ce code avec un partenaire pour rejoindre sa flotte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {driverCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Votre code unique</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {driverCode.code}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Actif
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyCode}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={shareCode}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de code partenaire
              </p>
              <Button 
                onClick={generateCode} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Génération...' : 'Générer mon code'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Assignment Section */}
      {partnerAssignment ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Partenaire Actuel
            </CardTitle>
            <CardDescription>
              Vous êtes rattaché à un partenaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium text-green-800">
                  {partnerAssignment.partner_name}
                </p>
                <p className="text-sm text-green-600">
                  Commission: {partnerAssignment.commission_rate}%
                </p>
                <p className="text-xs text-green-600">
                  Depuis le {new Date(partnerAssignment.added_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Actif
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Statut Partenaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  Vous n'êtes pas encore rattaché à un partenaire
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Partagez votre code avec un partenaire pour commencer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Générez votre code unique de 8 caractères
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              Partagez ce code avec le partenaire de votre choix
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              Le partenaire vous ajoute à sa flotte avec un taux de commission
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              4
            </div>
            <p className="text-sm text-muted-foreground">
              Vous recevez vos gains automatiquement après chaque course
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};