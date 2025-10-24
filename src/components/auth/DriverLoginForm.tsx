import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Car, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const DriverLoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/chauffeur`,
            data: {
              full_name: formData.name,
              user_type: 'driver'
            }
          }
        });

        if (error) throw error;

        localStorage.setItem('kwenda_login_intent', 'driver');
        localStorage.setItem('kwenda_selected_role', 'driver');
        
        await new Promise(resolve => setTimeout(resolve, 100));

        toast.success('Compte créé ! Vérifiez votre email.');
        navigate('/app/chauffeur');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !refreshedSession) {
          throw new Error('Session non établie. Veuillez réessayer.');
        }

        localStorage.setItem('kwenda_login_intent', 'driver');
        localStorage.setItem('kwenda_selected_role', 'driver');

        toast.success('Connexion réussie !');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigate('/app/chauffeur');
      }
    } catch (error: any) {
      console.error('❌ Erreur auth chauffeur:', error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mb-4">
          <Car className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-heading-lg">
          {isSignUp ? 'Devenir Chauffeur' : 'Espace Chauffeur'}
        </h2>
        <p className="text-body-sm text-muted-foreground">
          {isSignUp 
            ? 'Rejoignez notre équipe de chauffeurs'
            : 'Connectez-vous pour gérer vos courses'
          }
        </p>
      </div>

      <div className="space-y-4">
        {isSignUp && (
          <div className="relative">
            <Input
              placeholder="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="pl-10"
          />
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-secondary to-accent" 
          onClick={handleAuth}
          disabled={loading}
        >
          <Car className="w-4 h-4 mr-2" />
          {isSignUp ? 'Créer mon compte' : 'Se connecter'}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp 
            ? 'Déjà chauffeur ? Se connecter' 
            : 'Nouveau chauffeur ? S\'inscrire'
          }
        </Button>
      </div>
    </div>
  );
};
