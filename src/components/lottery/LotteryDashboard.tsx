import { Sparkles, Trophy, Info, Ticket } from 'lucide-react';
import '@/styles/lottery.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScratchCardGallery } from './scratch/ScratchCardGallery';
import { WinsHistory } from './history/WinsHistory';
import { SuperLotteryDashboard } from './SuperLotteryDashboard';
import { CompactLoyaltyWidget } from '@/components/loyalty/CompactLoyaltyWidget';
import { useLottery } from '@/hooks/useLottery';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export interface LotteryDashboardProps {
  hideHeader?: boolean;
}

export const LotteryDashboard = ({ hideHeader = false }: LotteryDashboardProps) => {
  const { t } = useLanguage();
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
      {/* Header moderne avec gradient subtil */}
      {!hideHeader && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background rounded-b-2xl p-6 border-b border-border/50">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🎰 Tombola Kwenda
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Grattez vos tickets et gagnez des récompenses !
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Info className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Comment jouer ?
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Gagnez des tickets en utilisant l'app</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">🎨</span>
                      <span>Grattez vos cartes pour révéler vos gains</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">💰</span>
                      <span>Réclamez vos récompenses instantanément</span>
                    </li>
                  </ul>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Garantie :</strong> Plus vous jouez, plus vous gagnez des prix rares !
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Widget Points compact */}
      <div className={hideHeader ? "px-3 pt-3 pb-2" : "px-3 py-2"}>
        <CompactLoyaltyWidget />
      </div>

      {/* Navigation simplifiée 3 onglets avec Super Loterie */}
      <Tabs defaultValue="scratch" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 bg-background/60 dark:bg-background/40 backdrop-blur-xl border-b border-border/50 px-3 py-2">
          <TabsList className="w-full h-11 p-1 bg-muted/50 dark:bg-muted/20 grid grid-cols-3 rounded-xl">
            <TabsTrigger 
              value="scratch" 
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"
            >
              <Ticket className="h-4 w-4 mr-2" />
              À gratter
            </TabsTrigger>
            <TabsTrigger 
              value="super" 
              className="text-sm font-medium data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Super Loterie
            </TabsTrigger>
            <TabsTrigger 
              value="wins" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Historique
              {myWins.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{myWins.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="scratch" className="p-3 m-0">
            <ScratchCardGallery />
          </TabsContent>

          <TabsContent value="super" className="p-3 m-0">
            <SuperLotteryDashboard />
          </TabsContent>

          <TabsContent value="wins" className="p-3 m-0">
            <WinsHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
