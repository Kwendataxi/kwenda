import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import BeneficiarySelector from './BeneficiarySelector';
import { cn } from '@/lib/utils';

interface BookingOptionsAccordionProps {
  biddingEnabled: boolean;
  onToggleBidding: (enabled: boolean) => void;
  onClientProposedPrice?: (price: number) => void;
  calculatedPrice: number;
  
  isForSomeoneElse: boolean;
  onToggleBeneficiary: (enabled: boolean) => void;
  selectedBeneficiary: any;
  onSelectBeneficiary: (beneficiary: any) => void;
}

export default function BookingOptionsAccordion({
  biddingEnabled,
  onToggleBidding,
  onClientProposedPrice,
  calculatedPrice,
  isForSomeoneElse,
  onToggleBeneficiary,
  selectedBeneficiary,
  onSelectBeneficiary
}: BookingOptionsAccordionProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const estimatedSavings = Math.floor(calculatedPrice * 0.3);

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="space-y-2">
        {/* Mode enchères */}
        <AccordionItem value="bidding" className="glass-card rounded-2xl overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">Mode enchères</h4>
                    {biddingEnabled && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                        Actif
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Économisez jusqu'à {estimatedSavings.toLocaleString()} CDF
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={biddingEnabled} 
                  onCheckedChange={(checked) => {
                    onToggleBidding(checked);
                    triggerHaptic();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AnimatePresence>
              {biddingEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 border-t border-border/50"
                >
                  <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Sparkles className="w-4 h-4" />
                      <p className="text-xs font-medium">Comment ça marche ?</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                      <li className="list-disc">Proposez votre prix après confirmation</li>
                      <li className="list-disc">Les chauffeurs proches voient votre offre</li>
                      <li className="list-disc">Acceptez la meilleure proposition</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </AccordionContent>
        </AccordionItem>

        {/* Réserver pour autrui */}
        <AccordionItem value="beneficiary" className="glass-card rounded-2xl overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">Réserver pour autrui</h4>
                    {isForSomeoneElse && selectedBeneficiary && (
                      <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
                        {selectedBeneficiary.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Offrez un trajet à un proche
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isForSomeoneElse} 
                  onCheckedChange={(checked) => {
                    onToggleBeneficiary(checked);
                    triggerHaptic();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AnimatePresence>
              {isForSomeoneElse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 border-t border-border/50"
                >
                  <BeneficiarySelector
                    isForSomeoneElse={isForSomeoneElse}
                    onToggle={onToggleBeneficiary}
                    selectedBeneficiary={selectedBeneficiary}
                    onSelectBeneficiary={onSelectBeneficiary}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
