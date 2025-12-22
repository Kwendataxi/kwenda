/**
 * 🎯 Actions Flottantes Profil - Design Moderne
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Gift, MoreHorizontal, Shield, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface FloatingActionsProps {
  onReferralClick: () => void;
  onSupportClick: () => void;
  serviceType: 'taxi' | 'delivery';
}

export const FloatingActions = ({
  onReferralClick,
  onSupportClick,
  serviceType
}: FloatingActionsProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const themeColor = serviceType === 'taxi' ? 'bg-primary hover:bg-primary/90' : 'bg-green-500 hover:bg-green-600';

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
      {/* Menu déroulant */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-lg p-2 mb-2"
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onSupportClick();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Shield className="w-4 h-4 text-muted-foreground" />
              Support & Assistance
            </button>
            <button
              onClick={async () => {
                setShowMenu(false);
                await signOut();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boutons principaux */}
      <div className="flex items-center gap-2">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            className={`h-12 px-5 rounded-full shadow-lg ${themeColor} text-white`}
            onClick={() => navigate('/app/chauffeur?tab=earnings')}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Wallet
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={onReferralClick}
          >
            <Gift className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg bg-card"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <MoreHorizontal className="w-5 h-5" />
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
