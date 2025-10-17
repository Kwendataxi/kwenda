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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* En-tête épuré avec logo et badge */}
        <div className="text-center mb-10 space-y-6 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-6 overflow-hidden hover:scale-105 transition-transform duration-300">
            <BrandLogo size={72} />
          </div>
          
          {/* Badge professionnel simplifié */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Car className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Espace Chauffeur
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Kwenda Driver
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            Gérez vos courses et maximisez vos gains
          </p>
        </div>

        {/* Carte de connexion professionnelle */}
        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scale-in">
          
          <CardContent className="pt-8 pb-6 relative z-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Champ Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Adresse email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="chauffeur@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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

              {/* Bouton de connexion */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              {/* Lien mot de passe oublié */}
              <div className="flex items-center justify-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium underline-offset-4 hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>

            {/* Footer avec liens vers autres espaces */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Bouton d'inscription */}
              <Button
                variant="outline"
                onClick={() => navigate('/driver/register')}
                className="w-full h-12 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium"
              >
                Pas encore chauffeur ? S'inscrire
              </Button>
              
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
