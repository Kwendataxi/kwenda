import React from 'react';
import ModernDeliveryInterface from './ModernDeliveryInterface';

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  // Utilise maintenant directement l'interface moderne avec toutes ses fonctionnalités avancées
  // Géolocalisation intelligente, pricing automatique, UI glassmorphism
  return <ModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default StepByStepDeliveryInterface;