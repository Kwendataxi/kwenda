import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const { loginWithRetry } = useAuthWithRetry();
  const { t } = useLanguage();

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
        <Label htmlFor="client-email" className="text-sm font-semibold text-foreground/90 dark:text-foreground/85">
          {t('auth.email')}
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-congo-red dark:group-focus-within:text-congo-red-electric transition-colors" />
          <Input
            id="client-email"
            type="email"
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 pl-10 pr-4 rounded-xl focus-visible:ring-congo-red/20 focus-visible:border-congo-red/50 dark:focus-visible:ring-congo-red/30 dark:focus-visible:border-congo-red-electric/50 transition-all duration-300"
          />
        </div>
      </div>

      {/* Champ Mot de passe */}
      <div className="space-y-2">
        <Label htmlFor="client-password" className="text-sm font-semibold text-foreground/90 dark:text-foreground/85">
          {t('auth.password')}
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-congo-red dark:group-focus-within:text-congo-red-electric transition-colors" />
          <Input
            id="client-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 pl-10 pr-12 rounded-xl focus-visible:ring-congo-red/20 focus-visible:border-congo-red/50 dark:focus-visible:ring-congo-red/30 dark:focus-visible:border-congo-red-electric/50 transition-all duration-300"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
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
        className="w-full h-12 rounded-xl bg-gradient-to-r from-congo-red to-congo-red-vibrant hover:from-congo-red-vibrant hover:to-congo-red text-white font-semibold shadow-lg hover:shadow-[0_6px_30px_hsl(var(--congo-red)/0.4)] dark:hover:shadow-[0_8px_40px_hsl(var(--congo-red)/0.5)] transition-all duration-300"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? t('auth.logging_in') : t('auth.login_button')}
      </Button>

      {/* Lien mot de passe oublié */}
      <div className="flex items-center justify-center pt-2">
        <Button
          type="button"
          variant="link"
          className="text-sm text-congo-red dark:text-congo-red-electric hover:text-congo-red-vibrant transition-colors"
          onClick={() => setShowForgotPassword(true)}
        >
          {t('auth.forgot_password')}
        </Button>
      </div>

      {/* Modal mot de passe oublié */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />

      {/* Lien inscription */}
      <div className="text-center text-sm text-muted-foreground dark:text-muted-foreground/80 mt-4 pt-4 border-t border-border/50 dark:border-border/30">
        <p>
          {t('auth.no_account')}{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-congo-red dark:text-congo-red-electric hover:text-congo-red-vibrant font-semibold transition-colors"
            onClick={() => navigate('/app/register')}
          >
            {t('auth.create_client_account')}
          </Button>
        </p>
      </div>
    </form>
  );
};
