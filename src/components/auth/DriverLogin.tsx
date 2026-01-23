import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, Car, ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface DriverLoginProps {
  onSuccess?: () => void;
}

export const DriverLogin = ({ onSuccess }: DriverLoginProps) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('✅ Login successful', { userId: data.user?.id });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !refreshedSession) {
        logger.error('❌ Session non établie après connexion', sessionError);
        throw new Error('Session non établie. Veuillez réessayer.');
      }

      if (data.user) {
        let roles;
        let retries = 3;
        
        while (retries > 0) {
          const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
            p_user_id: data.user.id
          });

          if (!rolesError && rolesData) {
            roles = rolesData;
            break;
          }
          
          if (rolesError?.message?.includes('JWT') || rolesError?.message?.includes('session')) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          throw rolesError || new Error('Erreur lors de la vérification du rôle');
        }

        if (!roles || roles.length === 0) {
          throw new Error(t('auth.no_roles_found'));
        }

        const hasDriverRole = roles.some((r: any) => r.role === 'driver');

        if (!hasDriverRole) {
          await supabase.auth.signOut();
          const otherRole = roles[0]?.role;
          let suggestion = '';
          
          if (otherRole === 'client') suggestion = t('auth.login_via_client');
          else if (otherRole === 'partner') suggestion = t('auth.login_via_partner');
          else if (otherRole === 'admin') suggestion = t('auth.login_via_admin');
          
          setError(t('auth.not_driver_account') + suggestion);
          setLoading(false);
          return;
        }

        const { data: driverProfile, error: profileError } = await supabase
          .from('chauffeurs')
          .select('is_active, verification_status')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(t('auth.profile_verification_error'));
        }

        if (!driverProfile) {
          await supabase.auth.signOut();
          setError(t('auth.driver_profile_not_found'));
          setLoading(false);
          return;
        }

        if (!driverProfile.is_active) {
          await supabase.auth.signOut();
          setError(t('auth.driver_pending_validation'));
          setLoading(false);
          return;
        }

        await supabase.auth.updateUser({
          data: { active_role: 'driver', last_app: 'chauffeur' }
        });

        localStorage.setItem('kwenda_login_intent', 'driver');
        localStorage.setItem('kwenda_selected_role', 'driver');

        toast({
          title: t('auth.login_success'),
          description: t('auth.welcome_driver'),
        });

        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/app/chauffeur');
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
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white dark:from-background dark:via-orange-950/10 dark:to-background flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-auth-fade">
        {/* Header */}
        <div className="text-center mb-8 space-y-5">
          <div className="flex justify-center">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <BrandLogo size={56} />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
            <Car className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {t('auth.driver_space')}
            </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('auth.driver_title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('auth.driver_subtitle')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl animate-auth-scale">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.email')}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.driver_email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 pl-10 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.password')}
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 rounded-xl animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-sm text-orange-700 dark:text-orange-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Checkbox
                  id="terms-driver"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="terms-driver" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer leading-relaxed">
                  {t('auth.accept_terms_part1')}{' '}
                  <Link to="/terms" className="text-orange-500 hover:underline font-medium">{t('auth.terms_of_service')}</Link>{' '}
                  {t('auth.accept_terms_part2')}{' '}
                  <Link to="/privacy" className="text-orange-500 hover:underline font-medium">{t('auth.privacy_policy')}</Link>{' '}
                  {t('auth.accept_terms_part3')}
                </Label>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
                disabled={loading || !acceptTerms}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t('auth.logging_in') : t('auth.login_button')}
              </Button>

              {/* Forgot Password */}
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-orange-500 hover:text-orange-600 p-0 h-auto"
                  onClick={() => setShowForgotPassword(true)}
                >
                  {t('auth.forgot_password')}
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <Button
                variant="outline"
                onClick={() => navigate('/driver/register')}
                className="w-full h-11 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium rounded-xl"
              >
                {t('auth.become_driver')}
              </Button>
              
              <p className="text-sm text-gray-500">{t('auth.not_driver')}</p>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
                <Link to="/app/auth" className="text-rose-500 hover:underline font-medium">Client</Link>
                <span className="text-gray-300">•</span>
                <Link to="/partner/auth" className="text-emerald-500 hover:underline font-medium">Partenaire</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1.5" />
            Retour à l'accueil
          </Button>
        </div>
      </div>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
};