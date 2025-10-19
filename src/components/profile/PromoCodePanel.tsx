import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePromoCode } from '@/hooks/usePromoCode';
import { Tag, Percent, Gift, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CongoButton, CongoCard, CongoBadge, CongoGradient } from '@/components/ui/CongoComponents';

interface PromoCodePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PromoCodePanel: React.FC<PromoCodePanelProps> = ({ open, onClose }) => {
  const { 
    activeCodes,
    usedCodes,
    applyPromoCode,
    isLoading 
  } = usePromoCode();
  
  const [newCode, setNewCode] = useState('');

  const handleApplyCode = async () => {
    if (!newCode.trim()) return;
    
    const success = await applyPromoCode(newCode.trim());
    if (success) {
      setNewCode('');
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  const getDiscountText = (code: any) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    }
    return formatCurrency(code.discount_value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto sm:max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Tag className="h-5 w-5 text-congo-yellow" />
            Codes Promo & Réductions
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="available" className="text-xs sm:text-sm data-[state=active]:bg-congo-yellow data-[state=active]:text-white">Disponibles</TabsTrigger>
            <TabsTrigger value="personalized" className="text-xs sm:text-sm data-[state=active]:bg-congo-yellow data-[state=active]:text-white">Personnalisés</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm data-[state=active]:bg-congo-yellow data-[state=active]:text-white">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <CongoGradient variant="subtle" className="rounded-xl border border-congo-yellow/20">
              <Card className="bg-transparent border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Percent className="h-5 w-5 text-congo-yellow" />
                    Entrer un code promo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Entrez votre code promo"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-card border border-congo-yellow/40 focus:border-congo-yellow shadow-lg"
                    />
                    <CongoButton 
                      onClick={handleApplyCode}
                      disabled={!newCode.trim() || isLoading}
                      variant="warning"
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? 'Vérification...' : 'Appliquer'}
                    </CongoButton>
                  </div>
                </CardContent>
              </Card>
            </CongoGradient>

            <div className="space-y-3">
              {activeCodes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun code promo disponible</p>
                      <p className="text-sm">Revenez plus tard pour de nouvelles offres !</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                activeCodes.map((code) => (
                    <CongoCard key={code.id} variant="warning" className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CongoBadge variant="warning" size="sm" className="font-mono">
                              {code.code}
                            </CongoBadge>
                            <CongoBadge variant="warning" size="sm">
                              {getDiscountText(code)}
                            </CongoBadge>
                          </div>
                          <p className="text-sm text-grey-700 mb-2">
                            {code.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-grey-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {code.valid_until && `Expire le ${new Date(code.valid_until).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <CongoButton 
                          variant="warning"
                          size="sm"
                          onClick={() => setNewCode(code.code)}
                          className="w-full sm:w-auto mt-3"
                        >
                          Utiliser
                        </CongoButton>
                      </div>
                    </CardContent>
                  </CongoCard>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="personalized" className="space-y-4">
            <Card className="bg-gradient-congo-subtle border-congo-red/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Gift className="h-5 w-5 text-congo-red" />
                  Offres Personnalisées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune offre personnalisée</p>
                  <p className="text-sm">Utilisez plus souvent l'app pour débloquer des offres exclusives !</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gradient-congo-subtle border-congo-blue/20">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Historique d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                {usedCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun code utilisé</p>
                    <p className="text-sm">Vos codes utilisés apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usedCodes.map((code) => (
                      <div key={code.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-congo-blue/10 border border-congo-blue/20 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium font-mono text-foreground">{code.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {code.used_at && new Date(code.used_at).toLocaleDateString()} - 
                            {getDiscountText(code)}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-congo-blue" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};