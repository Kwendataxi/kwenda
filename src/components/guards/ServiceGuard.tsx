import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceConfigurations, ServiceCategory } from '@/hooks/useServiceConfigurations';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ServiceGuardProps {
  serviceCategory: ServiceCategory;
  children: ReactNode;
  fallbackRoute?: string;
}

export const ServiceGuard = ({ serviceCategory, children, fallbackRoute = '/' }: ServiceGuardProps) => {
  const { configurations, loading } = useServiceConfigurations();
  const navigate = useNavigate();
  const [isServiceActive, setIsServiceActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && configurations.length > 0) {
      const service = configurations.find(
        c => c.service_category === serviceCategory && c.is_active
      );
      setIsServiceActive(!!service);
    }
  }, [configurations, loading, serviceCategory]);

  // Afficher un loader pendant la vérification
  if (loading || isServiceActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si le service est inactif, afficher un message d'indisponibilité
  if (!isServiceActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Service temporairement indisponible
            </h2>
            <p className="text-muted-foreground">
              Le service <strong className="text-foreground capitalize">{serviceCategory}</strong> est actuellement désactivé.
              <br />
              Veuillez réessayer plus tard ou contacter le support.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate(fallbackRoute)}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
            
            <Button
              onClick={() => navigate('/support')}
              variant="outline"
              className="w-full"
            >
              Contacter le support
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Si le service est actif, afficher le contenu
  return <>{children}</>;
};
