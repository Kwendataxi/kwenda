// Sélecteur de service de livraison simplifié
// Permet de choisir directement entre Flash, Flex et MaxiCharge

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Car, Truck } from 'lucide-react';

interface ServiceOption {
  id: string;
  icon: any;
  label: string;
  description: string;
  vehicleType: string;
  basePrice: number;
  features: string[];
}

interface ServiceSelectorProps {
  selectedService: string;
  onServiceSelect: (service: string) => void;
}

const serviceOptions: ServiceOption[] = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash', 
    description: 'Livraison rapide en moto',
    vehicleType: 'Moto',
    basePrice: 5000,
    features: ['Livraison express', 'Petits colis', 'Circulation facile']
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex', 
    description: 'Livraison standard en camionnette',
    vehicleType: 'Camionnette',
    basePrice: 7000,
    features: ['Livraison standard', 'Colis moyens', 'Bon rapport qualité/prix']
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge', 
    description: 'Livraison lourde en camion',
    vehicleType: 'Camion',
    basePrice: 12000,
    features: ['Gros volumes', 'Objets lourds', 'Équipe de manutention']
  }
];

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onServiceSelect
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:gap-4">
        {serviceOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedService === option.id;
          
          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Card 
                className={`cursor-pointer transition-all w-full ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                    : 'hover:shadow-md hover:border-primary/20'
                }`}
                onClick={() => onServiceSelect(option.id)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icône et info principale */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg">{option.label}</h3>
                          <Badge variant="outline" className="text-xs">
                            {option.vehicleType}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {option.description}
                        </p>
                        
                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {option.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-sm font-semibold text-primary">
                          À partir de {option.basePrice.toLocaleString()} CDF
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicateur de sélection */}
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelector;