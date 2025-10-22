import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, CheckCircle2, Info } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface ClientRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const ClientRegistrationForm = ({ onSuccess, onBack }: ClientRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
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
    city: 'Kinshasa'
  });

  // Validation du format téléphone congolais (accepte formats locaux et internationaux)
  const validatePhoneNumber = (phone: string): boolean => {
    // Accepter: 0991234567 OU +243991234567 OU 00243991234567
    const phoneRegex = /^(\+243|00243|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   if (formData.password !== formData.confirmPassword) {
  //     toast({
  //       title: "Erreur",
  //       description: "Les mots de passe ne correspondent pas",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   if (formData.password.length < 6) {
  //     toast({
  //       title: "Erreur",
  //       description: "Le mot de passe doit contenir au moins 6 caractères",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // Créer le compte utilisateur
  //     const { data: authData, error: authError } = await supabase.auth.signUp({
  //       email: formData.email,
  //       password: formData.password,
  //       options: {
  //         emailRedirectTo: `${window.location.origin}/`,
  //         data: {
  //           display_name: formData.displayName,
  //           role: 'simple_user_client'
  //         }
  //       }
  //     });

  //     if (authError) {
  //       throw authError;
  //     }

  //     if (authData.user) {
  //       // Créer le profil client
  //       const { error: profileError } = await supabase
  //         .from('clients')
  //         .insert({
  //           user_id: authData.user.id,
  //           display_name: formData.displayName,
  //           phone_number: formData.phoneNumber,
  //           email: formData.email,
  //           date_of_birth: formData.dateOfBirth || null,
  //           gender: formData.gender || null,
  //           emergency_contact_name: formData.emergencyContactName || null,
  //           emergency_contact_phone: formData.emergencyContactPhone || null,
  //           address: formData.address || null,
  //           city: formData.city
  //         });

  //       if (profileError) {
  //         throw profileError;
  //       }
  //       console.log("payload",profileError);
  //       toast({
  //         title: "Succès !",
  //         description: "Votre compte client a été créé avec succès. Vérifiez votre email pour confirmer votre compte.",
  //       });

  //       onSuccess();
  //     }
  //   } catch (error: any) {
  //     console.error('Registration error:', error);
  //     toast({
  //       title: "Erreur",
  //       description: error.message || "Une erreur est survenue lors de l'inscription",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    toast({
      title: "Erreur",
      description: "Les mots de passe ne correspondent pas",
      variant: "destructive"
    });
    return;
  }

  if (formData.password.length < 6) {
    toast({
      title: "Erreur",
      description: "Le mot de passe doit contenir au moins 6 caractères",
      variant: "destructive"
    });
    return;
  }

  // Validation téléphone
  if (!validatePhoneNumber(formData.phoneNumber)) {
    toast({
      title: "Erreur",
      description: "Format invalide. Utilisez: 0991234567, +243991234567 ou 00243991234567",
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
        throw new Error(result?.error || 'Erreur lors de la création du profil');
      }

      logger.info('Client profile created successfully', { 
        userId: authData.user.id,
        profileId: result.profile_id
      });

      // ✅ Sauvegarder l'intention de connexion pour redirection correcte
      localStorage.setItem('kwenda_login_intent', 'client');
      localStorage.setItem('kwenda_selected_role', 'client');

      if (!authData.session) {
        // Email confirmation requise
        toast({
          title: "Vérifiez votre email",
          description: "Un email de confirmation a été envoyé. Cliquez sur le lien pour activer votre compte.",
        });
      } else {
        // Connexion immédiate
        toast({
          title: "Succès !",
          description: "Votre compte client a été créé avec succès.",
        });
      }
      onSuccess();
    }
  } catch (error: any) {
    logger.error('Client registration error', error);
    toast({
      title: "Erreur",
      description: error.message || "Une erreur est survenue lors de l'inscription",
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
          <CardTitle>Inscription Client</CardTitle>
          <CardDescription>
            Créez votre compte client pour réserver des courses et des livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
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
                  Numéro de téléphone *
                </Label>
                
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    placeholder="0991234567"
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
                  Ce numéro servira pour les transferts d'argent (format: 0XXXXXXXXX)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nom complet *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
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
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact d'urgence (nom)</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact d'urgence (téléphone)</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Retour
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer mon compte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};