import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const DriverVerifyEmail = () => {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur vient de confirmer son email
    const checkEmailConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('✅ Session détectée après confirmation email');
        await completeRegistration(session.user.id);
      }
    };

    checkEmailConfirmation();
  }, []);

  const completeRegistration = async (userId: string) => {
    setCompleting(true);
    try {
      const pendingData = localStorage.getItem('pendingDriverRegistration');
      
      if (!pendingData) {
        console.warn('⚠️ Aucune donnée d\'inscription en attente');
        toast.error('Données d\'inscription introuvables');
        navigate('/driver/auth');
        return;
      }

      const registrationData = JSON.parse(pendingData);
      
      console.log('🔧 Complétion de l\'inscription via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('complete-registration', {
        body: {
          user_id: userId,
          registration_type: 'driver',
          registration_data: registrationData
        }
      });

      if (error) {
        console.error('❌ Erreur Edge Function:', error);
        toast.error('Erreur lors de la finalisation de votre inscription');
        return;
      }

      if (data?.success) {
        console.log('✅ Inscription complétée avec succès');
        localStorage.removeItem('pendingDriverRegistration');
        toast.success('Inscription complétée ! Bienvenue sur Kwenda');
        navigate('/driver/dashboard');
      } else {
        console.error('❌ Erreur:', data?.error);
        toast.error(data?.error || 'Erreur lors de la finalisation');
      }

    } catch (error: any) {
      console.error('❌ Exception:', error);
      toast.error('Erreur inattendue');
    } finally {
      setCompleting(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const pendingData = localStorage.getItem('pendingDriverRegistration');
      
      if (!pendingData) {
        toast.error('Email non trouvé. Veuillez réessayer l\'inscription.');
        navigate('/driver/auth');
        return;
      }

      const { email } = JSON.parse(pendingData);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error('Erreur lors de l\'envoi de l\'email: ' + error.message);
      } else {
        toast.success('Email de confirmation renvoyé !');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setResending(false);
    }
  };

  if (completing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-medium">Finalisation de votre inscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription>
            Un email de confirmation a été envoyé à votre adresse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Pour compléter votre inscription en tant que chauffeur, veuillez:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Ouvrir votre boîte email</li>
              <li>Chercher l'email de Kwenda</li>
              <li>Cliquer sur le lien de confirmation</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Vous n'avez pas reçu l'email ?
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
            </Button>
          </div>

          <Button
            onClick={() => navigate('/driver/auth')}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverVerifyEmail;