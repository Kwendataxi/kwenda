import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DriverSubscriptionPlans } from './DriverSubscriptionPlans'
import { RentalSubscriptionPlans } from './RentalSubscriptionPlans'
import { RentalSubscriptionPlansByCategory } from './RentalSubscriptionPlansByCategory'
import { AdminSubscriptionRevenue } from './AdminSubscriptionRevenue'
import { useDriverSubscriptionPlans } from '@/hooks/useDriverSubscriptionPlans'
import { useRentalSubscriptionPlans } from '@/hooks/useRentalSubscriptionPlans'
import { Car, Building2, Grid3x3 } from 'lucide-react'

export const SubscriptionPlansConfig = () => {
  const [activeTab, setActiveTab] = useState('drivers')
  const { plans: driverPlans } = useDriverSubscriptionPlans()
  const { plans: rentalPlans } = useRentalSubscriptionPlans()
  const rentalPlansWithCategory = rentalPlans.filter(p => p.vehicle_category)

  const driverActivePlans = driverPlans.filter(p => p.is_active).length
  const rentalActivePlans = rentalPlans.filter(p => p.is_active).length
  const rentalCategoryPlans = rentalPlansWithCategory.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration des Plans d'Abonnement</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les plans d'abonnement : {rentalCategoryPlans} plans location professionnels par catégorie
        </p>
      </div>

      {/* ✅ PHASE 2: Affichage des revenus admin */}
      <AdminSubscriptionRevenue />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans Chauffeurs/Livreurs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverActivePlans}</div>
            <p className="text-xs text-muted-foreground">
              plans actifs sur {driverPlans.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans Location Partenaires</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentalActivePlans}</div>
            <p className="text-xs text-muted-foreground">
              plans actifs sur {rentalPlans.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Plans Chauffeurs/Livreurs
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Plans Location (Anciens)
          </TabsTrigger>
          <TabsTrigger value="rental-categories" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Plans par Catégorie 🆕
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <DriverSubscriptionPlans />
        </TabsContent>

        <TabsContent value="rental" className="mt-6">
          <RentalSubscriptionPlans />
        </TabsContent>

        <TabsContent value="rental-categories" className="mt-6">
          <RentalSubscriptionPlansByCategory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
