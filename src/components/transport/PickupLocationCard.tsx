import { MapPin, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface PickupLocationCardProps {
  pickupAddress: string | null;
  onEdit: () => void;
}

export default function PickupLocationCard({ pickupAddress, onEdit }: PickupLocationCardProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="absolute top-4 left-4 right-4 z-10"
    >
      <Card 
        onClick={onEdit}
        className="bg-white/95 backdrop-blur-md shadow-lg border-none cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Point de prise en charge</p>
              <p className="font-semibold text-foreground">
                {pickupAddress || 'Votre emplacement'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
}
