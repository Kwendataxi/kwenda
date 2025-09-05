import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { User, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const TestFixMessage = () => {
  const { user } = useAuth();

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className="bg-primary/10 border-primary/20">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>🚀 Corrections appliquées !</strong><br/>
          {user ? (
            <>Navigation fixe et section COMPTE corrigés. <Button variant="link" onClick={() => window.location.href = '/client'} className="p-0 h-auto text-primary underline">Cliquez ici pour tester l'app client</Button></>
          ) : (
            <>Pour tester les corrections, connectez-vous d'abord. <Button variant="link" onClick={() => window.location.href = '/auth'} className="p-0 h-auto text-primary underline">Se connecter</Button></>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};