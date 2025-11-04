import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ShoppingBag, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useVendorStats } from '@/hooks/useVendorStats';
import { VendorSetupProgress } from './VendorSetupProgress';
import { StatsCompactCard } from './modern/StatsCompactCard';

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
      <div className="space-y-3 p-4">
        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted/60 rounded-lg animate-pulse" />
          ))}
        </div>
        {/* Actions Skeleton */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="h-12 bg-muted/60 rounded animate-pulse" />
          <div className="h-12 bg-muted/60 rounded animate-pulse" />
        </div>
        {/* Config Skeleton */}
        <div className="h-16 bg-muted/60 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {/* 1. KPI Cards - PRIORITÉ 1 - Toujours visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatsCompactCard
          icon={CheckCircle}
          label="Actifs"
          value={stats.activeProducts}
          color="green"
          onClick={() => onTabChange?.('shop')}
        />
        <StatsCompactCard
          icon={Clock}
          label="En attente"
          value={stats.pendingProducts}
          color="orange"
          onClick={() => onTabChange?.('shop')}
        />
        <StatsCompactCard
          icon={ShoppingBag}
          label="Commandes"
          value={stats.totalOrders}
          color="blue"
          badge={stats.pendingOrders}
          onClick={() => onTabChange?.('orders')}
        />
        <StatsCompactCard
          icon={DollarSign}
          label="Escrow"
          value={`${stats.pendingEscrow.toLocaleString()} FC`}
          color="yellow"
        />
      </div>

      {/* 2. Quick Actions - PRIORITÉ 2 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Button 
          onClick={() => navigate('/vendeur/ajouter-produit')} 
          className="h-12 quick-action-btn"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onTabChange?.('shop')} 
          className="h-12 quick-action-btn"
          size="lg"
        >
          <Package className="h-5 w-5 mr-2" />
          Gérer
        </Button>
      </div>

      {/* 3. Configuration - PRIORITÉ 3 - Compact par défaut */}
      <VendorSetupProgress onActionClick={handleSetupAction} />

      {/* 4. Alertes contextuelles - PRIORITÉ 4 - Seulement si nécessaire */}
      {stats.pendingOrders > 0 && (
        <Alert variant="default" className="border-orange-500/50 bg-orange-500/10">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertTitle className="text-sm font-semibold">Commandes à traiter</AlertTitle>
          <AlertDescription className="text-xs">
            Vous avez {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} en attente de validation.
          </AlertDescription>
        </Alert>
      )}

      {stats.pendingProducts > 0 && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-sm font-semibold">Produits en modération</AlertTitle>
          <AlertDescription className="text-xs">
            {stats.pendingProducts} produit{stats.pendingProducts > 1 ? 's' : ''} en attente d'approbation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
