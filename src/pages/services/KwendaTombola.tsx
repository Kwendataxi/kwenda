import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, Trophy, Coins, Clock, Users, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const KwendaTombola = () => {
  const prizes = [
    {
      rank: "1er Prix",
      reward: "500,000 FC",
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      probability: "1 chance sur 10,000"
    },
    {
      rank: "2ème Prix", 
      reward: "200,000 FC",
      icon: <Star className="w-8 h-8 text-gray-400" />,
      probability: "3 chances sur 10,000"
    },
    {
      rank: "3ème Prix",
      reward: "100,000 FC", 
      icon: <Gift className="w-8 h-8 text-orange-500" />,
      probability: "10 chances sur 10,000"
    },
    {
      rank: "Prix crédits",
      reward: "10,000 FC",
      icon: <Coins className="w-8 h-8 text-green-500" />,
      probability: "100 chances sur 10,000"
    }
  ];

  const howToEarn = [
    {
      action: "Commande transport",
      tickets: "1 ticket",
      description: "Pour chaque course effectuée"
    },
    {
      action: "Livraison commandée",
      tickets: "1 ticket", 
      description: "Pour chaque colis envoyé"
    },
    {
      action: "Achat marketplace",
      tickets: "2 tickets",
      description: "Pour chaque achat en ligne"
    },
    {
      action: "Parrainage réussi",
      tickets: "5 tickets",
      description: "Quand votre filleul fait sa première commande"
    }
  ];

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Tirages quotidiens",
      description: "Tentez votre chance chaque jour à 20h"
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Tickets gratuits",
      description: "Gagnez des tickets en utilisant l'app"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Programme parrainage",
      description: "Plus de tickets en parrainant des amis"
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Gains instantanés",
      description: "Vos gains ajoutés directement au portefeuille"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Kwenda Tombola 🎲
            </Badge>
            <h1 className="text-display-lg">
              Gagnez jusqu'à <span className="text-yellow-600">500,000 FC</span> chaque jour !
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Utilisez Kwenda et participez automatiquement à notre tombola quotidienne. 
              Plus vous utilisez l'app, plus vous avez de chances de gagner !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Link to="/auth">Participer maintenant</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#how-it-works">Comment ça marche ?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Lots à gagner chaque jour</h2>
            <p className="text-body-md text-muted-foreground">
              Des prix en francs congolais crédités directement dans votre portefeuille
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {prizes.map((prize, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    {prize.icon}
                  </div>
                  <CardTitle className="text-lg">{prize.rank}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-primary">
                    {prize.reward}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{prize.probability}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Earn Tickets */}
      <section id="how-it-works" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment gagner des tickets ?</h2>
            <p className="text-body-md text-muted-foreground">
              Chaque action sur Kwenda vous fait gagner des tickets de tombola
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howToEarn.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <h3 className="font-semibold">{item.action}</h3>
                  <div className="text-lg font-bold text-yellow-600">{item.tickets}</div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment fonctionne la tombola ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un système équitable et transparent
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto text-yellow-600">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Règlement de la tombola</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🎯 Participation</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Gratuit, aucun achat requis</li>
                      <li>• Ouvert aux utilisateurs de 18+ ans</li>
                      <li>• Résidents de RDC uniquement</li>
                      <li>• Compte Kwenda actif requis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">🏆 Tirages</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Tirage quotidien à 20h GMT+1</li>
                      <li>• Algorithme certifié équitable</li>
                      <li>• Résultats publiés instantanément</li>
                      <li>• Gains crédités automatiquement</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Jeu de hasard. Jouer comporte des risques. Kwenda promeut le jeu responsable.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Winners Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Nos derniers gagnants 🎉</h2>
            <p className="text-body-md text-muted-foreground">
              Félicitations à nos heureux gagnants !
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { name: "Marie K.", prize: "500,000 FC", date: "Hier", city: "Kinshasa" },
              { name: "Jean-Paul M.", prize: "200,000 FC", date: "Il y a 2 jours", city: "Lubumbashi" },
              { name: "Grace L.", prize: "100,000 FC", date: "Il y a 3 jours", city: "Kolwezi" },
              { name: "Patrick N.", prize: "500,000 FC", date: "Il y a 1 semaine", city: "Kinshasa" }
            ].map((winner, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{winner.name}</p>
                        <p className="text-sm text-muted-foreground">{winner.city} • {winner.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{winner.prize}</p>
                      <p className="text-xs text-muted-foreground">Gagné</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à tenter votre chance ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Commencez à utiliser Kwenda dès aujourd'hui et participez automatiquement à la tombola !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Télécharger l'app</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orange-500">
              <Link to="/support/contact">Questions ?</Link>
            </Button>
          </div>
        </div>
      </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default KwendaTombola;