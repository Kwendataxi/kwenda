import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Info, Ticket, Gift, Zap, Star, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DailyCardBanner } from './DailyCardBanner';
import { KwendaGrattaCard } from './scratch/KwendaGrattaCard';
import { CompactLoyaltyWidget } from '@/components/loyalty/CompactLoyaltyWidget';
import { useKwendaGratta } from '@/hooks/useKwendaGratta';
import { CARD_TYPE_CONFIG, REWARD_CONFIG } from '@/types/kwenda-gratta';
import { cn } from '@/lib/utils';
import '@/styles/kwenda-gratta.css';
import '@/styles/lottery.css';

export interface KwendaGrattaDashboardProps {
  hideHeader?: boolean;
}

export const KwendaGrattaDashboard: React.FC<KwendaGrattaDashboardProps> = ({ 
  hideHeader = false 
}) => {
  const {
    loading,
    cards,
    unscratched,
    revealed,
    dailyCardAvailable,
    nextDailyCardAt,
    activityLevel,
    cardStats,
    claimDailyCard,
    updateScratchProgress,
    revealCard
  } = useKwendaGratta();

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header Kwenda Gratta 🇨🇩 */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-b-2xl p-6 border-b border-border/50"
        >
          {/* Fond avec motif africain */}
          <div className="absolute inset-0 african-totem-bg opacity-20" />
          
          {/* Bande tricolore RDC */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-[hsl(var(--kwenda-blue))]" />
            <div className="flex-1 bg-[hsl(var(--kwenda-yellow))]" />
            <div className="flex-1 bg-[hsl(var(--kwenda-red))]" />
          </div>

          {/* Effet de brillance */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-2xl font-black flex items-center gap-2"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <span className="bg-gradient-to-r from-[hsl(var(--kwenda-blue))] via-[hsl(var(--kwenda-yellow))] to-[hsl(var(--kwenda-red))] bg-clip-text text-transparent">
                  🎰 Kwenda Gratta
                </span>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🇨🇩
                </motion.span>
              </motion.h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gratte ta carte et gagne des bonus !
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
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Comment jouer ?
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">🎁</span>
                      <span>Récupère ta <strong>carte gratuite</strong> chaque jour</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">👆</span>
                      <span>Gratte avec ton doigt pour révéler ton bonus</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">🚀</span>
                      <span>Plus tu utilises l'app, meilleures sont tes cartes !</span>
                    </li>
                  </ul>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Niveau d'activité :</strong>{' '}
                      <Badge variant="secondary" className="ml-1">
                        {activityLevel === 'vip' ? '⭐ VIP' : 
                         activityLevel === 'active' ? '🔥 Actif' :
                         activityLevel === 'casual' ? '👍 Régulier' :
                         activityLevel === 'new' ? '🌱 Nouveau' : '💤 Inactif'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>
      )}

      {/* Carte du jour */}
      <div className="px-3 pt-3">
        <DailyCardBanner
          available={dailyCardAvailable}
          nextCardAt={nextDailyCardAt}
          onClaim={claimDailyCard}
          loading={loading}
        />
      </div>

      {/* Widget Points compact */}
      <div className="px-3 py-2">
        <CompactLoyaltyWidget />
      </div>

      {/* Statistiques par type de carte */}
      <div className="px-3 pb-2">
        <div className="gratta-stats-grid">
          {(['standard', 'active', 'rare', 'mega'] as const).map((type) => {
            const config = CARD_TYPE_CONFIG[type];
            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  'gratta-stat-card',
                  `gratta-stat-${config.colorClass}`
                )}
              >
                <span className="text-lg">{config.emoji}</span>
                <div className="text-xl font-bold">{cardStats[type]}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {config.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs defaultValue="scratch" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 bg-background/60 backdrop-blur-xl border-b border-border/50 px-3 py-2">
          <TabsList className="w-full h-11 p-1 bg-muted/50 grid grid-cols-2 rounded-xl">
            <TabsTrigger 
              value="scratch" 
              className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--kwenda-blue))] data-[state=active]:to-[hsl(var(--kwenda-yellow))] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
            >
              <Ticket className="h-4 w-4 mr-2" />
              À gratter
              {unscratched.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-white/20">
                  {unscratched.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="revealed" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Révélées
              {revealed.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {revealed.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Cartes à gratter */}
          <TabsContent value="scratch" className="p-3 m-0">
            {unscratched.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {unscratched.map((card, index) => (
                    <motion.div
                      key={card.win_id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: { delay: index * 0.1 } 
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <KwendaGrattaCard
                        card={card}
                        onScratch={(pct) => updateScratchProgress(card.win_id, pct)}
                        onReveal={() => revealCard(card.win_id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="pt-12 pb-12 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--kwenda-blue))]/20 via-[hsl(var(--kwenda-yellow))]/20 to-[hsl(var(--kwenda-red))]/20 flex items-center justify-center"
                  >
                    <Ticket className="h-10 w-10 text-primary/50" />
                  </motion.div>
                  
                  <p className="text-lg font-semibold mb-2">Aucune carte à gratter</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Récupère ta <strong>carte quotidienne</strong> ci-dessus ou gagne des cartes en utilisant Kwenda ! 🚗📦🛒
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs">
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <span className="block text-lg">🚗</span>
                      <span>Course</span>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <span className="block text-lg">📦</span>
                      <span>Livraison</span>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <span className="block text-lg">🛒</span>
                      <span>Marketplace</span>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <span className="block text-lg">🤝</span>
                      <span>Parrainage</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cartes révélées */}
          <TabsContent value="revealed" className="p-3 m-0">
            {revealed.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {revealed.map((card, index) => (
                    <motion.div
                      key={card.win_id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        transition: { delay: index * 0.1 }
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <KwendaGrattaCard
                        card={card}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="pt-12 pb-12 text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500/50" />
                  </motion.div>
                  <p className="text-base font-medium">Aucune carte révélée</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gratte tes cartes pour découvrir tes bonus !
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
