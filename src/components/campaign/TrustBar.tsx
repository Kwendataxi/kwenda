import React from 'react';
import { Shield, Award, CreditCard, HeadphonesIcon } from 'lucide-react';

export const TrustBar = () => {
  const trustItems = [
    { icon: Award, text: 'Leader RDC' },
    { icon: Shield, text: '100% Sécurisé' },
    { icon: CreditCard, text: 'Paiement Mobile Money' },
    { icon: HeadphonesIcon, text: 'Support 24/7' }
  ];

  return (
    <div className="bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
