import { Card } from "@/components/ui/card";
import { ClientLoginForm } from "./ClientLoginForm";
import { ArrowLeft, Car, Handshake, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthLanguageSelector } from './AuthLanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export const UnifiedAuthPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen auth-congo-bg flex flex-col relative">
      {/* Language Selector - Fixed top-right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <AuthLanguageSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <BrandLogo size={72} className="mx-auto" />
            </div>
            
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-congo-red via-congo-yellow to-congo-red bg-clip-text text-transparent">
                {t('auth.welcome')}
              </h1>
              <p className="text-lg text-muted-foreground/80 mt-3 font-light">
                Connectez-vous pour commander vos courses
              </p>
            </div>
          </div>

          {/* Auth Card - Formulaire client unique */}
          <Card className="auth-glass shadow-lg border border-border/50">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Connexion Client
                </h2>
                <p className="text-sm text-muted-foreground">
                  Accédez à vos services de transport, livraison et marketplace
                </p>
              </div>
              
              <ClientLoginForm />
            </div>
          </Card>

          {/* Section autres espaces */}
          <div className="pt-6 border-t border-border/30">
            <p className="text-center text-sm text-muted-foreground mb-4">
              {t('auth.professional_question')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/driver/auth')}
                className="flex items-center gap-2 rounded-xl"
              >
                <Car className="h-4 w-4" />
                <span>{t('auth.driver_deliverer')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/partner/auth')}
                className="flex items-center gap-2 rounded-xl"
              >
                <Handshake className="h-4 w-4" />
                <span>{t('role.partner')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/restaurant/auth')}
                className="flex items-center gap-2 rounded-xl"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>{t('role.restaurant')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Retour à l'accueil */}
      <div className="mt-auto py-8 flex justify-center">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
        >
          <ArrowLeft className="h-3 w-3 mr-1.5" />
          {t('auth.back_home')}
        </Button>
      </div>
    </div>
  );
};
