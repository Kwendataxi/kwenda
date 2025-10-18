import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { securitySchema, SecurityFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, Shield, Check, X } from 'lucide-react';

interface SecurityStepProps {
  data: SecurityFormData;
  onNext: (data: SecurityFormData) => void;
  onPrevious: () => void;
}

export const SecurityStep = ({ data, onNext, onPrevious }: SecurityStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: data,
  });

  const password = watch('password', '');

  // Critères de sécurité du mot de passe
  const passwordCriteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Une minuscule', met: /[a-z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) },
  ];

  const allCriteriaMet = passwordCriteria.every(c => c.met);

  const onSubmit = (formData: SecurityFormData) => {
    console.log('✅ Step 4 validated (password hidden for security)');
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Shield className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
          Créez un mot de passe sécurisé pour protéger votre compte partenaire
        </AlertDescription>
      </Alert>

      {/* Mot de passe */}
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          Mot de passe *
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Indicateur de force du mot de passe */}
      {password && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Sécurité du mot de passe :
          </p>
          <div className="space-y-2">
            {passwordCriteria.map((criteria, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {criteria.met ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={criteria.met ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}>
                  {criteria.label}
                </span>
              </div>
            ))}
          </div>
          {allCriteriaMet && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
              ✓ Mot de passe fort
            </p>
          )}
        </div>
      )}

      {/* Confirmation du mot de passe */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          Confirmer le mot de passe *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="••••••••"
            className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Boutons navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button"
          variant="outline"
          onClick={onPrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        <Button 
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          disabled={!allCriteriaMet}
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
