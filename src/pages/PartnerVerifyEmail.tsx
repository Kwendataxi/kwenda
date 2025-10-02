import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const PartnerVerifyEmail = () => {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      // Get the email from localStorage if available
      const email = localStorage.getItem('pendingPartnerEmail');
      
      if (!email) {
        toast.error('Email non trouvé. Veuillez réessayer l\'inscription.');
        navigate('/partner/auth');
        return;
      }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription>
            Un email de confirmation a été envoyé à votre adresse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Pour compléter votre inscription en tant que partenaire, veuillez:
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
            onClick={() => navigate('/partner/auth')}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Button>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Une fois votre email confirmé, votre demande sera examinée par nos équipes.
              Vous recevrez une notification par email lors de l'approbation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerVerifyEmail;
