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
        <SheetHeader className="pb-6">
          {/* Drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full" />
          
          <SheetTitle className="text-2xl font-bold text-center">
            {t('home.services.more_services')}
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-8">
          {additionalServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleServiceClick(service.id)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md min-h-[140px]"
              >
                {/* Icône simple avec gradient */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${service.gradient.replace('from-', '').replace('via-', ', ').replace('to-', ', ')})` 
                  }}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>

                {/* Nom du service uniquement */}
                <h3 className="font-semibold text-sm text-center text-foreground dark:text-white">
                  {service.name}
                </h3>
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
