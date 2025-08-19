import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { EscrowDashboard } from '@/components/escrow/EscrowDashboard';

export const EscrowPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestion Escrow</h1>
            <p className="text-muted-foreground">
              Suivi des paiements et gestion des retraits
            </p>
          </div>
        </div>

        {/* Dashboard principal */}
        <EscrowDashboard />
      </div>
    </div>
  );
};