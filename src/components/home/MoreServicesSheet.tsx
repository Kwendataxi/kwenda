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
      icon: Ticket,
      gradient: 'hsl(262, 83%, 58%), hsl(330, 81%, 60%), hsl(350, 89%, 60%)',
      iconColor: 'hsl(262, 83%, 58%)'
    },
    {
      id: 'gift_cards',
      name: t('home.services.gift_cards'),
      icon: Gift,
      gradient: 'hsl(350, 89%, 60%), hsl(330, 81%, 45%), hsl(0, 72%, 51%)',
      iconColor: 'hsl(330, 81%, 60%)'
    },
    {
      id: 'airtime',
      name: t('home.services.airtime'),
      icon: Smartphone,
      gradient: 'hsl(221, 83%, 53%), hsl(189, 94%, 43%), hsl(173, 80%, 40%)',
      iconColor: 'hsl(221, 83%, 53%)'
    },
    {
      id: 'bill_payment',
      name: t('home.services.bill_payment'),
      icon: CreditCard,
      gradient: 'hsl(158, 64%, 52%), hsl(142, 71%, 45%), hsl(173, 80%, 40%)',
      iconColor: 'hsl(142, 71%, 45%)'
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                onClick={() => handleServiceClick(service.id)}
                className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl min-h-[160px] overflow-hidden"
              >
                {/* Icône avec animation */}
                <motion.div
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${service.gradient})`,
                      boxShadow: `0 8px 24px -8px ${service.iconColor}`
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>

                {/* Nom du service */}
                <h3 className="font-semibold text-base text-center text-foreground dark:text-white">
                  {service.name}
                </h3>
                
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
