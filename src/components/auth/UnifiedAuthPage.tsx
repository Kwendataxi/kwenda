import { Card } from "@/components/ui/card";
import { ClientLoginForm } from "./ClientLoginForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthLanguageSelector } from './AuthLanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export const UnifiedAuthPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen wallet-congo-pattern auth-congo-bg flex flex-col relative">
      {/* Language Selector - Fixed top-right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-fade-in">
        <AuthLanguageSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex justify-center animate-congo-pulse">
              <BrandLogo size={80} animated withGlow className="mx-auto" />
            </div>
            
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                {t('auth.welcome')}
              </h1>
              <p className="text-base text-muted-foreground mt-2">
                Connectez-vous pour commander vos courses
              </p>
            </div>
          </div>

          {/* Auth Card - Formulaire client unique */}
          <Card className="auth-glass shadow-[0_8px_30px_hsl(var(--congo-red)/0.1)] dark:shadow-[0_8px_40px_hsl(var(--congo-red)/0.2)] animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Connexion Client
                </h2>
                <p className="text-sm text-muted-foreground">
                  Accédez à vos services de transport, livraison et marketplace
                </p>
              </div>
              
              <ClientLoginForm />
            </div>
          </Card>
        </div>
      </div>

      {/* Footer - Repositionné tout en bas */}
      <div className="mt-auto py-6 flex justify-center animate-fade-up" style={{ animationDelay: '400ms' }}>
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3 mr-1.5" />
          {t('auth.back_home')}
        </Button>
      </div>
    </div>
  );
};
