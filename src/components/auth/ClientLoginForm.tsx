import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Formulaire de connexion client - Design Premium Épuré
 */
export const ClientLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const navigate = useNavigate();
  const { loginWithRetry } = useAuthWithRetry();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    
    setLoading(true);
    setError(null);

    const result = await loginWithRetry(email, password, 'client');

    if (!result.success) {
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    localStorage.setItem('kwenda_login_intent', 'client');
    localStorage.setItem('kwenda_selected_role', 'client');

    toast.success(t('auth.login_success'), {
      description: t('auth.redirecting')
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    navigate('/app/client');
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="client-email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('auth.email')}
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors duration-200" />
          <Input
            id="client-email"
            type="email"
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 pl-10 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="client-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('auth.password')}
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors duration-200" />
          <Input
            id="client-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 pl-10 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all duration-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 rounded-xl animate-fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <AlertDescription className="text-sm text-rose-700 dark:text-rose-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Checkbox
          id="terms-login"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          className="mt-0.5 border-gray-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
        />
        <Label htmlFor="terms-login" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer leading-relaxed">
          {t('auth.accept_terms_part1')}{' '}
          <Link to="/terms" className="text-rose-500 hover:text-rose-600 hover:underline font-medium">
            {t('auth.terms_of_service')}
          </Link>{' '}
          {t('auth.accept_terms_part2')}{' '}
          <Link to="/privacy" className="text-rose-500 hover:text-rose-600 hover:underline font-medium">
            {t('auth.privacy_policy')}
          </Link>{' '}
          {t('auth.accept_terms_part3')}
        </Label>
      </div>

      {/* Login Button */}
      <Button 
        type="submit" 
        className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
        disabled={loading || !acceptTerms}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? t('auth.logging_in') : t('auth.login_button')}
      </Button>

      {/* Forgot Password Link */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="link"
          className="text-sm text-rose-500 hover:text-rose-600 transition-colors p-0 h-auto"
          onClick={() => setShowForgotPassword(true)}
        >
          {t('auth.forgot_password')}
        </Button>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />

      {/* Register Link */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
        <p>
          {t('auth.no_account')}{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-rose-500 hover:text-rose-600 font-medium transition-colors"
            onClick={() => navigate('/app/register')}
          >
            {t('auth.create_client_account')}
          </Button>
        </p>
      </div>
    </form>
  );
};
