import { useState } from 'react';
import { Ticket, Trophy, Gift, Timer, Sparkles, Car, Package, ShoppingCart, Star, Users, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLottery } from '@/hooks/useLottery';
import { LotteryDrawCard } from './LotteryDrawCard';
import { LotteryTicketsList } from './LotteryTicketsList';
import { LotteryWinsGallery } from './LotteryWinsGallery';
import { ScratchCardGallery } from './scratch/ScratchCardGallery';
import { LoyaltyPointsWidget } from '@/components/loyalty/LoyaltyPointsWidget';
import { FloatingParticles } from '@/components/wallet/FloatingParticles';
import { motion } from 'framer-motion';

export const LotteryDashboard = () => {
  const { t } = useLanguage();
  const { loading, availableTickets, currentDraws, tickets, myWins } = useLottery();

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Hero Header Animé */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative p-6 bg-gradient-to-r from-primary via-purple-600 to-pink-500 rounded-b-3xl shadow-2xl overflow-hidden"
      >
        <FloatingParticles />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <motion.h1 
              className="text-3xl font-black text-white drop-shadow-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ✨ Kwenda Tombola
            </motion.h1>
            <p className="text-white/90 text-sm mt-1">
              Grattez, gagnez, convertissez !
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-10 w-10 text-white drop-shadow-lg" />
          </motion.div>
        </div>
      </motion.div>

      {/* Widget Points de Fidélité */}
      <div className="px-4 mb-4">
        <LoyaltyPointsWidget />
      </div>

      {/* Navigation moderne avec glassmorphism */}
      <Tabs defaultValue="scratch" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 bg-background/60 backdrop-blur-2xl border-b border-border/50 px-4 py-3 shadow-lg">
          <TabsList className="w-full h-12 p-1 bg-muted/50 backdrop-blur-sm grid grid-cols-5 rounded-2xl">
            <TabsTrigger 
              value="scratch" 
              className="relative text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
            >
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Cartes</span>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger 
              value="draws" 
              className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Timer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tirages</span>
              {currentDraws.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{currentDraws.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Ticket className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tickets</span>
              {availableTickets > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{availableTickets}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="wins" 
              className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Trophy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Gains</span>
              {myWins.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">{myWins.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="how" 
              className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Gift className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Guide</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="scratch" className="p-4 m-0 overflow-auto">
            <ScratchCardGallery />
          </TabsContent>

          <TabsContent value="draws" className="p-4 space-y-3 m-0 overflow-auto">
            <div className="grid gap-3">
              {currentDraws.length > 0 ? (
                currentDraws.map((draw) => (
                  <LotteryDrawCard key={draw.id} draw={draw} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun tirage actif pour le moment</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="p-4 m-0 overflow-auto">
            <LotteryTicketsList tickets={tickets} />
          </TabsContent>

          <TabsContent value="wins" className="p-4 m-0 overflow-auto">
            <LotteryWinsGallery wins={myWins} />
          </TabsContent>

          <TabsContent value="how" className="p-4 space-y-4 m-0 overflow-auto">
            {/* Caroussel horizontal pour méthodes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Comment gagner des tickets ?
              </h3>
              
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                <div className="flex-shrink-0 bg-primary/10 border border-primary/20 rounded-xl p-3 min-w-[140px]">
                  <Car className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold text-sm">Transport</h4>
                  <p className="text-xs text-muted-foreground">1 ticket/course</p>
                </div>
                
                <div className="flex-shrink-0 bg-secondary/10 border border-secondary/20 rounded-xl p-3 min-w-[140px]">
                  <Package className="h-6 w-6 text-secondary mb-2" />
                  <h4 className="font-semibold text-sm">Livraison</h4>
                  <p className="text-xs text-muted-foreground">2 tickets/livraison</p>
                </div>
                
                <div className="flex-shrink-0 bg-accent/10 border border-accent/20 rounded-xl p-3 min-w-[140px]">
                  <ShoppingCart className="h-6 w-6 text-accent mb-2" />
                  <h4 className="font-semibold text-sm">Marketplace</h4>
                  <p className="text-xs text-muted-foreground">1-3 tickets</p>
                </div>
                
                <div className="flex-shrink-0 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 min-w-[140px]">
                  <Star className="h-6 w-6 text-yellow-600 mb-2" />
                  <h4 className="font-semibold text-sm">Évaluations</h4>
                  <p className="text-xs text-muted-foreground">1 ticket/5⭐</p>
                </div>
                
                <div className="flex-shrink-0 bg-green-500/10 border border-green-500/20 rounded-xl p-3 min-w-[140px]">
                  <Users className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-semibold text-sm">Parrainage</h4>
                  <p className="text-xs text-muted-foreground">5 tickets/ami</p>
                </div>
                
                <div className="flex-shrink-0 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 min-w-[140px]">
                  <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-sm">Connexion</h4>
                  <p className="text-xs text-muted-foreground">1 ticket/jour</p>
                </div>
              </div>
            </div>

            {/* Accordéon compact pour types de tirages */}
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="draw-types" className="border border-muted rounded-xl">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Types de tirages</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">Flash Quotidien</h4>
                        <p className="text-xs text-muted-foreground">Chaque jour 20h</p>
                      </div>
                      <Badge variant="outline" className="text-xs">1 ticket</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">Super Kwenda</h4>
                        <p className="text-xs text-muted-foreground">Chaque dimanche</p>
                      </div>
                      <Badge variant="outline" className="text-xs">5 tickets</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">Méga Jackpot</h4>
                        <p className="text-xs text-muted-foreground">Mensuel</p>
                      </div>
                      <Badge variant="outline" className="text-xs">10 tickets</Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};