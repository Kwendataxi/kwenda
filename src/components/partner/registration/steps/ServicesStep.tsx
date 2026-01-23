import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { servicesSchema, ServicesFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface ServicesStepProps {
  data: ServicesFormData;
  onNext: (data: ServicesFormData) => void;
  onPrevious: () => void;
}

const AVAILABLE_CITIES = [
  { id: 'Kinshasa', name: 'Kinshasa', country: 'RDC' },
  { id: 'Lubumbashi', name: 'Lubumbashi', country: 'RDC' },
  { id: 'Kolwezi', name: 'Kolwezi', country: 'RDC' },
  { id: 'Abidjan', name: 'Abidjan', country: 'Côte d\'Ivoire' },
];

export const ServicesStep = ({ data, onNext, onPrevious }: ServicesStepProps) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(data.service_areas || ['Kinshasa']);

  const handleToggleCity = (cityId: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };

  const handleSubmit = () => {
    // Validation
    if (selectedAreas.length === 0) {
      toast.error('Veuillez sélectionner au moins une zone de service');
      return;
    }

    if (selectedAreas.length > 10) {
      toast.error('Maximum 10 zones de service autorisées');
      return;
    }

    console.log('✅ Step 3 validated:', { service_areas: selectedAreas });
    onNext({ service_areas: selectedAreas });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-base">
          <MapPin className="w-5 h-5 text-green-600" />
          Sélectionnez vos zones de service *
        </Label>
        
        <p className="text-sm text-gray-500">
          Choisissez les villes où vous souhaitez opérer (minimum 1, maximum 10)
        </p>

        {/* Liste des villes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {AVAILABLE_CITIES.map((city) => {
            const isSelected = selectedAreas.includes(city.id);
            
            return (
              <div
                key={city.id}
                onClick={() => handleToggleCity(city.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'border-green-600 bg-green-50 dark:bg-green-950/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleCity(city.id)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {city.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {city.country}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Badge className="bg-green-600 text-white">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Résumé de la sélection */}
        {selectedAreas.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zones sélectionnées ({selectedAreas.length}/10) :
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedAreas.map((areaId) => {
                const city = AVAILABLE_CITIES.find(c => c.id === areaId);
                return (
                  <Badge 
                    key={areaId}
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                  >
                    {city?.name}
                  </Badge>
                );
              })}
            </div>
          </div>
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
          type="button"
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          disabled={selectedAreas.length === 0}
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
