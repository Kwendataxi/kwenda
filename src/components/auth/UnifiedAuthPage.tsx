import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ClientLogin } from "./ClientLogin";
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
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-2 gap-2">
              <TabsTrigger 
                value="client" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-white"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Client</span>
              </TabsTrigger>
              <TabsTrigger 
                value="driver"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-accent data-[state=active]:text-white"
              >
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Chauffeur</span>
              </TabsTrigger>
              <TabsTrigger 
                value="partner"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white"
              >
                <Handshake className="h-4 w-4" />
                <span className="hidden sm:inline">Partenaire</span>
              </TabsTrigger>
              <TabsTrigger 
                value="restaurant"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span className="hidden sm:inline">Restaurant</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="client" className="mt-0">
                <ClientLogin />
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
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Vous êtes un restaurant ? 
            <Button 
              variant="link" 
              className="text-orange-500 hover:text-orange-600 px-2"
              onClick={() => navigate('/restaurant/auth')}
            >
              Accédez à votre espace dédié
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};
