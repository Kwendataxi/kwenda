import { Sparkles, Trophy, Gift } from 'lucide-react';
import '@/styles/lottery.css'; // Lazy-loaded: only when lottery features are accessed
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScratchCardGallery } from './scratch/ScratchCardGallery';
import { WinsHistory } from './history/WinsHistory';
import { CompactLoyaltyWidget } from '@/components/loyalty/CompactLoyaltyWidget';
import { useLottery } from '@/hooks/useLottery';
import { motion } from 'framer-motion';
import { Car, Package, ShoppingCart, Star, Users, Calendar } from 'lucide-react';

export const LotteryDashboard = () => {
  const { loading, myWins } = useLottery();

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header compact - 50% plus petit */}
      <div className="p-3 bg-gradient-to-r from-primary via-purple-600 to-pink-500 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white drop-shadow-lg">
              ✨ Kwenda Tombola
            </h1>
            <p className="text-white/90 text-xs">Grattez et gagnez !</p>
          </div>
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Widget Points ultra-compact */}
      <div className="px-3 py-2">
        <CompactLoyaltyWidget />
      </div>

      {/* Navigation 3 onglets */}
      <Tabs defaultValue="scratch" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 bg-background/60 backdrop-blur-xl border-b px-3 py-2">
          <TabsList className="w-full h-10 p-0.5 bg-muted/50 grid grid-cols-3 rounded-xl">
            <TabsTrigger 
              value="scratch" 
              className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Cartes
            </TabsTrigger>
            <TabsTrigger value="wins" className="text-sm data-[state=active]:bg-background rounded-lg">
              <Trophy className="h-4 w-4 mr-1" />
              Gains
              {myWins.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{myWins.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="how" className="text-sm data-[state=active]:bg-background rounded-lg">
              <Gift className="h-4 w-4 mr-1" />
              Guide
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="scratch" className="p-3 m-0">
            <ScratchCardGallery />
          </TabsContent>

          <TabsContent value="wins" className="p-3 m-0">
            <WinsHistory />
          </TabsContent>

          <TabsContent value="how" className="p-3 space-y-3 m-0">
            {/* Caroussel horizontal compact */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Comment gagner ?
              </h3>
              
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                <div className="flex-shrink-0 bg-primary/10 border border-primary/20 rounded-lg p-2 min-w-[110px]">
                  <Car className="h-5 w-5 text-primary mb-1" />
                  <h4 className="font-semibold text-xs">Transport</h4>
                  <p className="text-xs text-muted-foreground">1 carte/course</p>
                </div>
                
                <div className="flex-shrink-0 bg-secondary/10 border border-secondary/20 rounded-lg p-2 min-w-[110px]">
                  <Package className="h-5 w-5 text-secondary mb-1" />
                  <h4 className="font-semibold text-xs">Livraison</h4>
                  <p className="text-xs text-muted-foreground">2 cartes</p>
                </div>
                
                <div className="flex-shrink-0 bg-accent/10 border border-accent/20 rounded-lg p-2 min-w-[110px]">
                  <ShoppingCart className="h-5 w-5 text-accent mb-1" />
                  <h4 className="font-semibold text-xs">Marketplace</h4>
                  <p className="text-xs text-muted-foreground">1-3 cartes</p>
                </div>
                
                <div className="flex-shrink-0 bg-green-500/10 border border-green-500/20 rounded-lg p-2 min-w-[110px]">
                  <Users className="h-5 w-5 text-green-600 mb-1" />
                  <h4 className="font-semibold text-xs">Parrainage</h4>
                  <p className="text-xs text-muted-foreground">5 cartes/ami</p>
                </div>
              </div>
            </div>

            {/* Infos systeme pity */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200 rounded-lg p-3"
            >
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Système de Garantie
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plus vous grattez, plus vos chances augmentent ! Après plusieurs cartes communes, vous êtes garanti de gagner une carte rare ou mieux.
              </p>
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
