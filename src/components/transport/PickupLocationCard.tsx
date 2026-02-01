import { MapPin, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Fonction pour formater les adresses (enlever les Plus Codes)
const formatAddress = (address: string): string => {
  // Détecter les Plus Codes étendus (format 01BP6913ABIDJAN01 ou XXXX+XXX)
  const plusCodeRegex = /[A-Z0-9]{4,}[A-Z]{2,}[0-9]{2,}|[A-Z0-9]{4,}\+[A-Z0-9]{2,}/;
  
  if (address.match(plusCodeRegex)) {
    // Extraire uniquement la partie lisible après le Plus Code
    const parts = address.split(',').map(p => p.trim());
    const filtered = parts.filter(p => !p.match(plusCodeRegex));
    
    // Si on a des parties valides, les retourner
    if (filtered.length > 0) {
      return filtered.slice(-2).join(', '); // Les 2 dernières parties (quartier, ville)
    }
  }
  
  // Raccourcir les adresses trop longues (> 50 caractères)
  if (address.length > 50) {
    const parts = address.split(',').map(p => p.trim());
    return parts.slice(-2).join(', ');
  }
  
  return address;
};

interface PickupLocationCardProps {
  pickupAddress: string | null;
  onEdit: () => void;
}

export default function PickupLocationCard({ pickupAddress, onEdit }: PickupLocationCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [pickupAddress]);

  // Toggle collapse/expand
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollapsed) {
      setIsCollapsed(false);
    } else {
      onEdit();
    }
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        left: '1rem',
        right: isCollapsed ? 'auto' : '1rem'
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="absolute z-10"
      style={{ top: '5.5rem' }}
    >
      <Card 
        onClick={handleToggle}
        className="bg-white/95 backdrop-blur-md shadow-lg border-none cursor-pointer hover:shadow-xl transition-shadow overflow-hidden"
      >
        <motion.div
          animate={{
            width: isCollapsed ? '56px' : 'auto',
            height: isCollapsed ? '56px' : 'auto',
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="flex items-center"
        >
          {/* Collapsed View - Icon Only with Pulse */}
          <AnimatePresence>
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-14 h-14 flex items-center justify-center"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center relative"
                >
                  {/* Pulse effect */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-primary/20 rounded-full"
                  />
                  <MapPin className="w-5 h-5 text-primary relative z-10" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded View - Full Address */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex items-center justify-between gap-3 min-w-[280px]"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Point de prise en charge</p>
                    <p className="font-semibold text-foreground truncate">
                      {pickupAddress ? formatAddress(pickupAddress) : 'Votre emplacement'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Card>
    </motion.div>
  );
}
