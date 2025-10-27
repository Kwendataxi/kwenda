import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Car, Users, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ClientLoginForm } from "@/components/auth/ClientLoginForm";

const ClientAuth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header avec retour */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Button>
        </div>

        {/* Main Auth Card */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 space-y-4">
            <div className="flex justify-center">
              <BrandLogo size={80} />
            </div>
            <div>
              <h1 className="text-display-md mb-2">Bienvenue sur Kwenda</h1>
              <p className="text-body-md text-muted-foreground">
                Connectez-vous pour commander vos courses
              </p>
            </div>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-heading-lg text-center">Connexion Client</CardTitle>
              <CardDescription className="text-center">
                Accédez à vos services de transport, livraison et marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientLoginForm />
            </CardContent>
          </Card>

          {/* Section Prestataires */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <h3 className="text-heading-sm text-center mb-6">Vous êtes Prestataires ?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => navigate('/driver/auth')}
              >
                <Car className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Chauffeur</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-secondary/5 hover:border-secondary"
                onClick={() => navigate('/partner/auth')}
              >
                <Users className="w-6 h-6 text-secondary" />
                <span className="text-sm font-medium">Partenaire</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-accent/5 hover:border-accent"
                onClick={() => navigate('/restaurant/auth')}
              >
                <Store className="w-6 h-6 text-accent" />
                <span className="text-sm font-medium">Restaurant</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAuth;
