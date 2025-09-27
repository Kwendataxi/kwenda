import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react';

const PartnerRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    phone: '',
    address: '',
    business_type: 'transport',
    service_areas: ['Kinshasa'],
    business_license: '',
    tax_number: '',
    commission_rate: 15.00
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Vous devez être connecté pour vous inscrire comme partenaire');
        navigate('/auth');
        return;
      }

      // Créer le profil partenaire
      const { error: partnerError } = await supabase
        .from('partenaires')
        .insert([{
          user_id: user.id,
          display_name: formData.company_name,
          phone_number: formData.phone,
          email: formData.contact_email,
          address: formData.address,
          business_type: formData.business_type,
          company_name: formData.company_name,
          commission_rate: formData.commission_rate,
          verification_status: 'pending',
          is_active: false
        } as any]);

      if (partnerError) {
        console.error('Erreur création partenaire:', partnerError);
        toast.error('Erreur lors de l\'inscription: ' + partnerError.message);
        return;
      }

      toast.success('Inscription partenaire envoyée! Nous examinerons votre demande sous 24-48h.');
      navigate('/partner');

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="company_name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Nom de l'entreprise *
          </Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="Ex: Transport Kinshasa SARL"
            required
          />
        </div>

        <div>
          <Label htmlFor="contact_email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email de contact *
          </Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            placeholder="contact@entreprise.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Téléphone *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+243 900 000 000"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Adresse complète de votre entreprise"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="business_type">Type d'activité</Label>
        <Select value={formData.business_type} onValueChange={(value) => handleChange('business_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre type d'activité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="delivery">Livraison</SelectItem>
            <SelectItem value="rental">Location de véhicules</SelectItem>
            <SelectItem value="marketplace">Marketplace</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="business_license" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Numéro de licence d'entreprise
        </Label>
        <Input
          id="business_license"
          value={formData.business_license}
          onChange={(e) => handleChange('business_license', e.target.value)}
          placeholder="Ex: LIC-2024-001"
        />
      </div>

      <div>
        <Label htmlFor="tax_number" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Numéro fiscal (NIF)
        </Label>
        <Input
          id="tax_number"
          value={formData.tax_number}
          onChange={(e) => handleChange('tax_number', e.target.value)}
          placeholder="Ex: A0000000000000X"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Commission</h4>
        <p className="text-sm text-blue-700">
          Taux de commission standard: <strong>{formData.commission_rate}%</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Ce taux peut être négocié en fonction du volume d'affaires
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Devenir Partenaire Kwenda</CardTitle>
            <CardDescription className="text-blue-100">
              Rejoignez notre réseau de partenaires et développez votre activité
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Indicateur d'étapes */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                  {renderStep1()}
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.company_name || !formData.contact_email || !formData.phone}
                    >
                      Suivant
                    </Button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Détails de l'activité</h3>
                  {renderStep2()}
                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Précédent
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {/* Info section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Avantages partenaire Kwenda:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Accès à notre plateforme de gestion complète</li>
                <li>• Support technique 24/7</li>
                <li>• Commissions attractives</li>
                <li>• Formation et accompagnement</li>
                <li>• Visibilité sur notre application client</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/partner/auth')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Déjà partenaire ? Se connecter
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistration;