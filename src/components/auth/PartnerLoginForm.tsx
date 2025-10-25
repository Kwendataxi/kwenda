import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';

export const PartnerLoginForm = () => {
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

    const result = await loginWithRetry(email, password, 'partner');

    if (!result.success) {
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    localStorage.setItem('kwenda_login_intent', 'partner');
    localStorage.setItem('kwenda_selected_role', 'partner');

    toast.success('Connexion réussie !', {
      description: 'Bienvenue dans votre espace partenaire'
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    navigate('/app/partenaire');
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="partner-email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          Adresse email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
          <Input
            id="partner-email"
            type="email"
            placeholder="partenaire@entreprise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 pl-10 pr-4"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          Mot de passe
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
          <Input
            id="partner-password"
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
            {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>

      <div className="flex items-center justify-center pt-2">
        <Button
          type="button"
          variant="link"
          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700"
          onClick={() => navigate('/forgot-password')}
        >
          Mot de passe oublié ?
        </Button>
      </div>
    </form>
  );
};
