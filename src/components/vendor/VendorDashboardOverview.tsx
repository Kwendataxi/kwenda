import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ShoppingBag, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useVendorStats } from '@/hooks/useVendorStats';
import { VendorSetupProgress } from './VendorSetupProgress';

interface VendorDashboardOverviewProps {
  onTabChange?: (tab: string) => void;
}

export const VendorDashboardOverview = ({ onTabChange }: VendorDashboardOverviewProps) => {
  const navigate = useNavigate();
  const { stats, loading } = useVendorStats();

  const handleSetupAction = (action: string) => {
    switch (action) {
      case 'profile':
        onTabChange?.('profile');
        break;
      case 'add-product':
        navigate('/vendeur/ajouter-produit');
        break;
      case 'subscription':
        onTabChange?.('subscription');
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="h-4 bg-muted/60 rounded w-20 animate-pulse" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-12 bg-muted/60 rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-4">
          <div className="h-12 w-48 bg-muted/60 rounded animate-pulse" />
          <div className="h-12 w-44 bg-muted/60 rounded animate-pulse" />
        </div>
        
        {/* Welcome Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-64 bg-muted/60 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Setup Progress */}
      <VendorSetupProgress onActionClick={handleSetupAction} />

      {/* KPI Cards Grid - Responsive optimisé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Actifs */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-display-lg font-extrabold text-green-500 tracking-tight">{stats.activeProducts}</p>
          </CardContent>
        </Card>

        {/* En attente */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-display-lg font-extrabold text-orange-500 tracking-tight">{stats.pendingProducts}</p>
          </CardContent>
        </Card>

        {/* Total Commandes */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-display-lg font-extrabold text-primary tracking-tight">{stats.totalOrders}</p>
            {stats.pendingOrders > 0 && (
              <p className="text-body-sm text-orange-500 font-medium mt-1">
                {stats.pendingOrders} à traiter
              </p>
            )}
          </CardContent>
        </Card>

        {/* Escrow en attente */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-heading-xl font-extrabold text-yellow-500 tracking-tight">
              {stats.pendingEscrow.toLocaleString()} FC
            </p>
            <p className="text-body-sm text-muted-foreground mt-1">En attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate('/vendeur/ajouter-produit')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un produit
        </Button>
        <Button variant="outline" onClick={() => onTabChange?.('shop')} size="lg">
          <Package className="h-4 w-4 mr-2" />
          Gérer mes produits
        </Button>
      </div>

      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-lg">Bienvenue sur votre espace vendeur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body-md text-muted-foreground">
            Gérez vos produits, suivez vos commandes et développez votre activité sur Kwenda Marketplace.
          </p>
          {stats.pendingProducts > 0 && (
            <p className="text-body-md text-orange-500 font-semibold">
              ⚠️ Vous avez {stats.pendingProducts} produit{stats.pendingProducts > 1 ? 's' : ''} en attente de modération.
            </p>
          )}
          {stats.pendingOrders > 0 && (
            <p className="text-body-md text-primary font-semibold">
              📦 Vous avez {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} à traiter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
