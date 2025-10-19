import { Link, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const VendorNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/vendeur', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/vendeur/produits', label: 'Produits', icon: Package },
    { path: '/vendeur/commandes', label: 'Commandes', icon: ShoppingCart },
    { path: '/vendeur/revenus', label: 'Revenus', icon: DollarSign },
    { path: '/vendeur/parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-4">
          <h1 className="text-xl font-bold mr-8">Espace Vendeur</h1>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
