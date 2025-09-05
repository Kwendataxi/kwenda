import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Package, Users, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { Link } from 'react-router-dom';

const Lubumbashi = () => {
  const cityStats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "300+",
      label: "Chauffeurs actifs",
      description: "Réseau en croissance"
    },
    {
      icon: <Car className="w-6 h-6" />,
      value: "500+",
      label: "Courses/jour",
      description: "Service en expansion"
    },
    {
      icon: <Package className="w-6 h-6" />,
      value: "200+",
      label: "Livraisons/jour",
      description: "Logistique minière"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "15min",
      label: "Temps d'attente moyen",
      description: "Service rapide"
    }
  ];

  const services = [
    {
      name: "Taxi Privé",
      description: "Service premium pour la ville minière",
      price: "Tarif: +20% vs Kinshasa",
      features: ["Confort adapté", "Routes minières", "Véhicules robustes"],
      popular: true
    },
    {
      name: "Bus Urbain",
      description: "Transport collectif économique", 
      price: "À partir de 600 FC",
      features: ["Liaisons principales", "Économique", "Fréquences régulières"],
      popular: false
    },
    {
      name: "Livraison Express",
      description: "Logistique pour le secteur minier",
      price: "Tarif: +20% vs Kinshasa", 
      features: ["Documents urgents", "Pièces détachées", "Matériel technique"],
      popular: true
    }
  ];

  const popularRoutes = [
    { from: "Aéroport Luano", to: "Centre-ville", time: "25min", price: "8,000 FC" },
    { from: "Université de Lubumbashi", to: "Quartier Kenya", time: "15min", price: "4,500 FC" },
    { from: "Gare ferroviaire", to: "Quartier Golf", time: "20min", price: "6,000 FC" },
    { from: "Hôpital Sendwe", to: "Marché Central", time: "12min", price: "3,500 FC" }
  ];

  const cityFeatures = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Économie minière",
      description: "Tarifs adaptés aux revenus locaux (+20% par rapport à Kinshasa)"
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Véhicules robustes",
      description: "Flotte adaptée aux conditions routières spécifiques"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Service 24h/24",
      description: "Disponible pour les travailleurs en équipes"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Logistique minière",
      description: "Livraison spécialisée pour le secteur industriel"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/10 to-red-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              🇨🇩 Lubumbashi - Capitale Minière
            </Badge>
            <h1 className="text-display-lg">
              Kwenda arrive à <span className="text-orange-600">Lubumbashi</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Transport et livraison dans la capitale minière du Katanga. 
              Des services adaptés à l'économie locale et aux besoins spécifiques de Lubumbashi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Link to="/auth">Commander maintenant</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth">Devenir chauffeur</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* City Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Kwenda Lubumbashi en chiffres</h2>
            <p className="text-body-md text-muted-foreground">
              Une présence grandissante dans la capitale du Katanga
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cityStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto text-orange-600">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">{stat.value}</div>
                    <div className="font-semibold">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Services disponibles à Lubumbashi</h2>
            <p className="text-body-md text-muted-foreground">
              Transport et livraison adaptés à la ville minière
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow relative">
                {service.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-orange-500">
                    Populaire
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-orange-600" />
                    {service.name}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg font-semibold text-orange-600">
                    {service.price}
                  </div>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Commander <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Trajets populaires</h2>
            <p className="text-body-md text-muted-foreground">
              Les destinations les plus demandées à Lubumbashi
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {popularRoutes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="font-semibold">{route.from} → {route.to}</div>
                          <div className="text-sm text-muted-foreground">Temps estimé: {route.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-600">{route.price}</div>
                        <Button size="sm" asChild>
                          <Link to="/auth">Commander</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* City Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Kwenda s'adapte à Lubumbashi</h2>
            <p className="text-body-md text-muted-foreground">
              Des services pensés pour la capitale minière
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cityFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto text-orange-600">
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

      {/* Local Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-orange-600" />
                  Informations locales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🏢 Zones de service</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Centre-ville et zones commerciales</li>
                      <li>• Quartiers résidentiels (Kenya, Golf, Upemba)</li>
                      <li>• Zone universitaire</li>
                      <li>• Aéroport international Luano</li>
                      <li>• Zones industrielles minières</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">⏰ Horaires adaptés</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Service 24h/24 pour les équipes minières</li>
                      <li>• Pics de demande: 6h-8h et 17h-19h</li>
                      <li>• Tarifs préférentiels en heures creuses</li>
                      <li>• Service renforcé les weekends</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">💰 Tarification Lubumbashi</h4>
                  <p className="text-sm text-muted-foreground">
                    Les tarifs sont adaptés à l'économie locale avec une majoration de 20% par rapport à Kinshasa, 
                    reflétant les coûts d'exploitation et le pouvoir d'achat de la région minière.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Expansion Plans */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-heading-xl mb-4">L'avenir de Kwenda à Lubumbashi</h2>
              <p className="text-body-md text-muted-foreground">
                Nos projets de développement dans la capitale du Katanga
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">📈</div>
                  <h3 className="font-semibold mb-2">Expansion de la flotte</h3>
                  <p className="text-sm text-muted-foreground">
                    500 nouveaux chauffeurs d'ici 2025
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">🏭</div>
                  <h3 className="font-semibold mb-2">Partenariats miniers</h3>
                  <p className="text-sm text-muted-foreground">
                    Transport d'entreprise pour les sociétés minières
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="font-semibold mb-2">Nouveaux services</h3>
                  <p className="text-sm text-muted-foreground">
                    Marketplace et tombola bientôt disponibles
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Découvrez Kwenda Lubumbashi</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez la révolution du transport dans la capitale minière du Katanga
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Télécharger l'app</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orange-500">
              <Link to="/support/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default Lubumbashi;