import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Shield, Settings, UserCheck, Crown, History, FileText, AlertTriangle } from 'lucide-react';
import { UserRole, AdminRole, ROLE_LABELS, ADMIN_ROLE_LABELS } from '@/types/roles';

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  userRoles: Array<{
    role: UserRole;
    admin_role?: AdminRole;
    assigned_at: string;
    is_active: boolean;
  }>;
}

interface RoleHistory {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

export const EnhancedRoleManagement = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useUserRoles();
  const { assignRole, removeRole, loading } = useRoleManagement();
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | undefined>();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Statistiques des rôles
  const [roleStats, setRoleStats] = useState({
    totalUsers: 0,
    admins: 0,
    drivers: 0,
    partners: 0,
    clients: 0,
    recentAssignments: 0
  });

  // Charger les utilisateurs avec leurs rôles (sans auth.admin.listUsers())
  const fetchUsersWithRoles = async () => {
    try {
      setLoadingUsers(true);
      
      // Récupérer les rôles utilisateurs avec les infos de profil
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Récupérer les profils clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('user_id, display_name, email');

      // Récupérer les profils chauffeurs
      const { data: driversData } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, email');

      // Récupérer les profils admins
      const { data: adminsData } = await supabase
        .from('admins')
        .select('user_id, display_name, email');

      // Créer un map des profils pour recherche rapide
      const profilesMap = new Map<string, { email: string; displayName: string }>();
      
      clientsData?.forEach(c => profilesMap.set(c.user_id, { email: c.email, displayName: c.display_name }));
      driversData?.forEach(d => profilesMap.set(d.user_id, { email: d.email, displayName: d.display_name || '' }));
      adminsData?.forEach(a => profilesMap.set(a.user_id, { email: a.email, displayName: a.display_name }));

      // Grouper les rôles par user_id
      const userRolesMap = new Map<string, Array<{
        role: UserRole;
        admin_role?: AdminRole;
        assigned_at: string;
        is_active: boolean;
      }>>();

      rolesData?.forEach(r => {
        const userId = r.user_id;
        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        userRolesMap.get(userId)!.push({
          role: r.role as UserRole,
          admin_role: r.admin_role as AdminRole | undefined,
          assigned_at: r.assigned_at,
          is_active: r.is_active
        });
      });

      // Construire la liste des utilisateurs
      const usersWithRoles: UserWithRoles[] = Array.from(userRolesMap.entries()).map(([userId, roles]) => {
        const profile = profilesMap.get(userId);
        return {
          id: userId,
          email: profile?.email || 'Email inconnu',
          created_at: roles[0]?.assigned_at || new Date().toISOString(),
          userRoles: roles
        };
      });

      setUsers(usersWithRoles);

      // Calculer les statistiques
      const stats = {
        totalUsers: usersWithRoles.length,
        admins: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'admin')).length,
        drivers: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'driver')).length,
        partners: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'partner')).length,
        clients: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'client')).length,
        recentAssignments: rolesData?.filter(r => 
          new Date(r.assigned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0
      };
      setRoleStats(stats);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Charger l'historique des rôles
  const fetchRoleHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'role_assignment')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setRoleHistory(data || []);
    } catch (error) {
      console.error('Error fetching role history:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsersWithRoles();
      fetchRoleHistory();
    }
  }, [isSuperAdmin]);

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    const success = await assignRole(
      selectedUser.id, 
      selectedRole, 
      selectedRole === 'admin' ? selectedAdminRole : undefined
    );

    if (success) {
      toast({
        title: "Rôle assigné",
        description: `Le rôle ${ROLE_LABELS[selectedRole]} a été assigné avec succès.`,
      });
      fetchUsersWithRoles();
      setSelectedUser(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: UserRole, adminRole?: AdminRole) => {
    const success = await removeRole(userId, role, adminRole);

    if (success) {
      toast({
        title: "Rôle retiré",
        description: `Le rôle a été retiré avec succès.`,
      });
      fetchUsersWithRoles();
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Accès refusé</p>
            <p className="text-muted-foreground">Seuls les super administrateurs peuvent gérer les rôles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Avancée des Rôles</h1>
          <p className="text-muted-foreground">
            Gérez les rôles, permissions et accès des utilisateurs avec audit complet
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Crown className="w-4 h-4" />
          Super Admin uniquement
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{roleStats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-blue-600">{roleStats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chauffeurs</p>
                <p className="text-2xl font-bold text-green-600">{roleStats.drivers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partenaires</p>
                <p className="text-2xl font-bold text-purple-600">{roleStats.partners}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold text-orange-600">{roleStats.clients}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Récents</p>
                <p className="text-2xl font-bold text-emerald-600">{roleStats.recentAssignments}</p>
              </div>
              <History className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Utilisateurs & Rôles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un utilisateur par email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs et Rôles ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôles Actuels</TableHead>
                      <TableHead>Date création</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.id.substring(0, 8)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.userRoles.length === 0 ? (
                              <Badge variant="outline">Aucun rôle</Badge>
                            ) : (
                              user.userRoles.map((userRole, index) => (
                                <Badge 
                                  key={index}
                                  variant={userRole.role === 'admin' ? 'default' : 'secondary'}
                                  className="gap-1"
                                >
                                  {ROLE_LABELS[userRole.role]}
                                  {userRole.admin_role && ` (${ADMIN_ROLE_LABELS[userRole.admin_role]})`}
                                  <button
                                    onClick={() => handleRemoveRole(user.id, userRole.role, userRole.admin_role)}
                                    className="ml-1 text-xs hover:text-red-500"
                                    disabled={loading}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                Gérer rôles
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assigner un rôle à {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Rôle principal</label>
                                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="client">Client</SelectItem>
                                      <SelectItem value="driver">Chauffeur</SelectItem>
                                      <SelectItem value="partner">Partenaire</SelectItem>
                                      <SelectItem value="admin">Administrateur</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {selectedRole === 'admin' && (
                                  <div>
                                    <label className="text-sm font-medium">Rôle administrateur</label>
                                    <Select value={selectedAdminRole} onValueChange={(value) => setSelectedAdminRole(value as AdminRole)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un rôle admin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="super_admin">Super Administrateur</SelectItem>
                                        <SelectItem value="admin_financier">Admin Financier</SelectItem>
                                        <SelectItem value="admin_transport">Admin Transport</SelectItem>
                                        <SelectItem value="admin_marketplace">Admin Marketplace</SelectItem>
                                        <SelectItem value="admin_support">Admin Support</SelectItem>
                                        <SelectItem value="moderator">Modérateur</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="flex justify-end gap-2">
                                  <Button 
                                    onClick={handleAssignRole}
                                    disabled={loading || !selectedUser || (selectedRole === 'admin' && !selectedAdminRole)}
                                  >
                                    Assigner le rôle
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Matrice des Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Super Admin:</strong> Accès complet à toutes les fonctionnalités</p>
                <p><strong>Admin Financier:</strong> Gestion des finances, commissions, crédits</p>
                <p><strong>Admin Transport:</strong> Gestion des chauffeurs, zones, tarifs</p>
                <p><strong>Admin Marketplace:</strong> Modération des produits et commandes</p>
                <p><strong>Admin Support:</strong> Gestion des tickets et support client</p>
                <p><strong>Modérateur:</strong> Modération du contenu utilisateur</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des Assignations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roleHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun historique disponible</p>
                ) : (
                  roleHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{entry.activity_type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};