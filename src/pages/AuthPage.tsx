/**
 * Interface d'authentification et gestion des accès admin
 * Connexion sécurisée avec gestion des rôles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserRoleData } from '@/types/roles';
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Users,
  Settings,
  Crown,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess?: (user: User, session: Session) => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  
  // Formulaires
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [adminForm, setAdminForm] = useState({ email: '' });

  // État de l'authentification
  useEffect(() => {
    // Configuration des listeners d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Charger les rôles utilisateur après connexion
          setTimeout(() => {
            loadUserRoles(session.user.id);
          }, 0);
          
          if (onAuthSuccess) {
            onAuthSuccess(session.user, session);
          }
        } else {
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Vérifier s'il y a déjà une session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  const loadUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  // Connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie ✅",
        description: "Bienvenue dans l'interface d'administration",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Inscription
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (signupForm.password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Inscription réussie ✅",
        description: "Vérifiez votre email pour confirmer votre compte",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Créer un super admin
  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir l'email de l'administrateur",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Utiliser directement Supabase client au lieu de RPC
      const { data: users, error: userError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'admin',
          admin_role: 'super_admin',
          is_active: true
        }])
        .select();

      if (userError) throw userError;

      toast({
        title: "Super Admin créé ✅",
        description: `Accès administrateur accordé à ${adminForm.email}`,
        variant: "default"
      });

      setAdminForm({ email: '' });
      
      // Recharger les rôles si c'est l'utilisateur actuel
      if (user?.email === adminForm.email) {
        loadUserRoles(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'administrateur",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'driver': return 'secondary';
      case 'partner': return 'outline';
      default: return 'secondary';
    }
  };

  const getAdminRoleIcon = (adminRole?: string) => {
    switch (adminRole) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'content_moderator': return <Shield className="h-4 w-4" />;
      case 'finance_admin': return <Settings className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Interface utilisateur connecté
  if (user) {
    const isAdmin = userRoles.some(role => role.role === 'admin');
    const isSuperAdmin = userRoles.some(role => role.admin_role === 'super_admin');

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header utilisateur */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Connecté en tant que {user.email}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    {userRoles.map((role) => (
                      <Badge 
                        key={role.id} 
                        variant={getRoleBadgeVariant(role.role)}
                        className="flex items-center gap-1"
                      >
                        {role.admin_role && getAdminRoleIcon(role.admin_role)}
                        {role.admin_role || role.role}
                      </Badge>
                    ))}
                    {userRoles.length === 0 && (
                      <Badge variant="secondary">client</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Se déconnecter
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Informations administrateur */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Accès Administrateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Vous avez accès à l'interface d'administration. 
                    Vous pouvez maintenant gérer les services de livraison, 
                    les tarifs et les utilisateurs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Création super admin (si pas encore super admin) */}
          {!isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Créer un Super Administrateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">Email de l'administrateur</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ email: e.target.value })}
                      placeholder="admin@kwenda.app"
                    />
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Ceci accordera des privilèges d'administration complets 
                      à l'utilisateur spécifié. Assurez-vous que l'email 
                      correspond à un compte existant.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Créer Super Admin
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Interface de connexion/inscription
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Interface d'Administration</h1>
          <p className="text-muted-foreground">Kwenda - Gestion des Services</p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Connexion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Inscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Créer un compte
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;