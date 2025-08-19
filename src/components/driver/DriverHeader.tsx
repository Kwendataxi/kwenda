import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Car, LogOut, Package } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { User } from '@supabase/supabase-js';

interface DriverHeaderProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({ serviceType }) => {
  const Icon = serviceType === 'taxi' ? Car : Package;

  const [userMe,setUserMe] = useState<User | null>(null);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Utiliser useAuth au lieu d'AuthProvider
  const { signOut, user } = useAuth();

  useEffect(()=>{
    if(user){
      setUserMe(user);
    }
  },[user])

  // Fonction pour gérer la déconnexion
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="mb-3">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-primary/5 border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-none">Espace Chauffeur : {userMe?.email ?? "Inconnu"}</h1>
              <p className="text-xs text-muted-foreground">Moderne, fluide et simple d'utilisation</p>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </button>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {serviceType === 'taxi' ? 'Taxi' : serviceType === 'delivery' ? 'Livraison' : 'Chauffeur'}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default DriverHeader;
