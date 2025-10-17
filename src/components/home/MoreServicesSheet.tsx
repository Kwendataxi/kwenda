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
      gradient: 'from-purple-500 to-pink-500',
      color: '#9333EA'
    },
    {
      id: 'gift_cards',
      name: t('home.services.gift_cards'),
      description: t('home.services.gift_cards_desc'),
      icon: Gift,
      gradient: 'from-pink-500 to-rose-500',
      color: '#EC4899'
    },
    {
      id: 'airtime',
      name: t('home.services.airtime'),
      description: t('home.services.airtime_desc'),
      icon: Smartphone,
      gradient: 'from-blue-500 to-cyan-500',
      color: '#3B82F6'
    },
    {
      id: 'bill_payment',
      name: t('home.services.bill_payment'),
      description: t('home.services.bill_payment_desc'),
      icon: CreditCard,
      gradient: 'from-green-500 to-emerald-500',
      color: '#10B981'
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
          <SheetTitle className="text-2xl font-black text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('home.services.more_services')}
          </SheetTitle>
          <SheetDescription className="text-center text-muted-foreground">
            {t('home.services.more_services_desc')}
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-4 px-4 pb-safe">
          {additionalServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleServiceClick(service.id)}
                className="relative group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                  style={{ background: service.gradient }}
                />

                {/* Icon */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-all duration-300"
                  style={{ background: service.gradient }}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>

                {/* Text */}
                <h3 className="font-bold text-sm text-center mb-1 text-foreground">
                  {service.name}
                </h3>
                <p className="text-xs text-muted-foreground text-center line-clamp-2">
                  {service.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
