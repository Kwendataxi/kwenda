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
import { Search, Users, Shield, Settings, UserCheck, Crown } from 'lucide-react';
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

export const RoleManagement = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useUserRoles();
  const { assignRole, removeRole, loading } = useRoleManagement();
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | undefined>();
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users with their roles
  const fetchUsersWithRoles = async () => {
    try {
      setLoadingUsers(true);
      
      // Get all users from auth
      const { data: authData, error: authError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .limit(100);

      if (authError) throw authError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          admin_role,
          assigned_at,
          is_active
        `);

      if (rolesError) throw rolesError;

      // Get auth users data
      const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = authUsers.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        userRoles: rolesData?.filter(r => r.user_id === user.id) || []
      }));

      setUsers(usersWithRoles);
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

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsersWithRoles();
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Rôles</h1>
          <p className="text-muted-foreground">
            Gérez les rôles et permissions des utilisateurs
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Crown className="w-4 h-4" />
          Super Admin uniquement
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Utilisateurs</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administrateurs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.userRoles.some(r => r.role === 'admin')).length}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.userRoles.some(r => r.role === 'driver')).length}
                </p>
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
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.userRoles.some(r => r.role === 'partner')).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          <CardTitle>Utilisateurs et Rôles</CardTitle>
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
                  <TableHead>Rôles</TableHead>
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
                        <div className="text-sm text-muted-foreground">{user.id}</div>
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
    </div>
  );
};