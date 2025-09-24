import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModernTracker from '@/components/tracking/ModernTracker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function UnifiedTracking() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  // Validation des paramètres
  if (!type || !id || !['delivery', 'taxi', 'marketplace'].includes(type)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-destructive/20 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Lien de suivi invalide</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vérifiez votre lien de suivi ou contactez le support.
                </p>
              </div>
              <Button onClick={() => navigate('/')} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ModernTracker 
      trackingId={id}
      trackingType={type as 'delivery' | 'taxi' | 'marketplace'}
      onBack={() => navigate('/')}
      enableRealtimeLocation={true}
    />
  );
}