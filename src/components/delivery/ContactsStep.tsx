import React, { useEffect } from 'react';
import { User, PhoneIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ContactsStepProps {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  onSenderNameChange: (value: string) => void;
  onSenderPhoneChange: (value: string) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
  userProfile?: {
    display_name?: string;
    phone_number?: string;
  };
}

export default function ContactsStep({
  senderName,
  senderPhone,
  recipientName,
  recipientPhone,
  onSenderNameChange,
  onSenderPhoneChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  userProfile
}: ContactsStepProps) {
  
  // Pré-remplir avec le profil utilisateur
  useEffect(() => {
    if (userProfile && !senderName && !senderPhone) {
      if (userProfile.display_name) {
        onSenderNameChange(userProfile.display_name);
      }
      if (userProfile.phone_number) {
        onSenderPhoneChange(userProfile.phone_number);
      }
    }
  }, [userProfile, senderName, senderPhone]);

  const formatPhoneNumber = (value: string): string => {
    // Nettoyer complètement (enlever TOUS les caractères non-numériques sauf +)
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Supprimer les + multiples (garder seulement le premier)
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }
    
    // Si commence par 0, remplacer par +243
    if (cleaned.startsWith('0')) {
      cleaned = '+243' + cleaned.substring(1);
    }
    
    // Si ne commence pas par + et n'est pas vide, ajouter +243
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+243' + cleaned;
    }
    
    // Limiter à 15 chiffres (+ le +)
    if (cleaned.startsWith('+')) {
      const digits = cleaned.substring(1);
      if (digits.length > 15) {
        cleaned = '+' + digits.substring(0, 15);
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    const formatted = formatPhoneNumber(value);
    setter(formatted);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Informations de contact</h2>
        <p className="text-muted-foreground">Qui envoie et reçoit ce colis ?</p>
      </div>
      
      {/* Expéditeur */}
      <Card className="p-4 bg-card border border-primary/20 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-congo-green rounded-full" />
            <h3 className="font-semibold text-foreground">Expéditeur (Vous)</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="senderName" className="text-sm font-medium">
              Nom complet
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => onSenderNameChange(e.target.value)}
                placeholder="Votre nom complet"
                className="pl-10 h-12 bg-background border-primary/30 focus:border-primary"
                maxLength={100}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="senderPhone" className="text-sm font-medium">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="senderPhone"
                value={senderPhone}
                onChange={(e) => handlePhoneChange(e.target.value, onSenderPhoneChange)}
                placeholder="+243 XXX XXX XXX"
                className="pl-10 h-12 bg-background border-primary/30 focus:border-primary"
                type="tel"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format: +243123456789 ou 0123456789
            </p>
          </div>
        </div>
      </Card>

      {/* Destinataire */}
      <Card className="p-4 bg-card border border-secondary/20 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-congo-red rounded-full" />
            <h3 className="font-semibold text-foreground">Destinataire</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => onRecipientNameChange(e.target.value)}
                placeholder="Nom du destinataire"
                className="pl-10 h-12 bg-background border-primary/30 focus:border-primary"
                maxLength={100}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientPhone" className="text-sm font-medium">
              Numéro de téléphone <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => handlePhoneChange(e.target.value, onRecipientPhoneChange)}
                placeholder="+243 XXX XXX XXX"
                className="pl-10 h-12 bg-background border-primary/30 focus:border-primary"
                type="tel"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format: +243123456789 ou 0123456789
            </p>
          </div>
        </div>
      </Card>

      <div className="text-center text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 Le livreur pourra appeler ces numéros pour coordonner la collecte et la livraison
      </div>
    </div>
  );
}
