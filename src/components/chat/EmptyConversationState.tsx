import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';

interface EmptyConversationStateProps {
  participantName?: string;
  onSendQuickMessage: (message: string) => void;
}

const quickSuggestions = [
  { emoji: '👋', text: 'Bonjour, ce produit est-il disponible ?' },
  { emoji: '💰', text: 'Quel est votre meilleur prix ?' },
  { emoji: '📦', text: 'Livrez-vous à domicile ?' },
  { emoji: '🔄', text: 'Avez-vous d\'autres modèles ?' },
];

export const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  participantName = 'le vendeur',
  onSendQuickMessage
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-8 px-4 text-center h-full"
    >
      {/* Icône principale */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-orange-100 to-purple-100 dark:from-primary/10 dark:via-orange-900/20 dark:to-purple-900/20 flex items-center justify-center">
          <MessageCircle className="h-10 w-10 text-primary" />
        </div>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shadow-lg border-2 border-background"
        >
          <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </motion.div>
      </motion.div>

      {/* Message d'accueil */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-6"
      >
        <h4 className="font-semibold text-lg text-foreground">
          Discutez avec {participantName}
        </h4>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Envoyez un premier message pour démarrer la négociation
        </p>
      </motion.div>

      {/* Suggestions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-2 w-full max-w-[300px]"
      >
        <p className="text-xs text-muted-foreground/70 font-medium mb-1">
          💡 Suggestions rapides
        </p>
        {quickSuggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-2.5 px-3 text-sm hover:bg-primary/5 hover:border-primary/30 transition-all"
              onClick={() => onSendQuickMessage(suggestion.text)}
            >
              <span className="mr-2">{suggestion.emoji}</span>
              <span className="truncate">{suggestion.text}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
