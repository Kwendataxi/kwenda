import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
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

      // Vérifier si l'utilisateur est admin via user_roles
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('is_current_user_admin');

      if (roleError || !isAdmin) {
        await supabase.auth.signOut();
        toast.error('Accès non autorisé', {
          description: 'Ce compte n\'est pas autorisé à accéder à l\'administration'
        });
        return;
      }

      toast.success('Connexion réussie', {
        description: 'Bienvenue dans l\'administration Kwenda'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    } catch (error: any) {
      logger.error('Erreur de connexion admin', error);
      toast.error('Erreur de connexion', {
        description: error.message || 'Vérifiez vos identifiants'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-6 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-6 overflow-hidden hover:scale-105 transition-transform duration-300">
            <BrandLogo size={72} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Shield className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Espace Administrateur
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Kwenda Admin
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            Accès sécurisé pour les administrateurs
          </p>
        </div>

        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scale-in">
          <CardContent className="pt-8 pb-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kwendataxi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">Mot de passe</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
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
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                Mot de passe oublié ?
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-3">
          <div className="text-center space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-muted-foreground">Pas admin ?</p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Link to="/auth" className="text-primary hover:underline font-medium">Espace Client</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/driver/auth" className="text-primary hover:underline font-medium">Espace Chauffeur</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/partner/auth" className="text-primary hover:underline font-medium">Espace Partenaire</Link>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            ← Retour à l'accueil
          </Button>
        </div>

        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};