import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions'
import { useDriverCredits } from '@/hooks/useDriverCredits'
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Shield,
  Zap,
  Star,
  CheckCircle
} from 'lucide-react'

export const DriverSubscriptionPanel = () => {
  const { plans, currentSubscription, subscribeToplan, loading: subLoading } = useDriverSubscriptions()
  const { credits, topUpCredits, loading: creditsLoading } = useDriverCredits()

  const handleSubscribe = async (planId: string) => {
    const result = await subscribeToplan(planId, 'airtel_money')
    if (result.success) {
      // Subscription successful
    }
  }

  const handleTopUp = async (amount: number) => {
    const result = await topUpCredits(amount, 'airtel_money')
    if (result.success) {
      // Top-up successful
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'expired': return 'bg-red-500'
      case 'grace_period': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getSubscriptionStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'expired': return 'Expiré'
      case 'grace_period': return 'Période de Grâce'
      default: return 'Inactif'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion Chauffeur</h1>
        <div className="flex items-center space-x-4">
          {currentSubscription && (
            <Badge className={`${getSubscriptionStatusColor(currentSubscription.status)} text-white`}>
              <Shield className="w-4 h-4 mr-1" />
              {getSubscriptionStatusLabel(currentSubscription.status)}
            </Badge>
          )}
          {credits && (
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Wallet className="w-4 h-4 mr-1" />
              {credits.balance.toLocaleString()} CDF
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">Crédits Opérationnels</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Solde Actuel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-purple-600" />
                  Solde Actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{credits?.balance.toLocaleString() || 0} CDF</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total gagné: {credits?.total_earned.toLocaleString() || 0} CDF</span>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      value={credits ? Math.min((credits.balance / 10000) * 100, 100) : 0} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {credits && credits.balance < 1000 ? 'Solde faible - Rechargez' : 'Solde suffisant'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recharge Rapide */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Recharge Rapide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[2000, 5000, 10000, 20000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleTopUp(amount)}
                      disabled={creditsLoading}
                    >
                      <span>{amount.toLocaleString()} CDF</span>
                      <CreditCard className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Dépensé</span>
                    <span className="font-medium">{credits?.total_spent.toLocaleString() || 0} CDF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dernière Recharge</span>
                    <span className="font-medium">
                      {credits?.last_topup_date 
                        ? new Date(credits.last_topup_date).toLocaleDateString()
                        : 'Jamais'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={credits?.is_active ? "default" : "secondary"}>
                      {credits?.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Frais par Service */}
          <Card>
            <CardHeader>
              <CardTitle>Frais par Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Transport</span>
                  </div>
                  <p className="text-2xl font-bold">200 CDF</p>
                  <p className="text-sm text-muted-foreground">par course</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Livraison</span>
                  </div>
                  <p className="text-2xl font-bold">150 CDF</p>
                  <p className="text-sm text-muted-foreground">par livraison</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Marketplace</span>
                  </div>
                  <p className="text-2xl font-bold">100 CDF</p>
                  <p className="text-sm text-muted-foreground">par commande</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {/* Abonnement Actuel */}
          {currentSubscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Abonnement Actuel</span>
                  <Badge className={getSubscriptionStatusColor(currentSubscription.status) + ' text-white'}>
                    {getSubscriptionStatusLabel(currentSubscription.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{currentSubscription.subscription_plans?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'expiration</p>
                    <p className="font-medium">{new Date(currentSubscription.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Renouvellement</p>
                    <p className="font-medium">{currentSubscription.auto_renew ? 'Automatique' : 'Manuel'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans Disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                {plan.priority_level === 2 && (
                  <div className="absolute -top-2 left-4">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{plan.price.toLocaleString()} CDF</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.duration_type === 'weekly' ? '/semaine' : '/mois'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Jusqu'à {plan.max_rides_per_day} courses/jour</span>
                    </div>
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subLoading || (currentSubscription?.status === 'active')}
                      variant={plan.priority_level === 2 ? "default" : "outline"}
                    >
                      {currentSubscription?.plan_id === plan.id 
                        ? 'Plan Actuel' 
                        : 'Souscrire'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique des dépenses (à implémenter)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficacité des Crédits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Revenus par crédit dépensé</span>
                    <span className="font-bold">15.2x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courses moyennes/jour</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coût moyen par course</span>
                    <span className="font-bold">200 CDF</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}