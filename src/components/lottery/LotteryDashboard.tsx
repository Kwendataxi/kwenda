import { useState } from 'react';
import { Ticket, Trophy, Gift, Timer, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLottery } from '@/hooks/useLottery';
import { LotteryDrawCard } from './LotteryDrawCard';
import { LotteryTicketsList } from './LotteryTicketsList';
import { LotteryWinsList } from './LotteryWinsList';

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
    <div className="p-6 space-y-6">
      {/* En-tête avec statistiques */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tombola Kwenda</h1>
        </div>
        <p className="text-muted-foreground">
          Gagnez des tickets en utilisant l'app et remportez des prix !
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableTickets}</p>
                <p className="text-sm text-muted-foreground">Tickets disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-full">
                <Timer className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentDraws.length}</p>
                <p className="text-sm text-muted-foreground">Tirages actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-full">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myWins.length}</p>
                <p className="text-sm text-muted-foreground">Gains totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="draws" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="draws">Tirages</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
          <TabsTrigger value="wins">Mes Gains</TabsTrigger>
          <TabsTrigger value="how">Comment ça marche</TabsTrigger>
        </TabsList>

        <TabsContent value="draws" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDraws.map((draw) => (
              <LotteryDrawCard key={draw.id} draw={draw} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <LotteryTicketsList tickets={tickets} />
        </TabsContent>

        <TabsContent value="wins">
          <LotteryWinsList wins={myWins} />
        </TabsContent>

        <TabsContent value="how" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Comment gagner des tickets ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">🚗 Transport</h4>
                  <p className="text-sm text-muted-foreground">1 ticket par course terminée</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">📦 Livraison</h4>
                  <p className="text-sm text-muted-foreground">2 tickets par livraison réussie</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">🛒 Marketplace</h4>
                  <p className="text-sm text-muted-foreground">1 ticket par achat, 3 par vente</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">⭐ Évaluations</h4>
                  <p className="text-sm text-muted-foreground">1 ticket par évaluation 5 étoiles</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">👥 Parrainage</h4>
                  <p className="text-sm text-muted-foreground">5 tickets par utilisateur parrainé</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">📱 Connexion</h4>
                  <p className="text-sm text-muted-foreground">1 ticket bonus quotidien</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Types de tirages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Tirage Flash Quotidien</h4>
                    <p className="text-sm text-muted-foreground">Chaque jour à 20h</p>
                  </div>
                  <Badge variant="secondary">1 ticket min</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Super Kwenda Hebdomadaire</h4>
                    <p className="text-sm text-muted-foreground">Chaque dimanche</p>
                  </div>
                  <Badge variant="secondary">5 tickets min</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Méga Jackpot Mensuel</h4>
                    <p className="text-sm text-muted-foreground">Dernier dimanche du mois</p>
                  </div>
                  <Badge variant="secondary">10 tickets min</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};