import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, Loader2, Search } from 'lucide-react';
import { Drawer } from 'vaul';
import { useWallet } from '@/hooks/useWallet';
import { useRecentContacts } from '@/hooks/useRecentContacts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ContactCard } from './ContactCard';
import { SuccessConfetti } from './SuccessConfetti';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/quick-transfer.css';

// Générer couleur avatar consistante
const generateAvatarColor = (userId: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface QuickTransferPopupProps {
  open: boolean;
  onClose: () => void;
  onTransferSuccess?: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export const QuickTransferPopup: React.FC<QuickTransferPopupProps> = ({
  open,
  onClose,
  onTransferSuccess
}) => {
  const { toast } = useToast();
  const { wallet, transferFunds } = useWallet();
  const { contacts, loading: loadingContacts, refreshContacts } = useRecentContacts();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // États pour la recherche manuelle
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debug: Log contacts state
  React.useEffect(() => {
    if (open) {
      console.log('🔥 QuickTransferPopup ouvert - Contacts:', contacts.length, contacts);
      console.log('🔥 Loading:', loadingContacts);
    }
  }, [open, contacts, loadingContacts]);

  // Recherche manuelle d'utilisateur
  const handleSearchUser = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('🔍 Recherche utilisateur:', query);
      
      const { data, error } = await supabase.functions.invoke(
        'validate-transfer-recipient',
        {
          body: { identifier: query }
        }
      );
      
      if (error) {
        console.error('Erreur recherche:', error);
        throw error;
      }
      
      console.log('📋 Résultat recherche:', data);
      
      if (data?.valid && data?.recipientId) {
        setSearchResults([{
          user_id: data.recipientId,
          display_name: data.recipientName || 'Utilisateur',
          phone_number: query.includes('@') ? undefined : query,
          avatar_color: generateAvatarColor(data.recipientId),
          last_transfer_date: new Date().toISOString(),
          total_transfers: 0
        }]);
        
        toast({
          title: '✅ Utilisateur trouvé',
          description: data.recipientName || 'Contact valide',
        });
      } else {
        setSearchResults([]);
        toast({
          title: 'Utilisateur introuvable',
          description: 'Vérifiez le numéro ou l\'email',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
      toast({
        title: 'Erreur de recherche',
        description: error.message || 'Impossible de rechercher l\'utilisateur',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedContact || (!selectedAmount && !customAmount)) {
      toast({
        title: 'Sélection incomplète',
        description: 'Choisissez un contact et un montant',
        variant: 'destructive'
      });
      return;
    }

    const amount = selectedAmount || parseFloat(customAmount);
    
    if (amount < 100 || amount > 50000) {
      toast({
        title: 'Montant invalide',
        description: 'Le montant doit être entre 100 et 50 000 CDF',
        variant: 'destructive'
      });
      return;
    }

    if (!wallet || wallet.balance < amount) {
      toast({
        title: 'Solde insuffisant',
        description: `Vous avez ${wallet?.balance || 0} CDF disponible`,
        variant: 'destructive'
      });
      return;
    }

    setIsTransferring(true);

    try {
      await transferFunds(selectedContact, amount, 'Transfert rapide');
      
      setShowConfetti(true);
      
      toast({
        title: '✨ Transfert réussi !',
        description: `${amount} CDF envoyés avec succès`,
      });

      setTimeout(() => {
        onTransferSuccess?.();
        onClose();
        // Reset states
        setSelectedContact(null);
        setSelectedAmount(null);
        setCustomAmount('');
        setShowConfetti(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erreur de transfert',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!open) return null;

  // Render content (used by both mobile drawer and desktop popup)
  const renderContent = () => (
    <>
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="wallet-glass p-3 md:p-4 rounded-2xl border border-border/30"
      >
        <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {wallet?.balance?.toLocaleString() || '0'} <span className="text-base md:text-lg text-muted-foreground">CDF</span>
        </p>
      </motion.div>

      {/* Contacts */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Contacts favoris</h3>
        {loadingContacts ? (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="quick-transfer-loading h-20 md:h-24 rounded-xl bg-muted/30" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground text-center mb-4">
              {loadingContacts ? 'Chargement...' : 'Aucun transfert récent'}
            </p>
            
            {/* Interface de recherche manuelle */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Rechercher un contact
                </p>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Numéro de téléphone ou email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUser(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-500" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Saisissez au moins 3 caractères
              </p>
            </div>
            
            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <p className="text-xs font-medium mb-2 text-foreground">Résultat</p>
                <ContactCard
                  contact={searchResults[0]}
                  selected={selectedContact === searchResults[0].user_id}
                  onClick={() => setSelectedContact(searchResults[0].user_id)}
                />
              </motion.div>
            )}
            
            {!loadingContacts && (
              <button 
                onClick={() => {
                  console.log('🔄 Rafraîchissement manuel des contacts');
                  refreshContacts();
                }}
                className="text-xs text-purple-500 hover:text-purple-600 underline mx-auto block"
              >
                Actualiser les contacts
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {contacts.slice(0, 6).map((contact, index) => (
              <motion.div
                key={contact.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ContactCard
                  contact={contact}
                  selected={selectedContact === contact.user_id}
                  onClick={() => setSelectedContact(contact.user_id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Amounts */}
      {selectedContact && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">Montant</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {QUICK_AMOUNTS.map((amount, index) => (
              <motion.button
                key={amount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className={`p-3 md:p-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
                  selectedAmount === amount
                    ? 'contact-selected bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white'
                    : 'bg-muted/50 hover:bg-muted text-foreground hover:scale-105'
                }`}
              >
                {amount.toLocaleString()} CDF
              </motion.button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mt-3">
            <input
              type="number"
              placeholder="Autre montant..."
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </motion.div>
      )}

      {/* Footer Button */}
      {selectedContact && (selectedAmount || customAmount) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <button
            onClick={handleTransfer}
            disabled={isTransferring}
            className="w-full quick-transfer-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Transfert en cours...
              </>
            ) : (
              <>
                Envoyer instantanément
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </>
  );

  // Mobile: Vaul Drawer
  if (isMobile) {
    return (
      <>
        <Drawer.Root open={open} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-background via-background to-muted/20 rounded-t-3xl shadow-2xl border-t border-border/50 outline-none">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 quick-transfer-gradient opacity-5 pointer-events-none rounded-t-3xl" />
              
              {/* Drag handle */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/60 mt-4 mb-2" />
              
              {/* Header */}
              <div className="relative px-4 pb-3 border-b border-border/30">
                <button
                  onClick={onClose}
                  className="absolute top-0 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg"
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                      Transfert Rapide
                    </h2>
                    <p className="text-xs text-muted-foreground">Envoyez instantanément</p>
                  </div>
                </div>
              </div>

              {/* Content with safe area padding */}
              <div className="px-4 py-4 space-y-4 max-h-[75vh] overflow-y-auto scroll-smooth pb-safe-or-4">
                {renderContent()}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Confetti */}
        <SuccessConfetti show={showConfetti} />
      </>
    );
  }

  // Desktop: Centered popup
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-50"
          >
            <div className="relative bg-gradient-to-br from-background via-background to-muted/20 rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 quick-transfer-gradient opacity-5 pointer-events-none" />
              
              {/* Header */}
              <div className="relative p-6 pb-4 border-b border-border/30">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg"
                  >
                    <Zap className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                      Transfert Rapide
                    </h2>
                    <p className="text-sm text-muted-foreground">Envoyez instantanément</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scroll-smooth">
                {renderContent()}
              </div>
            </div>
          </motion.div>

          {/* Confetti */}
          <SuccessConfetti show={showConfetti} />
        </>
      )}
    </AnimatePresence>
  );
};
