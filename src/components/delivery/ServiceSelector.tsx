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
    <div className="space-y-3">
      {serviceOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedService === option.id;
        
        return (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full"
          >
            <Card 
              className={`cursor-pointer border-2 transition-all duration-300 ease-out ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/40 hover:shadow-sm'
              }`}
              onClick={() => onServiceSelect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{option.label}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-primary">
                          {option.basePrice.toLocaleString()} CDF
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {option.vehicleType}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-2">
                      {option.features.slice(0, 2).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex-shrink-0"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ServiceSelector;