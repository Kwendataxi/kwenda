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
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white dark:from-background dark:via-background dark:to-background flex flex-col">
      {/* Language Selector */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <AuthLanguageSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md flex flex-col space-y-8 animate-auth-fade">
          {/* Header - Clean & Simple */}
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <BrandLogo size={56} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('auth.welcome')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('auth.client_subtitle')}
              </p>
            </div>
          </div>

          {/* Auth Card - Modern & Clean */}
          <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl animate-auth-scale">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('auth.client_login_title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('auth.client_login_subtitle')}
                </p>
              </div>
              
              <ClientLoginForm />
            </div>
          </Card>

          {/* Professional Spaces Section */}
          <div className="pt-4">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('auth.professional_question')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/driver/auth')}
                className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <Car className="h-4 w-4 text-rose-500" />
                <span className="text-gray-700 dark:text-gray-300">{t('auth.driver_deliverer')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/partner/auth')}
                className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <Handshake className="h-4 w-4 text-rose-500" />
                <span className="text-gray-700 dark:text-gray-300">{t('role.partner')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/restaurant/auth')}
                className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4 text-rose-500" />
                <span className="text-gray-700 dark:text-gray-300">{t('role.restaurant')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 flex justify-center">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3 mr-1.5" />
          {t('auth.back_home')}
        </Button>
      </div>
    </div>
  );
};
