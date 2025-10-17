import React from 'react';
import { Button } from '@/components/ui/button';

interface QuickRepliesProps {
  onSelect: (message: string) => void;
}

const DEFAULT_REPLIES = [
  'Quel est le prix final ?',
  'Livraison disponible ?',
  'Garantie incluse ?',
  'État du produit ?',
  'Négociable ?'
];

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {DEFAULT_REPLIES.map((reply) => (
        <Button
          key={reply}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="whitespace-nowrap text-xs"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};
