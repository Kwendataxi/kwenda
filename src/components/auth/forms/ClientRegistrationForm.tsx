import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, CheckCircle2, Info, Gift } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClientRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const ClientRegistrationForm = ({ onSuccess, onBack }: ClientRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [phoneValid, setPhoneValid] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    city: 'Kinshasa',
    referralCode: '',
    acceptTerms: false
  });

  // Validation du format téléphone congolais (accepte formats locaux et internationaux)
  const validatePhoneNumber = (phone: string): boolean => {
    // Accepter: 0991234567 OU +243991234567 OU 00243991234567
    const phoneRegex = /^(\+243|00243|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    toast({
      title: t('common.error'),
      description: t('auth.passwords_no_match'),
      variant: "destructive"
    });
    return;
  }

  if (formData.password.length < 6) {
    toast({
      title: t('common.error'),
      description: t('auth.password_min_length'),
      variant: "destructive"
    });
    return;
  }

  // Validation téléphone
  if (!validatePhoneNumber(formData.phoneNumber)) {
    toast({
      title: t('common.error'),
      description: t('auth.invalid_phone_format'),
      variant: "destructive"
    });
    return;
  }

  if (!formData.acceptTerms) {
    toast({
      title: t('common.error'),
      description: t('auth.must_accept_terms'),
      variant: "destructive"
    });
    return;
  }

  setLoading(true);

  try {
    const redirectUrl = `${window.location.origin}/client/verify-email`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_type: 'client', // ✅ Standardisé : user_type au lieu de role
          display_name: formData.displayName,
          phone_number: formData.phoneNumber,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          address: formData.address,
          city: formData.city
        }
      }
    });

    console.log('🔐 Auth Response:', {
      success: !authError,
      error: authError?.message,
      hasUser: !!authData?.user,
      hasSession: !!authData?.session,
      timestamp: new Date().toISOString()
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      console.log('📞 Calling RPC create_client_profile_secure...');
      
      // Appeler RPC pour créer profil client complet
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_client_profile_secure',
        {
          p_user_id: authData.user.id,
          p_email: formData.email,
          p_display_name: formData.displayName,
          p_phone_number: formData.phoneNumber,
          p_date_of_birth: formData.dateOfBirth || null,
          p_gender: formData.gender || null,
          p_address: formData.address || null,
          p_city: formData.city || 'Kinshasa',
          p_emergency_contact_name: formData.emergencyContactName || null,
          p_emergency_contact_phone: formData.emergencyContactPhone || null
        }
      );

      const result = rpcResult as any;
      if (rpcError || !result?.success) {
        logger.error('Client profile creation failed', rpcError || result);
        throw new Error(result?.error || t('auth.profile_creation_error'));
      }

      logger.info('Client profile created successfully', { 
        userId: authData.user.id,
        profileId: result.profile_id
      });

      // ✅ Appliquer code de parrainage si fourni
      if (formData.referralCode && formData.referralCode.trim() !== '') {
        const { data: refResult, error: refError } = await supabase.rpc(
          'apply_referral_code',
          {
            p_referee_id: authData.user.id,
            p_referral_code: formData.referralCode.trim().toUpperCase()
          }
        );

        if (refError) {
          console.error('❌ Erreur application code parrainage:', refError);
          toast({
            title: 'Attention',
            description: 'Code de parrainage invalide. Inscription réussie mais sans bonus.',
          });
        } else if ((refResult as any)?.success) {
          toast({
            title: '🎉 Bonus de parrainage !',
            description: 'Vous avez reçu 500 CDF de bonus !',
          });
        } else {
          toast({
            title: 'Code invalide',
            description: (refResult as any)?.message || 'Code de parrainage non valide',
          });
        }
      }

      // ✅ Sauvegarder l'intention de connexion pour redirection correcte
      localStorage.setItem('kwenda_login_intent', 'client');
      localStorage.setItem('kwenda_selected_role', 'client');

      if (!authData.session) {
        // Email confirmation requise
        toast({
          title: t('auth.verify_email'),
          description: t('auth.confirmation_email_sent'),
        });
      } else {
        // Connexion immédiate
        toast({
          title: t('common.success'),
          description: t('auth.client_account_created'),
        });
      }
      onSuccess();
    }
  } catch (error: any) {
    logger.error('Client registration error', error);
    toast({
      title: t('common.error'),
      description: error.message || t('auth.registration_error'),
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t('auth.client_registration')}</CardTitle>
          <CardDescription>
            {t('auth.client_registration_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email_required')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t('auth.phone_required')}
                </Label>
                
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    placeholder={t('auth.phone_placeholder')}
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, phoneNumber: value });
                      setPhoneValid(validatePhoneNumber(value));
                    }}
                    className={cn(
                      "h-12 pr-10",
                      phoneValid && "border-green-500 focus:ring-green-500"
                    )}
                    required
                  />
                  
                  {/* Indicateur visuel */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneValid && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {t('auth.phone_money_transfer_info')}
                </p>
              </div>
            </div>

            {/* Code de parrainage optionnel */}
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Code de parrainage (optionnel)
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Ex: KWENDA2024"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Entrez le code d'un ami pour recevoir 500 CDF de bonus !
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{t('auth.full_name_required')}</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password_required')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirm_password_required')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('auth.date_of_birth')}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t('auth.gender')}</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('auth.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('auth.male')}</SelectItem>
                    <SelectItem value="female">{t('auth.female')}</SelectItem>
                    <SelectItem value="other">{t('auth.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('auth.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">{t('auth.emergency_contact_name')}</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">{t('auth.emergency_contact_phone')}</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Acceptation CGU */}
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg col-span-full">
              <Checkbox
                id="terms-full-register"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                className="mt-0.5"
              />
              <Label htmlFor="terms-full-register" className="text-sm text-muted-foreground cursor-pointer">
                {t('auth.accept_terms_part1')}{' '}
                <Link to="/terms" className="text-primary hover:underline font-medium">
                  {t('auth.terms_of_service')}
                </Link>{' '}
                {t('auth.accept_terms_part2')}{' '}
                <Link to="/privacy" className="text-primary hover:underline font-medium">
                  {t('auth.privacy_policy')}
                </Link>{' '}
                {t('auth.accept_terms_part3')}
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                {t('common.back')}
              </Button>
              <Button type="submit" disabled={loading || !formData.acceptTerms} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.create_account')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};