import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ClientLoginForm } from "./ClientLoginForm";
import { DriverLoginForm } from "./DriverLoginForm";
import { PartnerLoginForm } from "./PartnerLoginForm";
import { RestaurantLoginForm } from "./RestaurantLoginForm";
import { User, Car, Handshake, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const UnifiedAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('role') || 'client';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <BrandLogo size={64} />
          </div>
          
          <div>
            <h1 className="text-display-sm lg:text-display-md bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Bienvenue sur Kwenda
            </h1>
            <p className="text-body-md text-muted-foreground mt-2">
              Choisissez votre espace pour vous connecter
            </p>
          </div>
        </div>

        {/* Auth Tabs */}
        <Card className="glass border-primary/10">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-3 gap-3">
              <TabsTrigger 
                value="client" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-white"
              >
                <User className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Client</span>
              </TabsTrigger>
              <TabsTrigger 
                value="driver"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-accent data-[state=active]:text-white"
              >
                <Car className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Chauffeur</span>
              </TabsTrigger>
              <TabsTrigger 
                value="partner"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white"
              >
                <Handshake className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Partenaire</span>
              </TabsTrigger>
              <TabsTrigger 
                value="restaurant"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
              >
                <UtensilsCrossed className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Restaurant</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="client" className="mt-0">
                <ClientLoginForm />
              </TabsContent>

              <TabsContent value="driver" className="mt-0">
                <DriverLoginForm />
              </TabsContent>

              <TabsContent value="partner" className="mt-0">
                <PartnerLoginForm />
              </TabsContent>

              <TabsContent value="restaurant" className="mt-0">
                <RestaurantLoginForm />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Quick Links */}
        <div className="text-center text-sm text-muted-foreground space-y-3">
          <p className="font-medium text-foreground text-base">
            Vous êtes Prestataires ?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 hover:bg-secondary/10"
              onClick={() => navigate('/driver/auth')}
            >
              <Car className="h-4 w-4" />
              Espace Chauffeur
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 hover:bg-accent/10"
              onClick={() => navigate('/partner/auth')}
            >
              <Handshake className="h-4 w-4" />
              Espace Partenaire
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              onClick={() => navigate('/restaurant/auth')}
            >
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
              Espace Restaurant
            </Button>
          </div>
        </div>

        {/* Bouton Retour à l'accueil en bas */}
        <div className="text-center mt-8 pb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};
