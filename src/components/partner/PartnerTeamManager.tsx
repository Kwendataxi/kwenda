import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, Shield, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
}

const roleLabels: Record<string, { label: string; color: string; description: string }> = {
  admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700', description: 'Accès complet' },
  manager: { label: 'Gestionnaire', color: 'bg-blue-100 text-blue-700', description: 'Gestion des chauffeurs et véhicules' },
  accountant: { label: 'Comptable', color: 'bg-green-100 text-green-700', description: 'Accès aux finances uniquement' },
  viewer: { label: 'Observateur', color: 'bg-gray-100 text-gray-700', description: 'Lecture seule' },
};

export const PartnerTeamManager = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'viewer' as TeamMember['role']
  });

  useEffect(() => {
    // Charger les membres de l'équipe (simulation)
    // TODO: Implémenter la requête Supabase quand la table sera créée
  }, [user?.id]);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // TODO: Envoyer invitation par email via Edge Function
      const member: TeamMember = {
        id: Date.now().toString(),
        ...newMember,
        status: 'pending',
        addedAt: new Date().toISOString()
      };
      
      setTeamMembers(prev => [...prev, member]);
      toast.success('Invitation envoyée !', {
        description: `${newMember.name} recevra un email d'invitation`
      });
      
      setNewMember({ name: '', email: '', phone: '', role: 'viewer' });
      setShowAddDialog(false);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    toast.success('Membre supprimé de l\'équipe');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestion d'Équipe</h2>
          <p className="text-sm text-muted-foreground">
            Invitez des collaborateurs à gérer votre flotte
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Inviter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Jean Mukendi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jean@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+243 XXX XXX XXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value as TeamMember['role'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{value.label}</span>
                          <span className="text-xs text-muted-foreground">{value.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddMember} disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rôles disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rôles et Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(roleLabels).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Badge className={cn("shrink-0", value.color)}>
                  {value.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{value.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membres de l'équipe</CardTitle>
          <CardDescription>
            {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun membre dans votre équipe</p>
              <p className="text-sm">Invitez des collaborateurs pour déléguer la gestion</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={roleLabels[member.role].color}>
                      {roleLabels[member.role].label}
                    </Badge>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status === 'active' ? 'Actif' : member.status === 'pending' ? 'En attente' : 'Inactif'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
