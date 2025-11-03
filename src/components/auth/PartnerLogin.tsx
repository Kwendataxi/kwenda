import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';

interface PartnerLoginProps {
  onSuccess?: () => void;
}

export const PartnerLogin = ({ onSuccess }: PartnerLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('✅ Login successful', { userId: data.user?.id });

      // ✅ CORRECTION : Attendre stabilisation session (augmenter à 1000ms)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ CORRECTION : Forcer refresh session + attendre confirmation
      const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !refreshedSession) {
        logger.error('❌ Session non établie après connexion', sessionError);
        throw new Error('Session non établie. Veuillez réessayer.');
      }
      
      logger.info('📦 Session refreshed', { 
        hasSession: !!refreshedSession,
        expiresAt: refreshedSession.expires_at,
        userId: data.user?.id
      });

      if (data.user) {
        // ✅ CORRECTION : Vérifier rôle avec retry si échec
        let roles;
        let retries = 3;
        
        while (retries > 0) {
          const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
            p_user_id: data.user.id
          });

          if (!rolesError && rolesData) {
            roles = rolesData;
            logger.info('✅ Roles verified:', {
              roles: roles.map((r: any) => r.role)
            });
            break;
          }
          
          if (rolesError?.message?.includes('JWT') || rolesError?.message?.includes('session')) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.warn(`⚠️ Retry get_user_roles (${3 - retries}/3)`);
            continue;
          }
          
          throw rolesError || new Error('Erreur lors de la vérification du rôle');
        }

        if (!roles || roles.length === 0) {
          throw new Error('Aucun rôle trouvé pour ce compte');
        }

        const hasPartnerRole = roles.some((r: any) => r.role === 'partner');

        if (!hasPartnerRole) {
          await supabase.auth.signOut();
          
          const otherRole = roles[0]?.role;
          let suggestion = '';
          
          if (otherRole === 'client') {
            suggestion = ' Connectez-vous via l\'espace client.';
          } else if (otherRole === 'driver') {
            suggestion = ' Connectez-vous via l\'espace chauffeur.';
          } else if (otherRole === 'admin') {
            suggestion = ' Connectez-vous via l\'espace admin.';
          }
          
          toast.error('Accès refusé', {
            description: "Ce compte n'est pas un compte partenaire." + suggestion
          });
          return;
        }
      }

      // ✅ CORRECTION : Stocker loginIntent pour redirection correcte
      localStorage.setItem('kwenda_login_intent', 'partner');
      localStorage.setItem('kwenda_selected_role', 'partner');

      toast.success('Connexion réussie', {
        description: 'Bienvenue dans votre espace partenaire Kwenda'
      });

      // ✅ CORRECTION : Attendre 300ms pour garantir synchronisation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/partenaire');
      }
    } catch (error: any) {
      logger.error('Erreur de connexion partenaire', error);
      toast.error('Erreur de connexion', {
        description: error.message || 'Vérifiez vos identifiants'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-6 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-6 overflow-hidden hover:scale-105 transition-transform duration-300">
            <BrandLogo size={72} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Briefcase className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Espace Partenaire
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Kwenda Partner
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            Gérez votre flotte et développez votre activité
          </p>
        </div>

        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scale-in">
          <CardContent className="pt-8 pb-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="partenaire@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">Mot de passe</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
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

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              <div className="flex items-center justify-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium underline-offset-4 hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>

            {/* Footer avec liens vers autres espaces */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/partner/register')}
                className="w-full h-12 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium"
              >
                Pas encore partenaire ? S'inscrire
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Pas partenaire ?
              </p>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
                <Link to="/app/auth" className="text-green-600 dark:text-green-400 hover:underline font-medium">
                  Client
                </Link>
                <span className="text-muted-foreground/50">•</span>
                <Link to="/driver/auth" className="text-green-600 dark:text-green-400 hover:underline font-medium">
                  Chauffeur
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        {/* Footer - Bouton Retour à l'accueil */}
        <div className="mt-8 pt-6 border-t border-border/30 pb-8">
          <div className="flex flex-col items-center gap-3">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="default"
              className="group relative overflow-hidden w-full sm:w-auto sm:min-w-[200px] border-border/50 hover:border-green-500/50 hover:shadow-md dark:border-border/30 dark:hover:border-green-400/40 dark:hover:bg-green-500/5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Briefcase className="h-4 w-4 mr-2 relative z-10 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="relative z-10 font-medium">Retour à l'accueil</span>
            </Button>
            
            <p className="text-xs text-muted-foreground text-center px-4">
              Découvrez nos services sans vous connecter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};