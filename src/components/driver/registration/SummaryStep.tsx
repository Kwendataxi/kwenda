import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Check, Briefcase, User, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SummaryStepProps {
  formData: {
    serviceType: string;
    serviceCategory: 'taxi' | 'delivery';
    displayName: string;
    email: string;
    phoneNumber: string;
    licenseNumber: string;
    acceptTerms: boolean;
  };
  onFieldChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: () => void;
  isRegistering: boolean;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  formData,
  onFieldChange,
  onBack,
  onSubmit,
  isRegistering
}) => {
  const getServiceDisplayName = (serviceType: string) => {
    const serviceMap: Record<string, string> = {
      'moto': 'Moto-taxi',
      'eco': 'VTC Économique',
      'confort': 'VTC Confort',
      'premium': 'VTC Premium',
      'flash': 'Livraison Flash',
      'flex': 'Livraison Flex',
      'maxicharge': 'Maxicharge'
    };
    return serviceMap[serviceType] || serviceType;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Vérifiez vos informations
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Assurez-vous que tout est correct avant de finaliser votre inscription
        </p>
      </div>
      
      {/* Cards récapitulatives */}
      <div className="space-y-4">
        {/* Service */}
        <Card className="dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              Service Choisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {getServiceDisplayName(formData.serviceType)}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Catégorie : {formData.serviceCategory === 'taxi' ? 'Transport VTC' : 'Livraison'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Infos Perso */}
        <Card className="dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Nom</span>
              <span className="font-medium">{formData.displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Email</span>
              <span className="font-medium">{formData.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Téléphone</span>
              <span className="font-medium">{formData.phoneNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Permis</span>
              <span className="font-medium">{formData.licenseNumber}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Abonnement */}
        <Card className="border-2 border-green-500 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  ✨ Essai Gratuit 30 jours
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Puis 25,000 CDF/mois · 50 courses incluses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Checkbox CGU */}
      <div className="flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
        <Checkbox
          id="terms"
          checked={formData.acceptTerms}
          onCheckedChange={(checked) => onFieldChange('acceptTerms', checked)}
          className="mt-1"
        />
        <Label htmlFor="terms" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
          J'accepte les <Link to="/terms" className="text-amber-600 hover:underline">conditions générales d'utilisation</Link> et 
          la <Link to="/privacy" className="text-amber-600 hover:underline">politique de confidentialité</Link> de Kwenda.
        </Label>
      </div>
      
      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl"
          disabled={isRegistering}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        
        <Button
          onClick={onSubmit}
          disabled={isRegistering || !formData.acceptTerms}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 font-semibold"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Inscription...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Finaliser l'inscription
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
