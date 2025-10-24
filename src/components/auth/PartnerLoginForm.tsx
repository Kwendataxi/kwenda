import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Handshake, Mail, Lock, Building } from 'lucide-react';
import { toast } from 'sonner';

export const PartnerLoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: ''
  });

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/partenaire`,
            data: {
              company_name: formData.companyName,
              user_type: 'partner'
            }
          }
        });

        if (error) throw error;

        localStorage.setItem('kwenda_login_intent', 'partner');
        localStorage.setItem('kwenda_selected_role', 'partner');
        
        await new Promise(resolve => setTimeout(resolve, 100));

        toast.success('Compte créé ! Vérifiez votre email.');
        navigate('/app/partenaire');
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

        localStorage.setItem('kwenda_login_intent', 'partner');
        localStorage.setItem('kwenda_selected_role', 'partner');

        toast.success('Connexion réussie !');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigate('/app/partenaire');
      }
    } catch (error: any) {
      console.error('❌ Erreur auth partenaire:', error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mb-4">
          <Handshake className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-heading-lg">
          {isSignUp ? 'Devenir Partenaire' : 'Espace Partenaire'}
        </h2>
        <p className="text-body-sm text-muted-foreground">
          {isSignUp 
            ? 'Rejoignez notre réseau de partenaires'
            : 'Connectez-vous pour gérer votre flotte'
          }
        </p>
      </div>

      <div className="space-y-4">
        {isSignUp && (
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nom de l'entreprise"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="pl-10"
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
          className="w-full bg-gradient-to-r from-accent to-primary" 
          onClick={handleAuth}
          disabled={loading}
        >
          <Handshake className="w-4 h-4 mr-2" />
          {isSignUp ? 'Créer mon compte' : 'Se connecter'}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp 
            ? 'Déjà partenaire ? Se connecter' 
            : 'Nouveau partenaire ? S\'inscrire'
          }
        </Button>
      </div>
    </div>
  );
};
