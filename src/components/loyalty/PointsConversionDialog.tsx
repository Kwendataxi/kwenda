import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useKwendaPoints } from '@/hooks/useKwendaPoints';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp } from 'lucide-react';

interface PointsConversionDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PointsConversionDialog: React.FC<PointsConversionDialogProps> = ({ open, onClose }) => {
  const { points, convertToCredits, calculateConversionBonus, loading } = useKwendaPoints();
  const [pointsToConvert, setPointsToConvert] = useState(50);

  const bonusRate = calculateConversionBonus(pointsToConvert);
  const baseCredits = (pointsToConvert / 100) * 1000;
  const totalCredits = Math.round(baseCredits * (1 + bonusRate));

  const handleConvert = async () => {
    const success = await convertToCredits(pointsToConvert);
    if (success) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Convertir mes Points Kwenda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 p-4 rounded-xl border">
            <p className="text-sm text-muted-foreground mb-1">Points disponibles</p>
            <p className="text-3xl font-bold text-primary">
              {points.total_points} points
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Points à convertir</p>
              <Badge variant="outline">{pointsToConvert} points</Badge>
            </div>
            <Slider
              value={[pointsToConvert]}
              onValueChange={([value]) => setPointsToConvert(value)}
              min={50}
              max={points.total_points}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground text-center">
              Min: 50 points • Max: {points.total_points} points
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Crédits de base</span>
              <span className="font-medium">{baseCredits.toLocaleString()} CDF</span>
            </div>
            {bonusRate > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Bonus progressif (+{Math.round(bonusRate * 100)}%)
                </span>
                <span className="font-medium">
                  +{Math.round(baseCredits * bonusRate).toLocaleString()} CDF
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Solde Bonus</span>
              <span className="text-primary">{totalCredits.toLocaleString()} CDF</span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              💡 <strong>Important :</strong> Le Solde Bonus est utilisable uniquement dans l'écosystème Kwenda (courses, livraisons, marketplace). Il n'est pas retirable.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleConvert}
            disabled={loading || pointsToConvert < 50 || pointsToConvert > points.total_points}
          >
            {loading ? 'Conversion en cours...' : 'Convertir en Solde Bonus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
