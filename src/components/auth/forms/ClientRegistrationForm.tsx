import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ClientRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const ClientRegistrationForm = ({ onSuccess, onBack }: ClientRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
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

  setLoading(true);

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `https://kwenda.app/`,
        data: {
          display_name: formData.displayName,
          phone_number: formData.phoneNumber,
          role: 'simple_user_client',
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          address: formData.address,
          city: formData.city
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      toast({
        title: "Succès !",
        description: "Votre compte a été créé avec succès. Vérifiez votre email pour confirmer.",
      });
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
                <Label htmlFor="phoneNumber">Téléphone *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
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