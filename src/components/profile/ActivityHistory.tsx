import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, Car, Package, Wallet, User, Clock, MapPin } from 'lucide-react';

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  amount?: number;
  currency?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: any;
  created_at: string;
}

interface Booking {
  id: string;
  pickup_location: string;
  destination: string;
  vehicle_type: string;
  status: string;
  actual_price?: number;
  created_at: string;
}

interface Delivery {
  id: string;
  pickup_location: string;
  delivery_location: string;
  delivery_type: string;
  status: string;
  actual_price?: number;
  created_at: string;
}

export const ActivityHistory = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, dateRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActivities(),
        loadBookings(),
        loadDeliveries()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActivities(data);
    }
  };

  const loadBookings = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    const { data, error } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
  };

  const loadDeliveries = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDeliveries(data);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport':
        return <Car className="h-4 w-4 text-blue-500" />;
      case 'delivery':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'payment':
        return <Wallet className="h-4 w-4 text-purple-500" />;
      case 'profile':
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, label: 'En attente' },
      confirmed: { variant: 'default' as const, label: 'Confirmé' },
      in_progress: { variant: 'secondary' as const, label: 'En cours' },
      completed: { variant: 'default' as const, label: 'Terminé' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || activity.activity_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery_location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement de l'historique...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'activité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="delivery">Livraison</SelectItem>
                <SelectItem value="payment">Paiement</SelectItem>
                <SelectItem value="profile">Profil</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 derniers mois</SelectItem>
                <SelectItem value="365">Dernière année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Activités générales</TabsTrigger>
          <TabsTrigger value="transport">Courses</TabsTrigger>
          <TabsTrigger value="deliveries">Livraisons</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardContent className="p-6">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune activité trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="mt-1">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.created_at).toLocaleString('fr-FR')}
                        </p>
                        {activity.metadata && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatAmount(activity.amount)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport">
          <Card>
            <CardContent className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune course trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-sm">{booking.vehicle_type}</span>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Départ:</span>
                          <span>{booking.pickup_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span className="text-muted-foreground">Arrivée:</span>
                          <span>{booking.destination}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleString('fr-FR')}
                        </span>
                        {booking.actual_price && (
                          <span className="font-medium">{formatAmount(booking.actual_price)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardContent className="p-6">
              {filteredDeliveries.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune livraison trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((delivery) => (
                    <div key={delivery.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">{delivery.delivery_type}</span>
                        </div>
                        {getStatusBadge(delivery.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">Collecte:</span>
                          <span>{delivery.pickup_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span className="text-muted-foreground">Livraison:</span>
                          <span>{delivery.delivery_location}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {new Date(delivery.created_at).toLocaleString('fr-FR')}
                        </span>
                        {delivery.actual_price && (
                          <span className="font-medium">{formatAmount(delivery.actual_price)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};