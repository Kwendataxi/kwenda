import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

interface ProductConditionBadgeProps {
  condition: string;
  variant?: 'default' | 'compact';
}

const conditionConfig: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  className: string;
}> = {
  new: {
    label: 'Neuf',
    icon: <Sparkles className="h-3 w-3" />,
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  like_new: {
    label: 'Comme neuf',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  good: {
    label: 'Bon état',
    icon: <CheckCircle className="h-3 w-3" />,
    className: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  fair: {
    label: 'État correct',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  refurbished: {
    label: 'Reconditionné',
    icon: <Wrench className="h-3 w-3" />,
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
};

export const ProductConditionBadge: React.FC<ProductConditionBadgeProps> = ({ 
  condition, 
  variant = 'default' 
}) => {
  const config = conditionConfig[condition] || conditionConfig.good;

  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};
