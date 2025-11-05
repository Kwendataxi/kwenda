import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Phone, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface SavedContact {
  name: string;
  phone: string;
}

const ContactsStep: React.FC<ContactsStepProps> = ({
  senderName,
  senderPhone,
  recipientName,
  recipientPhone,
  onSenderNameChange,
  onSenderPhoneChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  userProfile
}) => {
  const [recentSenders, setRecentSenders] = useState<SavedContact[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<SavedContact[]>([]);

  // Charger les contacts récents
  useEffect(() => {
    try {
      const senders = JSON.parse(localStorage.getItem('kwenda-recent-senders') || '[]');
      const recipients = JSON.parse(localStorage.getItem('kwenda-recent-recipients') || '[]');
      setRecentSenders(senders.slice(0, 3));
      setRecentRecipients(recipients.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement contacts récents:', error);
    }
  }, []);

  // Pré-remplir avec le profil utilisateur
  useEffect(() => {
    if (userProfile && !senderName && !senderPhone) {
      if (userProfile.display_name) {
        onSenderNameChange(userProfile.display_name);
      }
      if (userProfile.phone_number) {
        onSenderPhoneChange(formatPhoneNumber(userProfile.phone_number));
      }
    }
  }, [userProfile, senderName, senderPhone]);

  // Validation des champs
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 13;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  // Utiliser mon profil comme expéditeur
  const useMyProfile = () => {
    if (userProfile) {
      onSenderNameChange(userProfile.full_name || userProfile.email || '');
      if (userProfile.phone) {
        onSenderPhoneChange(formatPhoneNumber(userProfile.phone));
      }
    }
  };

  // Sélectionner un contact récent
  const selectRecentContact = (contact: SavedContact, type: 'sender' | 'recipient') => {
    if (type === 'sender') {
      onSenderNameChange(contact.name);
      onSenderPhoneChange(contact.phone);
    } else {
      onRecipientNameChange(contact.name);
      onRecipientPhoneChange(contact.phone);
    }
  };

  // Formater le numéro de téléphone au format +243XXXXXXXXX
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

  const handlePhoneChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setter(formatted);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-primary/20 shadow-soft">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          Informations de contact
        </h2>
        <p className="text-muted-foreground">Qui envoie et reçoit ce colis ?</p>
      </motion.div>

      {/* Expéditeur */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="p-6 space-y-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-primary/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <User className="h-5 w-5 text-primary" />
            <span>Informations de l'expéditeur</span>
          </div>
          {userProfile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useMyProfile}
              className="text-xs"
            >
              Utiliser mon profil
            </Button>
          )}
        </div>

        {/* Contacts récents expéditeur */}
        {recentSenders.length > 0 && !senderPhone && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Contacts récents</Label>
            <div className="flex flex-wrap gap-2">
              {recentSenders.map((contact, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectRecentContact(contact, 'sender')}
                  className="text-xs"
                >
                  {contact.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="senderName" className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Nom complet
            {validateName(senderName) && (
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </Label>
          <Input
            id="senderName"
            type="text"
            placeholder="Nom de l'expéditeur"
            value={senderName}
            onChange={(e) => onSenderNameChange(e.target.value)}
            className={cn(
              "bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl transition-all duration-300",
              senderName && !validateName(senderName) && "border-destructive"
            )}
            required
          />
          {senderName && !validateName(senderName) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              Le nom doit contenir au moins 2 caractères
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="senderPhone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Numéro de téléphone
            {validatePhone(senderPhone) && (
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </Label>
          <Input
            id="senderPhone"
            type="tel"
            placeholder="+243 XX XXX XXXX"
            value={senderPhone}
            onChange={handlePhoneChange(onSenderPhoneChange)}
            className={cn(
              "bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl transition-all duration-300",
              senderPhone && !validatePhone(senderPhone) && "border-destructive"
            )}
            required
          />
          {senderPhone && !validatePhone(senderPhone) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              Format invalide (ex: +243123456789)
            </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Destinataire */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="p-6 space-y-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-secondary/20 shadow-lg">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <User className="h-5 w-5 text-secondary" />
          <span>Informations du destinataire</span>
        </div>

        {/* Contacts récents destinataire */}
        {recentRecipients.length > 0 && !recipientPhone && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Contacts récents</Label>
            <div className="flex flex-wrap gap-2">
              {recentRecipients.map((contact, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectRecentContact(contact, 'recipient')}
                  className="text-xs"
                >
                  {contact.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="recipientName" className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Nom complet
            {validateName(recipientName) && (
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </Label>
          <Input
            id="recipientName"
            type="text"
            placeholder="Nom du destinataire"
            value={recipientName}
            onChange={(e) => onRecipientNameChange(e.target.value)}
            className={cn(
              "bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl transition-all duration-300",
              recipientName && !validateName(recipientName) && "border-destructive"
            )}
            required
          />
          {recipientName && !validateName(recipientName) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              Le nom doit contenir au moins 2 caractères
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientPhone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Numéro de téléphone
            {validatePhone(recipientPhone) && (
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </Label>
          <Input
            id="recipientPhone"
            type="tel"
            placeholder="+243 XX XXX XXXX"
            value={recipientPhone}
            onChange={handlePhoneChange(onRecipientPhoneChange)}
            className={cn(
              "bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl transition-all duration-300",
              recipientPhone && !validatePhone(recipientPhone) && "border-destructive"
            )}
            required
          />
          {recipientPhone && !validatePhone(recipientPhone) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              Format invalide (ex: +243123456789)
            </p>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        className="text-center text-xs text-muted-foreground bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 backdrop-blur-sm p-3 rounded-2xl border border-border/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        💡 Le livreur pourra appeler ces numéros pour coordonner la collecte et la livraison
      </motion.div>
    </motion.div>
  );
};

export default ContactsStep;
