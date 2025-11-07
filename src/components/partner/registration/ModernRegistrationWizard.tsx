import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Building2, FileText, MapPin, Lock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/brand/BrandLogo';
import { usePartnerRegistrationSecure } from '@/hooks/usePartnerRegistrationSecure';
import { 
  CompanyInfoFormData, 
  DocumentsFormData, 
  ServicesFormData, 
  SecurityFormData 
} from '@/schemas/partnerRegistration';
import { CompanyInfoStep } from './steps/CompanyInfoStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ServicesStep } from './steps/ServicesStep';
import { SecurityStep } from './steps/SecurityStep';
import { RegistrationSummary } from './steps/RegistrationSummary';

type PartnerFormData = CompanyInfoFormData & 
  DocumentsFormData & 
  ServicesFormData & 
  SecurityFormData;

const STEPS = [
  { number: 1, title: 'Entreprise', icon: Building2, subtitle: 'Informations de votre société' },
  { number: 2, title: 'Documents', icon: FileText, subtitle: 'Justificatifs légaux' },
  { number: 3, title: 'Services', icon: MapPin, subtitle: 'Zones d\'intervention' },
  { number: 4, title: 'Sécurité', icon: Lock, subtitle: 'Mot de passe et accès' },
  { number: 5, title: 'Confirmation', icon: CheckCircle, subtitle: 'Vérification finale' },
];

export const ModernRegistrationWizard = () => {
  const navigate = useNavigate();
  const { registerPartner, loading } = usePartnerRegistrationSecure();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<Partial<PartnerFormData>>({
    company_name: '',
    contact_email: '',
    phone: '',
    business_type: 'company',
    address: '',
    tax_number: '',
    service_areas: ['Kinshasa'],
    password: '',
    confirmPassword: '',
  });

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const currentStepInfo = STEPS[currentStep - 1];

  const handleNextStep = (stepData: Partial<PartnerFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.company_name || !formData.contact_email || 
          !formData.phone || !formData.password || !formData.business_type) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setCurrentStep(4);
        return;
      }

      const registrationData = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        business_type: formData.business_type,
        address: formData.address || '',
        tax_number: formData.tax_number || '',
        service_areas: formData.service_areas || ['Kinshasa'],
        password: formData.password,
      };

      const result = await registerPartner(registrationData);

      if (result.success) {
        toast.success('Inscription réussie !', {
          description: result.emailConfirmationRequired 
            ? 'Vérifiez votre email pour activer votre compte'
            : 'Votre demande est en cours de traitement'
        });
        
        setTimeout(() => {
          navigate('/partner/auth');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Partner registration error:', error);
      toast.error('Erreur lors de l\'inscription', {
        description: error.message || 'Veuillez réessayer'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white dark:bg-gray-950 shadow-lg mb-4">
            <BrandLogo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Devenez Partenaire Kwenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Rejoignez le réseau et développez votre activité
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <motion.div
                  animate={{
                    scale: currentStep === step.number ? 1.1 : 1,
                  }}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all
                    ${currentStep === step.number 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>
                
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-all
                    ${currentStep > step.number 
                      ? 'bg-emerald-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Étape {currentStep} sur {STEPS.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mx-2">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentStepInfo.subtitle}
            </span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <CompanyInfoStep
                      data={formData as CompanyInfoFormData}
                      onNext={handleNextStep}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <DocumentsStep
                      data={formData as DocumentsFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                    />
                  )}
                  
                  {currentStep === 3 && (
                    <ServicesStep
                      data={formData as ServicesFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                    />
                  )}
                  
                  {currentStep === 4 && (
                    <SecurityStep
                      data={formData as SecurityFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                    />
                  )}
                  
                  {currentStep === 5 && (
                    <RegistrationSummary
                      data={formData as PartnerFormData}
                      onConfirm={handleSubmit}
                      onEdit={(step) => setCurrentStep(step)}
                      onPrevious={handlePreviousStep}
                      loading={loading}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/partner/auth')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Se connecter
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernRegistrationWizard;
