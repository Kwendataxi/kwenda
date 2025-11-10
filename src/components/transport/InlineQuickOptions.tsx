import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface InlineQuickOptionsProps {
  biddingEnabled: boolean;
  onToggleBidding: (enabled: boolean) => void;
  isForSomeoneElse: boolean;
  onToggleBeneficiary: (enabled: boolean) => void;
  hasDestination: boolean;
}

export default function InlineQuickOptions({
  biddingEnabled,
  onToggleBidding,
  isForSomeoneElse,
  onToggleBeneficiary,
  hasDestination
}: InlineQuickOptionsProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  // Ne montrer que si une destination est sélectionnée
  if (!hasDestination) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2"
    >
      {/* Mode enchères */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onToggleBidding(!biddingEnabled);
          triggerHaptic();
        }}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
          biddingEnabled
            ? "bg-amber-500/10 border-amber-500/30 shadow-sm"
            : "bg-card/50 border-border/50 hover:border-border"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            biddingEnabled ? "bg-amber-500/20" : "bg-muted/30"
          )}>
            <Sparkles className={cn(
              "w-4 h-4",
              biddingEnabled ? "text-amber-600" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-left">
            <p className={cn(
              "font-semibold text-sm",
              biddingEnabled ? "text-amber-600" : "text-foreground"
            )}>
              Mode enchères
            </p>
            <p className="text-[10px] text-muted-foreground">
              Proposez votre prix
            </p>
          </div>
        </div>
        <Switch
          checked={biddingEnabled}
          onCheckedChange={(checked) => {
            onToggleBidding(checked);
            triggerHaptic();
          }}
          className="pointer-events-none"
        />
      </motion.button>

      {/* Réserver pour un proche */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onToggleBeneficiary(!isForSomeoneElse);
          triggerHaptic();
        }}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
          isForSomeoneElse
            ? "bg-blue-500/10 border-blue-500/30 shadow-sm"
            : "bg-card/50 border-border/50 hover:border-border"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            isForSomeoneElse ? "bg-blue-500/20" : "bg-muted/30"
          )}>
            <Users className={cn(
              "w-4 h-4",
              isForSomeoneElse ? "text-blue-600" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-left">
            <p className={cn(
              "font-semibold text-sm",
              isForSomeoneElse ? "text-blue-600" : "text-foreground"
            )}>
              Pour un proche
            </p>
            <p className="text-[10px] text-muted-foreground">
              Réserver pour quelqu'un
            </p>
          </div>
        </div>
        <Switch
          checked={isForSomeoneElse}
          onCheckedChange={(checked) => {
            onToggleBeneficiary(checked);
            triggerHaptic();
          }}
          className="pointer-events-none"
        />
      </motion.button>
    </motion.div>
  );
}
