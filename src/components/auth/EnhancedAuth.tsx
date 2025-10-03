import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { RoleSelectionPage } from './RoleSelectionPage';
import { ClientRegistrationForm } from './forms/ClientRegistrationForm';
import { DriverRegistrationChoice } from '@/components/driver/registration/DriverRegistrationChoice';
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
import { ForgotPasswordModal } from './ForgotPasswordModal';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
    // Pour les chauffeurs/livreurs, aller directement au formulaire d'inscription
    if (role === 'taxi_driver' || role === 'delivery_driver') {
      setStep('registration');
    } else {
      setStep('registration');
    }
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
    if (selectedRole === 'taxi_driver' || selectedRole === 'delivery_driver') {
      return (
        <DriverRegistrationChoice
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 dark:from-red-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent mb-3">
            Kwenda
          </h1>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Votre plateforme de transport et livraison
          </p>
        </div>

        <Card className="shadow-2xl dark:bg-gray-800/95 dark:border-gray-700/60 backdrop-blur-sm border-red-100 dark:border-red-900/30">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-gray-100 dark:bg-gray-900/50">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white dark:data-[state=active]:from-red-500 dark:data-[state=active]:to-orange-500 transition-all duration-200"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white dark:data-[state=active]:from-red-500 dark:data-[state=active]:to-orange-500 transition-all duration-200"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-5">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold dark:text-gray-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      className="h-12 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold dark:text-gray-200">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="h-12 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="dark:border-red-900 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="dark:text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Se connecter
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Mot de passe oublié ?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-5">
                <div className="text-center space-y-5 py-4">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-base text-gray-700 dark:text-gray-200 font-medium mb-4">
                      Choisissez votre type de compte pour commencer
                    </p>
                    <Button
                      onClick={() => setStep('role-selection')}
                      className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Créer un compte
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 space-y-4">
              <AuthStatusChecker compact />
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  ← Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};