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
          Cette information est optionnelle mais fortement recommandée pour accélérer la validation de votre compte.
        </AlertDescription>
      </Alert>

      {/* Numéro fiscal - Champ unique */}
      <div className="space-y-2">
        <Label htmlFor="tax_number" className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-600" />
          Numéro d'identification fiscale
        </Label>
        <Input
          id="tax_number"
          {...register('tax_number')}
          placeholder="Ex: NIF A1234567X ou RCCM CD/KIN/12345"
          className={errors.tax_number ? 'border-red-500' : ''}
        />
        {errors.tax_number && (
          <p className="text-sm text-red-500">{errors.tax_number.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Votre numéro NIF (Numéro d'Identification Fiscale) ou RCCM (Registre de Commerce)
        </p>
      </div>

      {/* Message d'information étendu */}
      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Info className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800 dark:text-green-200">
          📄 Ce champ est optionnel mais fortement recommandé. Vous pourrez ajouter d'autres documents 
          (licence commerciale, attestations, etc.) après validation de votre compte dans votre espace partenaire.
        </AlertDescription>
      </Alert>

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
