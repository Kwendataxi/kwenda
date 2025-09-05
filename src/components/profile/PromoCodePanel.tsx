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

interface PromoCodePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PromoCodePanel: React.FC<PromoCodePanelProps> = ({ open, onClose }) => {
  const { 
    validatePromoCode, 
    availableCodes, 
    userUsage, 
    getPersonalizedCodes,
    isLoading 
  } = usePromoCode();
  
  const { toast } = useToast();
  const [newCode, setNewCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [personalizedCodes, setPersonalizedCodes] = useState<any[]>([]);

  React.useEffect(() => {
    if (open) {
      getPersonalizedCodes().then(setPersonalizedCodes).catch(console.error);
    }
  }, [open, getPersonalizedCodes]);

  const handleValidateCode = async () => {
    if (!newCode.trim()) return;
    
    setValidating(true);
    try {
      const result = await validatePromoCode(newCode, 5000, 'transport');
      
      if (result.isValid) {
        toast({
          title: "Code promo valide !",
          description: `Réduction de ${result.discountAmount} CDF disponible`,
        });
      } else {
        toast({
          title: "Code promo invalide",
          description: "Ce code n'est pas valide ou a expiré",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider le code promo",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
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
            <Card className="bg-gradient-congo-subtle border-congo-yellow/20">
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
                    className="flex-1 border-congo-yellow/40 focus:border-congo-yellow"
                  />
                  <Button 
                    onClick={handleValidateCode}
                    disabled={!newCode.trim() || validating}
                    className="bg-congo-yellow hover:bg-congo-yellow/90 text-white w-full sm:w-auto"
                  >
                    {validating ? 'Vérification...' : 'Valider'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {availableCodes.length === 0 ? (
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
                availableCodes.map((code) => (
                    <Card key={code.id} className="overflow-hidden bg-gradient-congo-subtle border-congo-yellow/20">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              {code.code}
                            </Badge>
                            <Badge variant="outline" className="text-congo-yellow border-congo-yellow/40">
                              {getDiscountText(code)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {code.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expire le {new Date(code.valid_until).toLocaleDateString()}
                            </span>
                            {code.min_order_amount > 0 && (
                              <span>
                                Min. {formatCurrency(code.min_order_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNewCode(code.code)}
                          className="border-congo-yellow/40 hover:bg-congo-yellow/10 hover:border-congo-yellow w-full sm:w-auto"
                        >
                          Utiliser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                {personalizedCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune offre personnalisée</p>
                    <p className="text-sm">Utilisez plus souvent l'app pour débloquer des offres exclusives !</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalizedCodes.map((code, index) => (
                      <Card key={index} className="bg-gradient-congo-subtle border-congo-red/20">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <Badge variant="default" className="mb-2 bg-congo-red text-white">
                                EXCLUSIF
                              </Badge>
                              <p className="font-medium">{code.title}</p>
                              <p className="text-sm text-muted-foreground">{code.description}</p>
                            </div>
                            <div className="text-right w-full sm:w-auto">
                              <div className="text-lg font-bold text-congo-red">
                                {code.discount}
                              </div>
                              <Button size="sm" className="mt-2 bg-congo-red hover:bg-congo-red/90 text-white w-full sm:w-auto">
                                Activer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gradient-congo-subtle border-congo-blue/20">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Historique d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                {userUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun code utilisé</p>
                    <p className="text-sm">Vos codes utilisés apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userUsage.map((usage) => (
                      <div key={usage.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-congo-blue/10 border border-congo-blue/20 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium font-mono text-foreground">{usage.promo_codes?.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(usage.used_at).toLocaleDateString()} - 
                            Économisé: {formatCurrency(usage.discount_amount)}
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