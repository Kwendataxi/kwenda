import { Button } from '@/components/ui/button';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const ClientAppRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => window.location.href = '/auth'}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={() => window.location.href = '/client'}
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg animate-pulse"
      >
        <User className="h-4 w-4 mr-2" />
        Aller à l'App Client
      </Button>
    </div>
  );
};