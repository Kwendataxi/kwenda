import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Wallet, CreditCard, Trophy, QrCode, Users, Car } from 'lucide-react';

interface DriverMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tab: 'wallet' | 'credits' | 'challenges' | 'partner' | 'referrals' | 'vehicles') => void;
}

export const DriverMoreSheet: React.FC<DriverMoreSheetProps> = ({ open, onOpenChange, onSelect }) => {
  const items = [
    { id: 'vehicles', label: 'Mes Véhicules', icon: Car },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'credits', label: 'Crédits', icon: CreditCard },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'partner', label: 'Code Partenaire', icon: QrCode },
    { id: 'referrals', label: 'Parrainage', icon: Users },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-screen-sm mx-auto rounded-t-2xl border shadow-xl">
        <SheetHeader>
          <SheetTitle>Plus d'options</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted transition-colors"
              onClick={() => {
                onSelect(id);
                onOpenChange(false);
              }}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DriverMoreSheet;
