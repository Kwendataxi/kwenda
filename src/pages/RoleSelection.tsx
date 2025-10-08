import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { UserRole } from '@/types/roles';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRoles, loading } = useUserRoles();
  const { selectedRole, setSelectedRole } = useSelectedRole();
  
  // Récupérer l'intention de connexion (driver/partner/client) si disponible
  const loginIntent = localStorage.getItem('kwenda_login_intent') as UserRole | null;
  const [tempSelectedRole, setTempSelectedRole] = useState<UserRole | null>(
    loginIntent || selectedRole || null
  );

  useEffect(() => {
    // Si une intention de connexion existe (ex: connexion via /driver/auth)
    if (loginIntent) {
      localStorage.removeItem('kwenda_login_intent');
      
      // Vérifier si l'utilisateur a bien ce rôle
      const availableRoles = userRoles.map(ur => ur.role as UserRole);
      const hasIntendedRole = availableRoles.includes(loginIntent);
      
      if (hasIntendedRole) {
        // Redirection automatique sans attendre le clic
        toast({
          title: "Redirection automatique",
          description: `Accès à votre espace ${loginIntent === 'driver' ? 'chauffeur' : loginIntent}`,
        });
        setSelectedRole(loginIntent);
        navigateToRole(loginIntent);
        return;
      }
    }
    
    // Si l'utilisateur n'a qu'un seul rôle, rediriger automatiquement
    if (!loading && userRoles.length === 1) {
      const role = userRoles[0].role as UserRole;
      setSelectedRole(role);
      navigateToRole(role);
    }
  }, [loading, userRoles, loginIntent]);

  const navigateToRole = (role: UserRole) => {
    const paths: Record<UserRole, string> = {
      admin: '/admin',
      partner: '/partenaire',
      driver: '/chauffeur',
      client: '/client'
    };
    navigate(paths[role] || '/');
  };

  const handleContinue = () => {
    if (tempSelectedRole) {
      setSelectedRole(tempSelectedRole);
      navigateToRole(tempSelectedRole);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se déconnecter"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availableRoles = userRoles.map(ur => ur.role as UserRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choisissez votre espace
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Vous avez plusieurs rôles. Sélectionnez celui que vous souhaitez utiliser maintenant.
          </p>
        </div>

        <RoleSelector
          availableRoles={availableRoles}
          onRoleSelect={setTempSelectedRole}
          selectedRole={tempSelectedRole}
        />

        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={handleContinue}
            disabled={!tempSelectedRole}
            size="lg"
            className="px-8"
          >
            Continuer
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
