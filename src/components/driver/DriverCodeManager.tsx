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
    <div className="max-w-md mx-auto space-y-4">
      {/* Driver Code Section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Code Partenaire</h3>
        </div>
        
        {driverCode ? (
          <div className="space-y-3">
            <div className="bg-card rounded-lg p-4 border border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Votre code unique</p>
                <p className="text-xl font-mono font-bold text-primary tracking-wider">
                  {driverCode.code}
                </p>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-200 bg-green-50">
                  ✓ Actif
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyCode}
                className="h-9"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copier
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareCode}
                className="h-9"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Partager
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <QrCode className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Générez votre code pour rejoindre une flotte
            </p>
            <Button 
              onClick={generateCode} 
              disabled={loading}
              size="sm"
              className="w-full"
            >
              {loading ? 'Génération...' : 'Générer mon code'}
            </Button>
          </div>
        )}
      </div>

      {/* Partner Status */}
      {partnerAssignment ? (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Partenaire Actuel</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">
                  {partnerAssignment.partner_name}
                </p>
                <p className="text-sm text-green-600">
                  Commission: {partnerAssignment.commission_rate}%
                </p>
                <p className="text-xs text-green-600">
                  Depuis {new Date(partnerAssignment.added_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Actif
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Statut Partenaire</h3>
          </div>
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground mb-1">
              Aucun partenaire assigné
            </p>
            <p className="text-xs text-muted-foreground">
              Partagez votre code pour rejoindre une flotte
            </p>
          </div>
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h3 className="font-semibold text-foreground mb-3">Guide rapide</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
              1
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Générez votre code unique
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
              2
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Partagez-le avec un partenaire
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
              3
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rejoignez sa flotte et commencez à gagner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};