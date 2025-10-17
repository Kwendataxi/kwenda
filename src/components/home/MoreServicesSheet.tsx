import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Gift, Smartphone, CreditCard, Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface MoreServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceSelect: (service: string) => void;
}

export const MoreServicesSheet = ({ 
  isOpen, 
  onClose, 
  onServiceSelect 
}: MoreServicesSheetProps) => {
  const { t } = useLanguage();

  const additionalServices = [
    {
      id: 'lottery',
      name: t('home.services.lottery'),
      description: t('home.services.lottery_desc'),
      icon: Ticket,
      gradient: 'from-purple-600 via-pink-500 to-rose-500',
      iconColor: '#A855F7',
      shadowColor: 'rgba(168, 85, 247, 0.5)',
      emoji: '🎰',
      popular: true
    },
    {
      id: 'gift_cards',
      name: t('home.services.gift_cards'),
      description: t('home.services.gift_cards_desc'),
      icon: Gift,
      gradient: 'from-rose-500 via-pink-600 to-red-500',
      iconColor: '#EC4899',
      shadowColor: 'rgba(236, 72, 153, 0.5)',
      emoji: '🎁',
      popular: false
    },
    {
      id: 'airtime',
      name: t('home.services.airtime'),
      description: t('home.services.airtime_desc'),
      icon: Smartphone,
      gradient: 'from-blue-600 via-cyan-500 to-teal-500',
      iconColor: '#3B82F6',
      shadowColor: 'rgba(59, 130, 246, 0.5)',
      emoji: '📱',
      popular: false
    },
    {
      id: 'bill_payment',
      name: t('home.services.bill_payment'),
      description: t('home.services.bill_payment_desc'),
      icon: CreditCard,
      gradient: 'from-emerald-600 via-green-500 to-teal-500',
      iconColor: '#10B981',
      shadowColor: 'rgba(16, 185, 129, 0.5)',
      emoji: '💳',
      popular: false
    }
  ];

  const handleServiceClick = (serviceId: string) => {
    onServiceSelect(serviceId);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-3xl border-t border-border/50 bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader className="pb-8 relative">
          {/* Drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SheetTitle className="text-3xl font-black text-center bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
              {t('home.services.more_services')}
            </SheetTitle>
            
            {/* Badge nombre de services */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-2 mx-auto mt-2 px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full"
            >
              <span className="text-sm font-bold text-primary">4 services disponibles</span>
            </motion.div>
          </motion.div>
          
          <SheetDescription className="text-center text-muted-foreground dark:text-gray-400 mt-3 text-base">
            {t('home.services.more_services_desc')}
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 pb-8">
          {additionalServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                onClick={() => handleServiceClick(service.id)}
                className="relative group flex flex-col items-center p-8 rounded-3xl bg-white/10 dark:bg-black/20 backdrop-blur-2xl border-2 border-white/20 dark:border-white/10 hover:border-white/40 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_60px_-15px] min-h-[280px]"
                style={{
                  boxShadow: `0 20px 60px -15px ${service.shadowColor}`
                }}
              >
                {/* Badge Populaire */}
                {service.popular && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg"
                  >
                    ⭐ Populaire
                  </motion.div>
                )}

                {/* Glow effect animé */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    background: `linear-gradient(135deg, ${service.gradient.replace('from-', '').replace('via-', ', ').replace('to-', ', ')})` 
                  }}
                />

                {/* Icône modernisée */}
                <motion.div
                  className="relative mb-5"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Cercle blanc background */}
                  <div className="absolute inset-0 w-20 h-20 bg-white dark:bg-white/90 rounded-2xl transform rotate-6 opacity-90" />
                  
                  {/* Container icône avec gradient */}
                  <div
                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-6 transition-transform group-hover:rotate-0 duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${service.gradient.replace('from-', '').replace('via-', ', ').replace('to-', ', ')})` 
                    }}
                  >
                    <Icon 
                      className="w-10 h-10 text-white drop-shadow-lg" 
                      strokeWidth={3} 
                    />
                  </div>

                  {/* Effet brillance */}
                  <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>

                {/* Textes améliorés */}
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">{service.emoji}</span>
                    <h3 className="font-black text-base text-center text-foreground dark:text-white">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 text-center line-clamp-2 opacity-80">
                    {service.description}
                  </p>
                </div>

                {/* Indicateur d'action */}
                <motion.div
                  className="mt-4 flex items-center gap-2 text-xs font-bold text-primary dark:text-primary/90"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  Découvrir
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
