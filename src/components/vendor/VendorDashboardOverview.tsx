import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ShoppingBag, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useVendorStats } from '@/hooks/useVendorStats';

export const VendorDashboardOverview = () => {
  const navigate = useNavigate();
  const { stats, loading } = useVendorStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Actifs */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-500">{stats.activeProducts}</p>
          </CardContent>
        </Card>

        {/* En attente */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-500">{stats.pendingProducts}</p>
          </CardContent>
        </Card>

        {/* Total Commandes */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalOrders}</p>
            {stats.pendingOrders > 0 && (
              <p className="text-xs text-orange-500 mt-1">
                {stats.pendingOrders} à traiter
              </p>
            )}
          </CardContent>
        </Card>

        {/* Escrow en attente */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">
              {stats.pendingEscrow.toLocaleString()} FC
            </p>
            <p className="text-xs text-muted-foreground mt-1">En attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate('/vendeur/ajouter-produit')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un produit
        </Button>
        <Button variant="outline" onClick={() => navigate('/vendeur')} size="lg">
          <Package className="h-4 w-4 mr-2" />
          Gérer mes produits
        </Button>
      </div>

      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur votre espace vendeur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Gérez vos produits, suivez vos commandes et développez votre activité sur Kwenda Marketplace.
          </p>
          {stats.pendingProducts > 0 && (
            <p className="text-sm text-orange-500 font-medium">
              ⚠️ Vous avez {stats.pendingProducts} produit{stats.pendingProducts > 1 ? 's' : ''} en attente de modération.
            </p>
          )}
          {stats.pendingOrders > 0 && (
            <p className="text-sm text-primary font-medium">
              📦 Vous avez {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} à traiter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
