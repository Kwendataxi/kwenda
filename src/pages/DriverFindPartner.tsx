import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartnerRequestForm } from '@/components/auth/PartnerRequestForm';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface DriverProfile {
  role: string; // 'chauffeur' ou 'livreur'
  has_own_vehicle: boolean;
  verification_status: string;
  is_active: boolean;
}

interface PartnerRequest {
  id: string;
  partner_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  response_message: string | null;
  partenaires: {
    company_name: string;
    display_name: string;
    business_type: string;
  };
}

export const DriverFindPartner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadDriverProfile();
    loadPartnerRequests();
  }, [user, navigate]);

  const loadDriverProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('role, has_own_vehicle, verification_status, is_active')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setDriverProfile(data);
      
      // Vérifier si le chauffeur a déjà un véhicule ou est actif
      if (data.has_own_vehicle || data.is_active) {
        toast.info('Vous avez déjà un véhicule ou un compte actif');
        navigate('/driver');
        return;
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
      toast.error('Erreur lors du chargement du profil');
      navigate('/');
    }
  };

  const loadPartnerRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_driver_requests')
        .select(`
          id,
          partner_id,
          status,
          created_at,
          responded_at,
          response_message,
          partenaires (
            company_name,
            display_name,
            business_type
          )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading partner requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSent = () => {
    setShowRequestForm(false);
    loadPartnerRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          En attente
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Approuvée
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Kwenda</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Profil introuvable</h2>
              <p className="text-muted-foreground mb-4">
                Nous n'avons pas trouvé votre profil chauffeur.
              </p>
              <Button onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Kwenda</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Trouver un partenaire</h1>
            <p className="text-lg text-muted-foreground">
              Connectez-vous avec des partenaires pour commencer à travailler
            </p>
          </div>

          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Votre statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {driverProfile.role === 'chauffeur' ? 'Chauffeur' : 'Livreur'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    En recherche de partenaire véhicule
                  </p>
                </div>
                <Badge variant="outline">Sans véhicule</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Existing requests */}
          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vos demandes de partenariat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{request.partenaires.company_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Demande envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {request.response_message && (
                            <p className="text-sm mt-1 text-muted-foreground">
                              Réponse: {request.response_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        {request.responded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.responded_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            {!showRequestForm ? (
              <Button
                onClick={() => setShowRequestForm(true)}
                size="lg"
                className="flex items-center gap-2"
              >
                <Building2 className="h-5 w-5" />
                Rechercher des partenaires
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowRequestForm(false)}
              >
                Annuler
              </Button>
            )}
          </div>

          {/* Partner request form */}
          {showRequestForm && user && (
            <Card>
              <CardHeader>
                <CardTitle>Rechercher des partenaires</CardTitle>
              </CardHeader>
              <CardContent>
                <PartnerRequestForm
                  driverId={user.id}
                  serviceCategory={driverProfile.role === 'chauffeur' ? 'taxi' : 'delivery'}
                  onRequestSent={handleRequestSent}
                />
              </CardContent>
            </Card>
          )}

          {/* Info section */}
          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Recherchez</h3>
                  <p className="text-sm text-muted-foreground">
                    Parcourez les partenaires disponibles dans votre zone
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Postulez</h3>
                  <p className="text-sm text-muted-foreground">
                    Envoyez une demande avec un message de présentation
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Commencez</h3>
                  <p className="text-sm text-muted-foreground">
                    Une fois accepté, votre compte devient actif
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
