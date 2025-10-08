import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, Car, Bike, Navigation } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';
import { Link } from 'react-router-dom';

interface DriverLoginProps {
  onSuccess?: () => void;
}

export const DriverLogin = ({ onSuccess }: DriverLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Vérifier que l'utilisateur a bien le rôle driver
        const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: data.user.id
        });

        if (rolesError) {
          logger.error('Error fetching user roles', rolesError);
          throw new Error('Erreur lors de la vérification du rôle');
        }

        const hasDriverRole = roles?.some((r: any) => r.role === 'driver');

        if (!hasDriverRole) {
          await supabase.auth.signOut();
          
          // Suggérer la bonne page selon le rôle
          const otherRole = roles?.[0]?.role;
          let suggestion = '';
          
          if (otherRole === 'client') {
            suggestion = ' Connectez-vous via l\'espace client.';
          } else if (otherRole === 'partner') {
            suggestion = ' Connectez-vous via l\'espace partenaire.';
          } else if (otherRole === 'admin') {
            suggestion = ' Connectez-vous via l\'espace admin.';
          }
          
          setError('Ce compte n\'est pas un compte chauffeur.' + suggestion);
          setLoading(false);
          return;
        }

        // Gérer les multi-rôles
        const userRoles = roles || [];
        
        if (userRoles.length === 1) {
          // Un seul rôle → Redirection directe
          toast({
            title: "Connexion réussie !",
            description: "Bienvenue dans votre espace chauffeur",
          });
          
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/chauffeur');
          }
        } else {
          // Plusieurs rôles → Sauvegarder une "intention" puis laisser ProtectedRoute gérer
          toast({
            title: "Connexion réussie !",
            description: "Sélectionnez votre espace de travail",
          });
          
          // Sauvegarder que l'utilisateur vient de la page driver
          localStorage.setItem('kwenda_login_intent', 'driver');
          
          // Laisser ProtectedRoute rediriger vers /role-selection
          navigate('/chauffeur'); // Sera intercepté par ProtectedRoute
        }
      }
    } catch (error: any) {
      logger.error('Driver login error', error);
      setError(error.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Arrière-plan dynamique jaune/orange professionnel */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20 dark:from-yellow-600/30 dark:via-orange-600/25 dark:to-amber-600/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.25),transparent_50%)]" />
      
      {/* Formes géométriques jaune/orange */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500/15 dark:bg-yellow-600/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/15 dark:bg-orange-600/25 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-amber-500/15 dark:bg-amber-600/25 rounded-full blur-2xl animate-pulse delay-500" />

      <div className="w-full max-w-md relative z-10">
        {/* En-tête avec logo et badge professionnel */}
        <div className="text-center mb-8 space-y-4 animate-fade-in">
          {/* Logo dans fond avec thème jaune */}
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white dark:bg-black shadow-2xl shadow-orange-600/50 dark:shadow-orange-500/60 mb-6 ring-2 ring-orange-500/40 dark:ring-orange-400/50 overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-orange-500/20 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite]" />
            <BrandLogo size={80} className="relative z-10 animate-float" />
          </div>
          
          {/* Badge professionnel */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 border-2 border-orange-300 dark:border-orange-700/60 mb-4">
            <Car className="w-5 h-5 text-orange-700 dark:text-orange-400" />
            <span className="text-sm font-bold text-orange-800 dark:text-orange-300">
              Espace Professionnel Chauffeur
            </span>
          </div>
          
          <h1 className="text-5xl font-bold animate-gradient bg-gradient-to-r from-yellow-700 via-orange-600 to-amber-600 dark:from-yellow-500 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-lg">
            Kwenda Driver
          </h1>
          
          <p className="text-base text-gray-700 dark:text-gray-200 drop-shadow-sm">
            Gérez vos courses et maximisez vos gains 🚗
          </p>
        </div>

        {/* Carte de connexion avec thème jaune/orange */}
        <Card className="relative shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-white/10 overflow-hidden animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/25 via-orange-500/20 to-amber-500/25 dark:from-yellow-500/35 dark:via-orange-600/30 dark:to-amber-500/35 opacity-50 pointer-events-none" />
          
          <CardContent className="pt-8 pb-6 relative z-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Champ Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-100">
                  Adresse email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="chauffeur@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-600 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-600/25 dark:focus:ring-orange-500/25 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-100">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-12 pr-14 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-600 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-600/25 dark:focus:ring-orange-500/25 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Bouton de connexion avec gradient jaune/orange */}
              <Button 
                type="submit" 
                className="relative w-full h-14 bg-gradient-to-r from-yellow-600 via-orange-500 to-amber-500 hover:from-yellow-700 hover:via-orange-600 hover:to-amber-600 dark:from-yellow-600 dark:via-orange-500 dark:to-amber-500 dark:hover:from-yellow-500 dark:hover:via-orange-400 dark:hover:to-amber-400 text-white text-base font-bold rounded-xl shadow-xl shadow-orange-600/50 dark:shadow-orange-500/50 hover:shadow-2xl hover:shadow-orange-600/60 dark:hover:shadow-orange-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group" 
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? 'Connexion...' : 'Se connecter'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>

              {/* Lien mot de passe oublié */}
              <div className="flex items-center justify-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold underline-offset-4 hover:underline transition-all"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>

            {/* Footer avec liens vers autres espaces */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <p className="text-sm text-muted-foreground">
                Pas chauffeur ?
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <Link to="/auth" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                  Espace Client
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/partner/auth" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                  Espace Partenaire
                </Link>
              </div>
              
              <div className="pt-2">
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Retour à l'accueil
                </Link>
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
