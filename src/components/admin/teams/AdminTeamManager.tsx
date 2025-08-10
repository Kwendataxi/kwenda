import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Building,
  TrendingUp,
  CreditCard,
  UserCheck,
  BarChart3,
  Download,
  Calendar
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeamAccount {
  id: string;
  name: string;
  contact_email: string;
  industry?: string;
  team_size?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  member_count: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  pendingTeams: number;
  totalMembers: number;
  totalRevenue: number;
  avgMembersPerTeam: number;
}

export const AdminTeamManager = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamAccount[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    activeTeams: 0,
    pendingTeams: 0,
    totalMembers: 0,
    totalRevenue: 0,
    avgMembersPerTeam: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamAccount | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Charger les données des équipes
  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Mock data pour le moment - sera remplacé par la vraie requête
      const mockTeams: TeamAccount[] = [
        {
          id: '1',
          name: 'TechCorp DRC',
          contact_email: 'admin@techcorp.cd',
          industry: 'Technologie',
          team_size: '11-50',
          status: 'active',
          member_count: 25,
          total_spent: 150000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'LogiTrans SARL',
          contact_email: 'contact@logitrans.cd',
          industry: 'Logistique',
          team_size: '51-200',
          status: 'pending',
          member_count: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Finance Plus',
          contact_email: 'team@financeplus.cd',
          industry: 'Finance',
          team_size: '1-10',
          status: 'suspended',
          member_count: 8,
          total_spent: 45000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setTeams(mockTeams);
      setFilteredTeams(mockTeams);

      // Calculer les statistiques
      const newStats: TeamStats = {
        totalTeams: mockTeams.length,
        activeTeams: mockTeams.filter(t => t.status === 'active').length,
        pendingTeams: mockTeams.filter(t => t.status === 'pending').length,
        totalMembers: mockTeams.reduce((sum, t) => sum + t.member_count, 0),
        totalRevenue: mockTeams.reduce((sum, t) => sum + t.total_spent, 0),
        avgMembersPerTeam: mockTeams.length > 0 ? 
          Math.round(mockTeams.reduce((sum, t) => sum + t.member_count, 0) / mockTeams.length) : 0
      };
      setStats(newStats);

    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des équipes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Filtrer les équipes
  useEffect(() => {
    let filtered = teams;

    if (searchQuery) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(team => team.status === statusFilter);
    }

    setFilteredTeams(filtered);
  }, [teams, searchQuery, statusFilter]);

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      // Mock update - sera remplacé par la vraie requête
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId ? { ...team, status: newStatus as any } : team
        )
      );

      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'équipe a été modifié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspendu</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', { 
      style: 'currency', 
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Équipes</h1>
          <p className="text-muted-foreground">
            Gérez et supervisez tous les comptes équipe de la plateforme
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Équipes</p>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Équipes Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeTeams}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Membres</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des équipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Équipes ({filteredTeams.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Équipe</TableHead>
                <TableHead>Industrie</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dépenses</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.contact_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{team.industry || 'Non spécifié'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {team.member_count}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(team.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(team.total_spent)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(team.created_at).toLocaleDateString('fr-FR')}
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
                          setSelectedTeam(team);
                          setShowDetails(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {team.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'active')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approuver
                          </DropdownMenuItem>
                        )}
                        {team.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'suspended')}>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Suspendre
                          </DropdownMenuItem>
                        )}
                        {team.status === 'suspended' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'active')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Réactiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune équipe trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Détails de l'équipe
            </DialogTitle>
          </DialogHeader>
          
          {selectedTeam && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="members">Membres</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Informations générales</h4>
                        <p><strong>Nom:</strong> {selectedTeam.name}</p>
                        <p><strong>Email:</strong> {selectedTeam.contact_email}</p>
                        <p><strong>Industrie:</strong> {selectedTeam.industry || 'Non spécifié'}</p>
                        <p><strong>Taille:</strong> {selectedTeam.team_size || 'Non spécifié'}</p>
                        <p><strong>Statut:</strong> {getStatusBadge(selectedTeam.status)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Statistiques</h4>
                        <p><strong>Membres:</strong> {selectedTeam.member_count}</p>
                        <p><strong>Total dépensé:</strong> {formatCurrency(selectedTeam.total_spent)}</p>
                        <p><strong>Créé le:</strong> {new Date(selectedTeam.created_at).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Mis à jour:</strong> {new Date(selectedTeam.updated_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Gestion des membres en cours de développement</p>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics détaillées en cours de développement</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};