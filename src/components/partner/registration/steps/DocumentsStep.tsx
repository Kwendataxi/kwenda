import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentsSchema, DocumentsFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface DocumentsStepProps {
  data: DocumentsFormData;
  onNext: (data: DocumentsFormData) => void;
  onPrevious: () => void;
}

export const DocumentsStep = ({ data, onNext, onPrevious }: DocumentsStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: data,
  });

  const onSubmit = (formData: DocumentsFormData) => {
    console.log('✅ Step 2 validated:', formData);
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
          Ces informations sont optionnelles mais recommandées pour accélérer la validation de votre compte.
        </AlertDescription>
      </Alert>

      {/* Numéro de licence commerciale */}
      <div className="space-y-2">
        <Label htmlFor="business_license" className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-600" />
          Numéro de licence commerciale
        </Label>
        <Input
          id="business_license"
          {...register('business_license')}
          placeholder="Ex: LC-2024-KIN-12345"
          className={errors.business_license ? 'border-red-500' : ''}
        />
        {errors.business_license && (
          <p className="text-sm text-red-500">{errors.business_license.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Numéro de votre licence d'exploitation commerciale
        </p>
      </div>

      {/* Numéro fiscal */}
      <div className="space-y-2">
        <Label htmlFor="tax_number" className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-600" />
          Numéro fiscal (NIF/RCCM)
        </Label>
        <Input
          id="tax_number"
          {...register('tax_number')}
          placeholder="Ex: A1234567X"
          className={errors.tax_number ? 'border-red-500' : ''}
        />
        {errors.tax_number && (
          <p className="text-sm text-red-500">{errors.tax_number.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Numéro d'identification fiscale ou RCCM
        </p>
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
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
