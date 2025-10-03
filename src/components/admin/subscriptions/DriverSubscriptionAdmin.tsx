import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { SubscriptionActionModal } from "./SubscriptionActionModal";
import { 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  MoreHorizontal,
  Users,
  TrendingUp,
  Clock,
  Ticket
} from "lucide-react";
import { ServiceTypeBadge } from './ServiceTypeBadge';
import { RidesProgressBar } from './RidesProgressBar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const DriverSubscriptionAdmin = () => {
  const { driverSubscriptions, loading } = useUnifiedSubscriptions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    subscription: any;
    action: string;
  }>({ isOpen: false, subscription: null, action: "" });

  // Filter subscriptions
  const filteredSubscriptions = driverSubscriptions.filter(sub => {
    const matchesSearch = 
      sub.chauffeurs?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.chauffeurs?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subscription_plans?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeCount = driverSubscriptions.filter(sub => sub.status === 'active').length;
  const totalRevenue = driverSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (sub.subscription_plans?.price || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expiré</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAction = (subscription: any, action: string) => {
    setActionModal({
      isOpen: true,
      subscription,
      action
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {driverSubscriptions.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground">
              Revenus des abonnements chauffeurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirant bientôt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {driverSubscriptions.filter(sub => {
                const days = getDaysUntilExpiry(sub.end_date);
                return sub.status === 'active' && days <= 7 && days > 0;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnements Chauffeurs</CardTitle>
          <CardDescription>
            Gestion complète des abonnements des chauffeurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Plan / Service</TableHead>
                  <TableHead>Courses Restantes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de fin</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => {
                  const daysUntilExpiry = getDaysUntilExpiry(subscription.end_date);
                  const isExpiringSoon = subscription.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                  
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.chauffeurs?.display_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.chauffeurs?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {subscription.subscription_plans?.name}
                          </div>
                          <ServiceTypeBadge 
                            serviceType={subscription.service_type || 'transport'} 
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <RidesProgressBar 
                          ridesRemaining={subscription.rides_remaining || 0}
                          ridesIncluded={subscription.subscription_plans?.rides_included || 0}
                          size="sm"
                          showLabel={false}
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        <div className={isExpiringSoon ? "text-orange-600 font-medium" : ""}>
                          {formatDate(subscription.end_date)}
                          {isExpiringSoon && (
                            <div className="text-xs text-orange-500">
                              Expire dans {daysUntilExpiry} jours
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {subscription.subscription_plans?.price?.toLocaleString()} {subscription.subscription_plans?.currency}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          {subscription.auto_renew ? '🔄 Auto-renew' : subscription.payment_method}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'extend')}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Prolonger
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'cancel')}>
                              Annuler
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'details')}>
                              Voir détails
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucun abonnement trouvé avec les filtres sélectionnés
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <SubscriptionActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, subscription: null, action: "" })}
        subscription={actionModal.subscription}
        action={actionModal.action}
        onConfirm={(id, data) => {
          if (actionModal.action === 'extend' && data?.days) {
            // Note: This would need to be implemented with proper API calls
            console.log('Extend subscription:', id, data.days);
          } else if (actionModal.action === 'cancel') {
            // Note: This would need to be implemented with proper API calls
            console.log('Cancel subscription:', id);
          }
        }}
        type="driver"
      />
    </div>
  );
};