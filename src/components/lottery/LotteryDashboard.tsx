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
import { LotteryWinsList } from './LotteryWinsList';
import { ScratchCardGallery } from './scratch/ScratchCardGallery';

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
      {/* En-tête compact - masqué en modal */}
      <div className="p-4 pb-0 hidden sm:block">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Tombola Kwenda</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gagnez des tickets et remportez des prix !
        </p>
      </div>

      {/* Statistiques en chips horizontales */}
      <div className="px-4 mb-4 flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 no-scrollbar">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl px-4 py-3 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{availableTickets}</p>
                <p className="text-xs text-muted-foreground">Tickets</p>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 bg-gradient-to-r from-secondary/20 to-secondary/10 backdrop-blur-sm border border-secondary/20 rounded-xl px-4 py-3 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-secondary" />
              <div>
                <p className="text-lg font-bold text-secondary">{currentDraws.length}</p>
                <p className="text-xs text-muted-foreground">Tirages</p>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 bg-gradient-to-r from-accent/20 to-accent/10 backdrop-blur-sm border border-accent/20 rounded-xl px-4 py-3 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <div>
                <p className="text-lg font-bold text-accent">{myWins.length}</p>
                <p className="text-xs text-muted-foreground">Gains</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation sticky moderne */}
      <Tabs defaultValue="draws" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <TabsList className="w-full h-11 p-1 bg-muted/50 backdrop-blur-sm grid grid-cols-5">
            <TabsTrigger 
              value="scratch" 
              className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cartes</span>
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
            <LotteryWinsList wins={myWins} />
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