import React from 'react'
import { DifferentiatedDriverRegistration } from './DifferentiatedDriverRegistration'

interface DriverRegistrationChoiceProps {
  onSuccess: () => void
  onBack: () => void
}

export const DriverRegistrationChoice: React.FC<DriverRegistrationChoiceProps> = ({ 
  onSuccess, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Inscription Chauffeur</h1>
          <p className="text-muted-foreground text-lg">
            Choisissez votre mode d'inscription préféré
          </p>
        </div>

        <DifferentiatedDriverRegistration 
          onSuccess={onSuccess} 
          onBack={onBack} 
        />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Vous pourrez modifier vos préférences après l'inscription
          </p>
        </div>
      </div>
    </div>
  )
}