import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, ChefHat, ArrowLeft, Phone, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RestaurantAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    phone: ''
  });

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      if (isSignUp) {
        // Validation téléphone
        if (!validatePhoneNumber(formData.phone)) {
          toast.error('Le numéro de téléphone doit être au format : 0991234567 (10 chiffres)');
          return;
        }

        // Validation nom restaurant
        if (!formData.restaurantName.trim()) {
          toast.error('Le nom du restaurant est obligatoire');
          return;
        }

        // Inscription - Le trigger gère automatiquement la création du profil et du rôle
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/restaurant`,
            data: {
              restaurant_name: formData.restaurantName,
              phone: formData.phone,
              user_type: 'restaurant'
            }
          }
        });

        if (error) throw error;

        // ✅ Sauvegarder l'intention de connexion pour redirection correcte
        localStorage.setItem('kwenda_login_intent', 'restaurant');
        localStorage.setItem('kwenda_selected_role', 'restaurant');

        toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
        navigate('/restaurant');
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        toast.success('Bienvenue ! Connexion réussie.');
        navigate('/restaurant');
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {isSignUp ? 'Devenir Restaurant Partenaire' : 'Espace Restaurant'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Rejoignez Kwenda Food et développez votre activité'
                : 'Connectez-vous pour gérer votre restaurant'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Input
                    placeholder="Nom du restaurant"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="0991234567"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, phone: value });
                        setPhoneValid(validatePhoneNumber(value));
                      }}
                      className={cn(
                        "pl-10 pr-10",
                        phoneValid && "border-green-500 focus-visible:ring-green-500"
                      )}
                      required
                    />
                    {phoneValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Format: 0XXXXXXXXX (10 chiffres)
                  </p>
                </div>
              </>
            )}

            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              type="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Button 
              className="w-full" 
              onClick={handleAuth}
              disabled={loading}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              {isSignUp ? 'Créer mon restaurant' : 'Se connecter'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp 
                ? 'Déjà inscrit ? Se connecter' 
                : 'Nouveau restaurant ? S\'inscrire'
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
