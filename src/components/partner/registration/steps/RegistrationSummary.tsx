import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, Phone, MapPin, FileText, Edit, CheckCircle, ChevronLeft } from 'lucide-react';
import { CompanyInfoFormData, DocumentsFormData, ServicesFormData, SecurityFormData } from '@/schemas/partnerRegistration';

interface RegistrationSummaryProps {
  data: CompanyInfoFormData & DocumentsFormData & ServicesFormData & Partial<SecurityFormData>;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  onPrevious: () => void;
  loading: boolean;
}

export const RegistrationSummary = ({ 
  data, 
  onConfirm, 
  onEdit, 
  onPrevious,
  loading 
}: RegistrationSummaryProps) => {
  
  const businessTypeLabels = {
    individual: 'Entreprise individuelle',
    company: 'Société',
    cooperative: 'Coopérative',
    association: 'Association',
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800 dark:text-green-200">
          Vérifiez attentivement vos informations avant de valider votre inscription
        </AlertDescription>
      </Alert>

      {/* 1. Informations entreprise */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Informations entreprise</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="text-green-600 hover:text-green-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nom de l'entreprise</p>
              <p className="font-medium text-gray-900 dark:text-white">{data.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <Badge variant="secondary">
                {businessTypeLabels[data.business_type]}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{data.contact_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium text-gray-900 dark:text-white">{data.phone}</p>
            </div>
          </div>

          {data.address && (
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium text-gray-900 dark:text-white">{data.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Documents */}
      {(data.business_license || data.tax_number) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(2)}
                className="text-green-600 hover:text-green-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.business_license && (
              <div>
                <p className="text-sm text-gray-500">Licence commerciale</p>
                <p className="font-medium text-gray-900 dark:text-white">{data.business_license}</p>
              </div>
            )}
            {data.tax_number && (
              <div>
                <p className="text-sm text-gray-500">Numéro fiscal</p>
                <p className="font-medium text-gray-900 dark:text-white">{data.tax_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Zones de service */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Zones de service</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="text-green-600 hover:text-green-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.service_areas?.map((area) => (
              <Badge 
                key={area}
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
              >
                {area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditions d'utilisation */}
      <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <AlertDescription className="text-xs text-gray-600 dark:text-gray-400">
          En validant votre inscription, vous acceptez les{' '}
          <a href="/terms" className="text-green-600 hover:underline" target="_blank">
            conditions d'utilisation
          </a>
          {' '}et la{' '}
          <a href="/privacy" className="text-green-600 hover:underline" target="_blank">
            politique de confidentialité
          </a>
          {' '}de Kwenda.
        </AlertDescription>
      </Alert>

      {/* Boutons navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        <Button 
          type="button"
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Inscription en cours...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider mon inscription
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
