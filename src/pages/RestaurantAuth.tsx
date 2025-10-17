import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, ChefHat, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    phone: ''
  });

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              restaurant_name: formData.restaurantName,
              phone: formData.phone,
              user_type: 'restaurant'
            }
          }
        });

        if (error) throw error;

        if (!data.user) throw new Error('Erreur lors de la création du compte');

        // Créer profil restaurant
        const { error: profileError } = await supabase.from('restaurant_profiles').insert({
          user_id: data.user.id,
          restaurant_name: formData.restaurantName,
          phone_number: formData.phone,
          email: formData.email,
          city: 'Kinshasa', // Par défaut
          address: formData.restaurantName // Temporaire, à compléter plus tard
        });

        if (profileError) throw profileError;

        // Attribuer rôle restaurant
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'restaurant',
          is_active: true
        });

        if (roleError) throw roleError;

        toast.success('Compte créé avec succès !', {
          description: 'Vérifiez votre email pour confirmer votre compte'
        });
        
        navigate('/restaurant');
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        toast.success('Bienvenue !', {
          description: 'Connexion réussie'
        });
        navigate('/restaurant');
      }
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
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
                <Input
                  placeholder="Nom du restaurant"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                />
                <Input
                  placeholder="Téléphone (ex: +243...)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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
