import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  MoreHorizontal,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Activity,
  User
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EnhancedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: any;
  profile?: {
    display_name?: string;
    phone_number?: string;
    city?: string;
    user_type?: string;
  };
  roles: string[];
  status: 'active' | 'suspended' | 'pending';
  stats?: {
    totalOrders: number;
    totalSpent: number;
    lastActivity: string;
  };
}

interface UserStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  drivers: number;
  partners: number;
  clients: number;
  totalRevenue: number;
}

export const EnhancedUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [filters, setFilters] = useState({
    search: '',
    userType: 'all',
    status: 'all',
    dateRange: 'all',
    city: 'all'
  });

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    drivers: 0,
    partners: 0,
    clients: 0,
    totalRevenue: 0
  });

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Récupérer les utilisateurs auth
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Récupérer les profils clients
      const { data: clientProfiles } = await supabase
        .from('clients')
        .select('user_id, display_name, phone_number, city, role, is_active');

      // Récupérer les profils chauffeurs
      const { data: driverProfiles } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, phone_number, service_type, is_active, verification_status');

      // Récupérer les rôles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active');

      // Combiner les données
      const enhancedUsers: EnhancedUser[] = authData.users.map(authUser => {
        const clientProfile = clientProfiles?.find(p => p.user_id === authUser.id);
        const driverProfile = driverProfiles?.find(p => p.user_id === authUser.id);
        const roles = userRoles?.filter(r => r.user_id === authUser.id && r.is_active).map(r => r.role) || [];
        
        const profile = clientProfile || driverProfile;
        const isActive = clientProfile?.is_active ?? driverProfile?.is_active ?? true;

        return {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          user_metadata: authUser.user_metadata,
          profile: profile ? {
            display_name: profile.display_name,
            phone_number: profile.phone_number,
            city: clientProfile?.city || 'Kinshasa',
            user_type: driverProfile ? 'driver' : 'client'
          } : undefined,
          roles,
          status: (isActive ? 'active' : 'suspended') as 'active' | 'suspended' | 'pending',
          stats: {
            totalOrders: 0,
            totalSpent: 0,
            lastActivity: authUser.last_sign_in_at || authUser.created_at
          }
        };
      });

      setUsers(enhancedUsers);
      applyFilters(enhancedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Compter les utilisateurs par type
      const { data: clientCount } = await supabase
        .from('clients')
        .select('user_id', { count: 'exact' });

      const { data: driverCount } = await supabase
        .from('chauffeurs')
        .select('user_id', { count: 'exact' });

      // Calculer les revenus (exemple basique)
      const { data: orderRevenue } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('status', 'completed');

      const totalRevenue = orderRevenue?.reduce((sum, order) => sum + (order.actual_price || 0), 0) || 0;

      const newStats: UserStats = {
        totalUsers: users.length,
        newUsers: users.filter(u => 
          new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        activeUsers: users.filter(u => u.status === 'active').length,
        suspendedUsers: users.filter(u => u.status === 'suspended').length,
        drivers: driverCount?.length || 0,
        partners: 0, // À implémenter
        clients: clientCount?.length || 0,
        totalRevenue
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const applyFilters = (userList: EnhancedUser[] = users) => {
    let filtered = [...userList];

    // Recherche textuelle
    if (filters.search) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.profile?.display_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.profile?.phone_number?.includes(filters.search)
      );
    }

    // Filtre par type
    if (filters.userType !== 'all') {
      filtered = filtered.filter(user => 
        user.profile?.user_type === filters.userType || user.roles.includes(filters.userType)
      );
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Filtre par ville
    if (filters.city !== 'all') {
      filtered = filtered.filter(user => user.profile?.city === filters.city);
    }

    // Filtre par date
    if (filters.dateRange !== 'all') {
      const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => new Date(user.created_at) > cutoff);
    }

    setFilteredUsers(filtered);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins un utilisateur",
        variant: "destructive"
      });
      return;
    }

    try {
      if (action === 'activate') {
        // Activer les utilisateurs
        await Promise.all([
          supabase.from('clients').update({ is_active: true }).in('user_id', selectedUsers),
          supabase.from('chauffeurs').update({ is_active: true }).in('user_id', selectedUsers)
        ]);
      } else if (action === 'suspend') {
        // Suspendre les utilisateurs
        await Promise.all([
          supabase.from('clients').update({ is_active: false }).in('user_id', selectedUsers),
          supabase.from('chauffeurs').update({ is_active: false }).in('user_id', selectedUsers)
        ]);
      } else if (action === 'delete') {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateurs ?`)) {
          return;
        }
        // Supprimer les utilisateurs (attention: irréversible)
        for (const userId of selectedUsers) {
          await supabase.auth.admin.deleteUser(userId);
        }
      }

      toast({
        title: "Action effectuée",
        description: `${selectedUsers.length} utilisateurs ont été traités`,
      });

      setSelectedUsers([]);
      fetchData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Email', 'Nom', 'Type', 'Ville', 'Statut', 'Date Création'],
      ...filteredUsers.map(user => [
        user.email,
        user.profile?.display_name || '',
        user.profile?.user_type || '',
        user.profile?.city || '',
        user.status,
        new Date(user.created_at).toLocaleDateString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Avancée des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Vue complète et gestion des utilisateurs avec analytics détaillées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Nouveaux</p>
                <p className="text-xl font-bold">{stats.newUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Suspendus</p>
                <p className="text-xl font-bold">{stats.suspendedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Chauffeurs</p>
                <p className="text-xl font-bold">{stats.drivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="text-xl font-bold">{stats.clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-xs text-muted-foreground">Partenaires</p>
                <p className="text-xl font-bold">{stats.partners}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Revenus</p>
                <p className="text-xl font-bold">{stats.totalRevenue.toLocaleString()} FC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email, nom, téléphone..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filters.userType} onValueChange={(value) => setFilters(prev => ({ ...prev, userType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="driver">Chauffeurs</SelectItem>
                <SelectItem value="partner">Partenaires</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                <SelectItem value="Abidjan">Abidjan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions en masse */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                  Désélectionner tout
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleBulkAction('activate')}>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Activer
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>
                  <UserX className="h-4 w-4 mr-1" />
                  Suspendre
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs ({filteredUsers.length})
            {filters.search && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Résultats pour "{filters.search}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(paginatedUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun utilisateur trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.profile?.display_name || 'Sans nom'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.profile?.phone_number && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.profile.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={user.profile?.user_type === 'driver' ? 'default' : 'secondary'}>
                          {user.profile?.user_type === 'driver' ? 'Chauffeur' : 'Client'}
                        </Badge>
                        {user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {user.profile?.city || 'Non spécifiée'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'destructive' : 'secondary'}>
                        {user.status === 'active' ? 'Actif' : user.status === 'suspended' ? 'Suspendu' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.last_sign_in_at ? (
                          <>
                            <div>{new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.last_sign_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Jamais connecté</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Contacter
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails utilisateur */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                  <p className="font-medium">{selectedUser.profile?.display_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedUser.profile?.phone_number || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ville</Label>
                  <p className="font-medium">{selectedUser.profile?.city || 'Non renseignée'}</p>
                </div>
              </div>

              {/* Statistiques */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Statistiques</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{selectedUser.stats?.totalOrders || 0}</p>
                      <p className="text-xs text-muted-foreground">Commandes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{selectedUser.stats?.totalSpent || 0} FC</p>
                      <p className="text-xs text-muted-foreground">Dépensé</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{selectedUser.roles.length}</p>
                      <p className="text-xs text-muted-foreground">Rôles</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant={selectedUser.status === 'active' ? 'outline' : 'default'} size="sm">
                  {selectedUser.status === 'active' ? 'Suspendre' : 'Activer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};