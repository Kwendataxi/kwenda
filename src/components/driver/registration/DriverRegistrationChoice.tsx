import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Car, 
  Users, 
  Settings, 
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'
import { FlexibleDriverRegistration } from './FlexibleDriverRegistration'
import { DriverRegistrationForm } from '@/components/auth/forms/DriverRegistrationForm'

interface DriverRegistrationChoiceProps {
  onSuccess: () => void
  onBack: () => void
}

export const DriverRegistrationChoice: React.FC<DriverRegistrationChoiceProps> = ({ 
  onSuccess, 
  onBack 
}) => {
  const [selectedSystem, setSelectedSystem] = useState<'new' | 'legacy' | null>(null)

  if (selectedSystem === 'new') {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedSystem(null)}
          className="mb-4"
        >
          ← Retour au choix
        </Button>
        <FlexibleDriverRegistration onComplete={onSuccess} />
      </div>
    )
  }

  if (selectedSystem === 'legacy') {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedSystem(null)}
          className="mb-4"
        >
          ← Retour au choix
        </Button>
        <DriverRegistrationForm onSuccess={onSuccess} onBack={onBack} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Inscription Chauffeur</h1>
          <p className="text-muted-foreground text-lg">
            Choisissez votre mode d'inscription préféré
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nouveau système flexible */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Recommandé
              </Badge>
            </div>
            
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Système Flexible</CardTitle>
                  <CardDescription>Nouvelle expérience intelligente</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Véhicule personnel ou partenaire</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Choix des services (taxi, livraison, mixte)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Préférences de zones et horaires</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Gestion dynamique des véhicules</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Interface moderne et intuitive</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  className="w-full group-hover:bg-primary/90 transition-colors"
                  onClick={() => setSelectedSystem('new')}
                >
                  Commencer avec le système flexible
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Système classique */}
          <Card className="relative overflow-hidden border-2 hover:border-secondary/50 transition-colors cursor-pointer group">
            <div className="absolute top-4 right-4">
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Classique
              </Badge>
            </div>
            
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Car className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Système Classique</CardTitle>
                  <CardDescription>Inscription traditionnelle simple</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Formulaire unique complet</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Un seul véhicule personnel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Configuration basique des services</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Processus rapide et direct</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Interface familière</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="secondary"
                  className="w-full group-hover:bg-secondary/90 transition-colors"
                  onClick={() => setSelectedSystem('legacy')}
                >
                  Utiliser le système classique
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Nouveau chez nous ?</strong> Le système flexible vous offre plus d'options et de contrôle
          </p>
          <p className="text-xs text-muted-foreground">
            Vous pourrez toujours modifier vos préférences après l'inscription
          </p>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={onBack}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  )
}