import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AdminMarketplaceModeration } from '@/components/admin/marketplace/AdminMarketplaceModeration';
import { LayoutDashboard, Package, Shield } from 'lucide-react';

export const AdminMarketplaceManagement = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion Marketplace</h1>
        <p className="text-muted-foreground">
          Administration de la marketplace et modération des produits
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Package className="h-4 w-4 mr-2" />
            Modération Produits
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Shield className="h-4 w-4 mr-2" />
            Revenus Escrow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistiques marketplace</h2>
            <p className="text-muted-foreground">
              Les statistiques détaillées seront ajoutées prochainement.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <AdminMarketplaceModeration />
        </TabsContent>

        <TabsContent value="escrow" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Suivi des fonds escrow</h2>
            <p className="text-muted-foreground">
              Le tableau de bord escrow sera ajouté prochainement.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMarketplaceManagement;
