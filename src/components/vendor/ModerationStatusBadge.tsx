import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface ModerationStatusBadgeProps {
  status: string;
  className?: string;
}

export const ModerationStatusBadge: React.FC<ModerationStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  if (status === 'pending') {
    return (
      <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-300 ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        En modération
      </Badge>
    );
  }
  
  if (status === 'approved') {
    return (
      <Badge variant="default" className={`bg-green-100 text-green-800 border-green-300 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Approuvé
      </Badge>
    );
  }
  
  if (status === 'rejected') {
    return (
      <Badge variant="destructive" className={className}>
        <XCircle className="w-3 h-3 mr-1" />
        Rejeté
      </Badge>
    );
  }
  
  return null;
};
