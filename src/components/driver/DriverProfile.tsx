import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Star, 
  Car, 
  Wallet, 
  Trophy, 
  Calendar,
  CreditCard,
  Plus,
  History,
  Settings,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DriverChallenges } from './DriverChallenges';
import { DriverReferrals } from './DriverReferrals';

interface DriverProfile {
  id: string;
  display_name: string;
  phone_number: string;
  avatar_url: string | null;
  user_type: string;
}

interface DriverRequest {
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_year: number;
  status: string;
}

interface DriverStats {
  totalRides: number;
  avgRating: number;
  joinDate: string;
}

export const DriverProfile = () => {
  const { user } = useAuth();
  const { wallet, transactions, loading: walletLoading, topUpWallet } = useWallet();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [driverRequest, setDriverRequest] = useState<DriverRequest | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpProvider, setTopUpProvider] = useState('');
  const [topUpPhone, setTopUpPhone] = useState('');

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load driver request (vehicle info)
      const { data: driverData, error: driverError } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (driverError) throw driverError;
      setDriverRequest(driverData);

      // Load driver stats
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('id, status')
        .eq('driver_id', user.id);

      if (bookingsError) throw bookingsError;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id);

      if (ratingsError) throw ratingsError;

      const completedRides = bookingsData?.filter(b => b.status === 'completed').length || 0;
      const avgRating = ratingsData?.length 
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length 
        : 0;

      setStats({
        totalRides: completedRides,
        avgRating: avgRating,
        joinDate: profileData?.created_at || new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error loading driver data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || !topUpProvider || !topUpPhone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(topUpAmount);
    if (amount < 1000) {
      toast.error('Le montant minimum est de 1000 CDF');
      return;
    }

    const success = await topUpWallet(amount, topUpProvider, topUpPhone);
    if (success) {
      setShowTopUpModal(false);
      setTopUpAmount('');
      setTopUpProvider('');
      setTopUpPhone('');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getJoinDuration = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? `${months} mois` : 'Nouveau';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.display_name || 'Chauffeur'}</h2>
              <p className="text-muted-foreground">{profile?.phone_number}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{stats?.avgRating.toFixed(1) || '0.0'}</span>
                </div>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {stats ? getJoinDuration(stats.joinDate) : 'Nouveau'}
                </Badge>
                <Badge variant="outline">
                  {stats?.totalRides || 0} courses
                </Badge>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Badge className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Chauffeur Actif
              </Badge>
              {stats && stats.totalRides > 100 && (
                <Badge className="bg-purple-100 text-purple-800">
                  Expert
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      {driverRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Véhicule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <p className="font-medium">{driverRequest.vehicle_type}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Modèle</Label>
                <p className="font-medium">{driverRequest.vehicle_model}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Plaque</Label>
                <p className="font-medium">{driverRequest.vehicle_plate}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Année</Label>
                <p className="font-medium">{driverRequest.vehicle_year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Portefeuille</span>
            </div>
            <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Recharger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recharger le portefeuille</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Montant (CDF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="1000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Fournisseur</Label>
                    <Select value={topUpProvider} onValueChange={setTopUpProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="airtel">Airtel Money</SelectItem>
                        <SelectItem value="orange">Orange Money</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+243..."
                      value={topUpPhone}
                      onChange={(e) => setTopUpPhone(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    className="w-full"
                    disabled={walletLoading}
                  >
                    {walletLoading ? 'Traitement...' : 'Recharger'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-3xl font-bold text-primary">
                {wallet ? formatAmount(wallet.balance) : '0 CDF'}
              </p>
            </div>
            
            {transactions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <History className="h-4 w-4" />
                  <span className="font-medium">Transactions récentes</span>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={`font-medium ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Portefeuille
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Parrainages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Actions rapides</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 flex flex-col space-y-1">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Historique complet</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col space-y-1">
                  <User className="h-5 w-5" />
                  <span className="text-sm">Modifier profil</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <DriverChallenges />
        </TabsContent>

        <TabsContent value="referrals">
          <DriverReferrals />
        </TabsContent>
      </Tabs>
    </div>
  );
};