import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { RoleSelectionPage } from './RoleSelectionPage';
import { ClientRegistrationForm } from './forms/ClientRegistrationForm';
import { DriverRegistrationForm } from './forms/DriverRegistrationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthStatusChecker } from './AuthStatusChecker';

type AuthStep = 'login' | 'role-selection' | 'registration';

export const EnhancedAuth = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const { user } = useAuth();
  const { userRole, loading: roleLoading, getRedirectPath } = useRoleBasedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Rediriger si l'utilisateur est déjà connecté et a un rôle
  useEffect(() => {
    if (user && userRole && !roleLoading) {
      const redirectPath = getRedirectPath(userRole.role);
      navigate(redirectPath);

      console.log(user,userRole);
    }
  }, [user, userRole, roleLoading, navigate, getRedirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        console.log(error);
        throw error;
      }

      // Récupérer l'utilisateur connecté
      const user = data.user;

      if (user) {
        const role = user.user_metadata?.role;

        if (role === "chauffeur") {
          navigate("/chauffeur");
        } else if (role === "simple_user_client") {
          navigate("/client");
        } else if (role === "partenaire") {
          navigate("/partenaire");
        } else if (role === "admin") {
          navigate("/admin");
        } else {
          // fallback si rôle non reconnu
          navigate("/");
        }

        toast({
          title: "Connexion réussie !",
          description: "Redirection en cours...",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setStep('registration');
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "Inscription réussie !",
      description: "Vous pouvez maintenant vous connecter",
    });
    setStep('login');
    setActiveTab('login');
  };

  const handleBackToRoleSelection = () => {
    setStep('role-selection');
  };

  const handleBackToLogin = () => {
    setStep('login');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (step === 'role-selection') {
    return <RoleSelectionPage onRoleSelect={handleRoleSelection} />;
  }

  if (step === 'registration') {
    if (selectedRole === 'simple_user_client') {
      return (
        <ClientRegistrationForm
          onSuccess={handleRegistrationSuccess}
          onBack={handleBackToRoleSelection}
        />
      );
    }
    if (selectedRole === 'chauffeur') {
      return (
        <DriverRegistrationForm
          onSuccess={handleRegistrationSuccess}
          onBack={handleBackToRoleSelection}
        />
      );
    }
    // Pour les autres rôles (admin, partenaire), on peut les ajouter plus tard
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Formulaire en développement</CardTitle>
            <CardDescription>
              Le formulaire pour ce type de compte sera bientôt disponible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToRoleSelection} className="w-full">
              Retour au choix du rôle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Page de connexion/inscription
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Kwenda</CardTitle>
          <CardDescription>
            Votre plateforme de transport et livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choisissez votre type de compte pour commencer
                </p>
                <Button
                  onClick={() => setStep('role-selection')}
                  className="w-full"
                >
                  Créer un compte
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <AuthStatusChecker compact />
            
            <div className="text-center">
              <Button variant="link" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};