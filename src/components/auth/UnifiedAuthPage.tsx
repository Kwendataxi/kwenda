import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ClientLoginForm } from "./ClientLoginForm";
import { DriverLoginForm } from "./DriverLoginForm";
import { PartnerLoginForm } from "./PartnerLoginForm";
import { RestaurantLoginForm } from "./RestaurantLoginForm";
import { User, Car, Handshake, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KwendaPayLogo } from "@/components/brand/KwendaPayLogo";

export const UnifiedAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('role') || 'client';

  return (
    <div className="min-h-screen wallet-congo-pattern auth-congo-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center animate-congo-pulse">
            <KwendaPayLogo variant="full" size="lg" animated />
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
        <Card className="auth-glass shadow-[0_8px_30px_hsl(var(--congo-red)/0.1)] dark:shadow-[0_8px_40px_hsl(var(--congo-red)/0.2)] animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-3 gap-3 dark:bg-muted/40">
              <TabsTrigger 
                value="client" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-red data-[state=active]:to-congo-red-vibrant data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:shadow-[0_4px_20px_hsl(var(--congo-red)/0.3)] hover:bg-congo-red/10 dark:hover:bg-congo-red/10"
              >
                <User className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Client</span>
              </TabsTrigger>
              <TabsTrigger 
                value="driver"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-blue data-[state=active]:to-congo-blue-vibrant data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:shadow-[0_4px_20px_hsl(var(--congo-blue)/0.3)] hover:bg-congo-blue/10 dark:hover:bg-congo-blue/10"
              >
                <Car className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Chauffeur</span>
              </TabsTrigger>
              <TabsTrigger 
                value="partner"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-yellow data-[state=active]:to-congo-yellow-vibrant data-[state=active]:text-foreground data-[state=active]:shadow-lg dark:data-[state=active]:shadow-[0_4px_20px_hsl(var(--congo-yellow)/0.3)] hover:bg-congo-yellow/10 dark:hover:bg-congo-yellow/10"
              >
                <Handshake className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Partenaire</span>
              </TabsTrigger>
              <TabsTrigger 
                value="restaurant"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-green data-[state=active]:to-congo-green-vibrant data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:shadow-[0_4px_20px_hsl(var(--congo-green)/0.3)] hover:bg-congo-green/10 dark:hover:bg-congo-green/10"
              >
                <UtensilsCrossed className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Restaurant</span>
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
              className="gap-1.5 text-xs hover:bg-congo-blue/10 hover:text-congo-blue transition-all duration-300 rounded-xl"
              onClick={() => navigate('/driver/auth')}
            >
              <Car className="h-3.5 w-3.5" />
              Chauffeur
            </Button>
            <span className="text-muted-foreground/50">•</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-xs hover:bg-congo-yellow/10 hover:text-congo-yellow-vibrant transition-all duration-300 rounded-xl"
              onClick={() => navigate('/partner/auth')}
            >
              <Handshake className="h-3.5 w-3.5" />
              Partenaire
            </Button>
            <span className="text-muted-foreground/50">•</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-xs hover:bg-congo-green/10 hover:text-congo-green transition-all duration-300 rounded-xl"
              onClick={() => navigate('/restaurant/auth')}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Restaurant
            </Button>
          </div>
        </div>

        {/* Footer - Repositionné tout en bas */}
        <div className="mt-auto pt-8 pb-6 flex justify-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1.5" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};
