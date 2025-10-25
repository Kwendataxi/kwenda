import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';

/**
 * Formulaire de connexion client léger pour UnifiedAuthPage
 * Version simplifiée sans header ni navigation externe
 */
export const ClientLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginWithRetry } = useAuthWithRetry();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginWithRetry(email, password, 'client');

    if (!result.success) {
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    // Stocker l'intention de connexion
    localStorage.setItem('kwenda_login_intent', 'client');
    localStorage.setItem('kwenda_selected_role', 'client');

    toast.success('Connexion réussie !', {
      description: 'Redirection en cours...'
    });

    // Attendre synchronisation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    navigate('/app/client');
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Champ Email */}
      <div className="space-y-2">
        <Label htmlFor="client-email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          Adresse email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
          <Input
            id="client-email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 pl-10 pr-4"
          />
        </div>
      </div>

      {/* Champ Mot de passe */}
      <div className="space-y-2">
        <Label htmlFor="client-password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          Mot de passe
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
          <Input
            id="client-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 pl-10 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-sm font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton de connexion */}
      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold"
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
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
          onClick={() => navigate('/forgot-password')}
        >
          Mot de passe oublié ?
        </Button>
      </div>
    </form>
  );
};
