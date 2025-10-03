import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';

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

      // Vérifier si l'utilisateur est bien un partenaire
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .single();

      if (!partnerData) {
        await supabase.auth.signOut();
        toast.error('Accès non autorisé', {
          description: 'Ce compte n\'est pas autorisé à accéder à l\'espace partenaire'
        });
        return;
      }

      toast.success('Connexion réussie', {
        description: 'Bienvenue dans votre espace partenaire Kwenda'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/partner');
      }
    } catch (error: any) {
      console.error('Erreur de connexion partenaire:', error);
      toast.error('Erreur de connexion', {
        description: error.message || 'Vérifiez vos identifiants'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center shadow-lg backdrop-blur-sm border border-green-200/50 dark:border-green-700/50">
            <Building className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3">
            Espace Partenaire
          </h1>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Gérez votre flotte et vos chauffeurs
          </p>
        </div>

        <Card className="shadow-2xl dark:bg-gray-800/95 dark:border-gray-700/60 backdrop-blur-sm border-green-100 dark:border-green-900/30">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="dark:text-gray-100">Connexion Partenaire</span>
            </CardTitle>
            <CardDescription className="text-base dark:text-gray-300">
              Connectez-vous avec vos identifiants de partenaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="partenaire@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold dark:text-gray-200">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
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

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                onClick={() => setShowForgotPassword(true)}
              >
                Mot de passe oublié ?
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/partner/register')}
              className="h-12 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium"
            >
              Pas encore partenaire ? S'inscrire
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              ← Retour à l'accueil
            </Button>
          </div>
        </div>

        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};