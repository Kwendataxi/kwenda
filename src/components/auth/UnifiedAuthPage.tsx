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
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center animate-scale-in">
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
        <Card className="glass border-primary/10 animate-fade-up" style={{ animationDelay: '200ms' }}>
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
        <div className="text-center space-y-3 py-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <p className="text-sm font-medium text-muted-foreground">
            Vous êtes professionnel ?
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-xs hover:bg-secondary/10 hover:text-secondary transition-colors"
              onClick={() => navigate('/driver/auth')}
            >
              <Car className="h-3.5 w-3.5" />
              Chauffeur
            </Button>
            <span className="text-muted-foreground/50">•</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-xs hover:bg-accent/10 hover:text-accent transition-colors"
              onClick={() => navigate('/partner/auth')}
            >
              <Handshake className="h-3.5 w-3.5" />
              Partenaire
            </Button>
            <span className="text-muted-foreground/50">•</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-xs hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30 transition-colors"
              onClick={() => navigate('/restaurant/auth')}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Restaurant
            </Button>
          </div>
        </div>

        {/* Footer - Bouton Retour à l'accueil */}
        <div className="mt-8 pt-6 border-t border-border/30 pb-8 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col items-center gap-3">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="default"
              className="group relative overflow-hidden w-full sm:w-auto sm:min-w-[200px] border-border/50 hover:border-primary/50 hover:shadow-md dark:border-border/30 dark:hover:border-primary/40 dark:hover:bg-primary/5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ArrowLeft className="h-4 w-4 mr-2 relative z-10 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="relative z-10 font-medium">Retour à l'accueil</span>
            </Button>
            
            <p className="text-xs text-muted-foreground text-center px-4">
              Découvrez nos services sans vous connecter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
