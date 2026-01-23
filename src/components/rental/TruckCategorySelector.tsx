import React from 'react';
import { motion } from 'framer-motion';
import { Car, Truck, Snowflake, Container, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TruckCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  tonnage: string;
  color: string;
}

const TRUCK_CATEGORIES: TruckCategory[] = [
  {
    id: 'camion-leger',
    name: 'Camion Léger',
    icon: <Truck className="h-5 w-5" />,
    tonnage: '3.5T - 7.5T',
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'camion-moyen',
    name: 'Camion Moyen',
    icon: <Truck className="h-6 w-6" />,
    tonnage: '7.5T - 16T',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 'camion-lourd',
    name: 'Camion Lourd',
    icon: <Truck className="h-7 w-7" />,
    tonnage: '16T+',
    color: 'from-slate-600 to-gray-600'
  },
  {
    id: 'semi-remorque',
    name: 'Semi-Remorque',
    icon: <Container className="h-6 w-6" />,
    tonnage: '25T+',
    color: 'from-zinc-600 to-neutral-600'
  },
  {
    id: 'camion-special',
    name: 'Camion Spécial',
    icon: <Snowflake className="h-5 w-5" />,
    tonnage: 'Frigo/Citerne',
    color: 'from-cyan-600 to-sky-600'
  }
];

interface TruckCategorySelectorProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
}

export const TruckCategorySelector: React.FC<TruckCategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  vehicleCounts
}) => {
  const hasTrucks = TRUCK_CATEGORIES.some(cat => (vehicleCounts[cat.name] || 0) > 0);

  if (!hasTrucks) return null;

  return (
    <div className="py-4 px-4 bg-gradient-to-r from-muted/50 to-muted/30 border-b">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Camions & Transport Lourd</h3>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TRUCK_CATEGORIES.map((cat) => {
            const count = vehicleCounts[cat.name] || 0;
            if (count === 0) return null;
            
            const isSelected = selectedCategory === cat.name;
            
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange(isSelected ? null : cat.name)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[100px]",
                  "transition-all duration-200 border-2",
                  isSelected
                    ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-lg`
                    : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isSelected ? "bg-white/20" : "bg-muted"
                )}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  {cat.name.replace('Camion ', '')}
                </span>
                <span className={cn(
                  "text-[10px]",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}>
                  {cat.tonnage}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  isSelected 
                    ? "bg-white/25 text-white" 
                    : "bg-primary/10 text-primary"
                )}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
