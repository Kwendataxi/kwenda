import React from 'react';
import { useUserVerification } from '@/hooks/useUserVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface VerifiedSellerGuardProps {
  children: React.ReactNode;
}

export const VerifiedSellerGuard: React.FC<VerifiedSellerGuardProps> = ({ children }) => {
  const { verification, loading, isVerifiedForSelling, getVerificationProgress } = useUserVerification();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isVerifiedForSelling()) {
    return <>{children}</>;
  }

  const progress = getVerificationProgress();

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Shield className="w-5 h-5" />
            Vérification de compte requise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700">
            Pour vendre sur notre marketplace, vous devez vérifier votre compte. 
            Cela garantit la sécurité et la confiance de tous nos utilisateurs.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression de la vérification</span>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Étapes de vérification :</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
                {verification?.phone_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Phone className="w-5 h-5 text-gray-400" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">Vérification du téléphone</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmez votre numéro de téléphone par SMS
                  </p>
                </div>
                <Badge variant={verification?.phone_verified ? "default" : "secondary"}>
                  {verification?.phone_verified ? "Vérifié" : "En attente"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
                {verification?.identity_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">Vérification d'identité</p>
                  <p className="text-xs text-muted-foreground">
                    Uploadez une pièce d'identité valide
                  </p>
                </div>
                <Badge variant={verification?.identity_verified ? "default" : "secondary"}>
                  {verification?.identity_verified ? "Vérifié" : "En attente"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => window.location.href = '#security'}>
              <Shield className="w-4 h-4 mr-2" />
              Commencer la vérification
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              La vérification prend généralement 24-48 heures
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pourquoi vérifier mon compte ?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Protection contre la fraude</li>
                <li>• Accès à toutes les fonctionnalités de vente</li>
                <li>• Badge de vendeur vérifié</li>
                <li>• Confiance accrue des acheteurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};