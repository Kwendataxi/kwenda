import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Package, Users, Clock, Zap, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { Link } from 'react-router-dom';

const Kolwezi = () => {
  const cityStats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "150+",
      label: "Chauffeurs actifs",
      description: "Service en développement"
    },
    {
      icon: <Car className="w-6 h-6" />,
      value: "250+",
      label: "Courses/jour",
      description: "Demande croissante"
    },
    {
      icon: <Package className="w-6 h-6" />,
      value: "100+",
      label: "Livraisons/jour",
      description: "Logistique cobalt"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "12min",
      label: "Temps d'attente moyen",
      description: "Ville compacte"
    }
  ];

  const services = [
    {
      name: "Taxi Privé VTC",
      description: "Transport premium pour la ville du cobalt",
      price: "Tarif: +10% vs Kinshasa",
      features: ["Véhicules climatisés", "Chauffeurs expérimentés", "Service 24h/24"],
      popular: true
    },
    {
      name: "Livraison Express",
      description: "Logistique pour l'industrie minière", 
      price: "Tarif: +10% vs Kinshasa",
      features: ["Documents techniques", "Échantillons", "Matériel urgent"],
      popular: true
    },
    {
      name: "Transport Collectif",
      description: "Liaisons principales de la ville",
      price: "À partir de 800 FC",
      features: ["Trajets fixes", "Économique", "Régulier"],
      popular: false
    }
  ];

  const popularRoutes = [
    { from: "Aéroport de Kolwezi", to: "Centre-ville", time: "15min", price: "5,000 FC" },
    { from: "Mines de Tenke", to: "Hôtel Impala", time: "20min", price: "6,500 FC" },
    { from: "Université de Kolwezi", to: "Marché Central", time: "10min", price: "3,000 FC" },
    { from: "Hôpital Général", to: "Quartier résidentiel", time: "8min", price: "2,500 FC" }
  ];

  const cityFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Ville du cobalt",
      description: "Centre mondial de production de cobalt et cuivre"
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Ville compacte",
      description: "Trajets courts, service rapide et efficace"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Population mixte",
      description: "Travailleurs locaux et expatriés miniers"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Logistique spécialisée",
      description: "Transport adapté aux besoins industriels"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              🇨🇩 Kolwezi - Ville du Cobalt
            </Badge>
            <h1 className="text-display-lg">
              Kwenda dessert <span className="text-blue-600">Kolwezi</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Transport et livraison dans la capitale mondiale du cobalt. 
              Des services adaptés à cette ville minière dynamique du Lualaba.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
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
            <h2 className="text-heading-xl">Kwenda Kolwezi en chiffres</h2>
            <p className="text-body-md text-muted-foreground">
              Notre présence dans la ville du cobalt
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cityStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto text-blue-600">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
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
            <h2 className="text-heading-xl">Services disponibles à Kolwezi</h2>
            <p className="text-body-md text-muted-foreground">
              Transport adapté à la capitale du cobalt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow relative">
                {service.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-500">
                    Populaire
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    {service.name}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg font-semibold text-blue-600">
                    {service.price}
                  </div>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
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
              Les destinations les plus demandées à Kolwezi
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {popularRoutes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-semibold">{route.from} → {route.to}</div>
                          <div className="text-sm text-muted-foreground">Temps estimé: {route.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">{route.price}</div>
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
            <h2 className="text-heading-xl">Kwenda s'adapte à Kolwezi</h2>
            <p className="text-body-md text-muted-foreground">
              Des services pensés pour la capitale du cobalt
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cityFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto text-blue-600">
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

      {/* Mining Industry Focus */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Focus industrie minière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🏭 Zones industrielles</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Mine de Tenke Fungurume</li>
                      <li>• KCC (Kamoto Copper Company)</li>
                      <li>• Mutanda Mining</li>
                      <li>• Zone industrielle centrale</li>
                      <li>• Installations portuaires</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">⚡ Services spécialisés</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Transport d'équipes minières</li>
                      <li>• Livraison de pièces détachées</li>
                      <li>• Documents techniques urgents</li>
                      <li>• Échantillons géologiques</li>
                      <li>• Matériel d'urgence 24h/24</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">💼 Clientèle ciblée</h4>
                  <p className="text-sm text-muted-foreground">
                    Kolwezi accueille de nombreux expatriés et travailleurs du secteur minier. 
                    Nos services sont adaptés aux standards internationaux tout en restant accessibles à la population locale.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Local Info */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Informations pratiques</h2>
            <p className="text-body-md text-muted-foreground">
              Ce qu'il faut savoir sur Kwenda Kolwezi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Zones de couverture
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Centre-ville et zones commerciales</li>
                  <li>• Quartiers résidentiels</li>
                  <li>• Zones industrielles minières</li>
                  <li>• Aéroport de Kolwezi</li>
                  <li>• Campus universitaire</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Horaires de service
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Transport: 24h/24, 7j/7</li>
                  <li>• Livraison: 6h00 - 22h00</li>
                  <li>• Support client: 24h/24</li>
                  <li>• Pics: 6h-8h et 17h-19h</li>
                  <li>• Service renforcé les weekends</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Types de véhicules
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Berlines climatisées</li>
                  <li>• SUV pour groupes</li>
                  <li>• Véhicules tout-terrain</li>
                  <li>• Motos pour livraisons urgentes</li>
                  <li>• Véhicules adaptés routes minières</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Future Plans */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-heading-xl mb-4">L'avenir de Kwenda à Kolwezi</h2>
              <p className="text-body-md text-muted-foreground">
                Nos projets de développement dans la capitale du cobalt
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">🚗</div>
                  <h3 className="font-semibold mb-2">Expansion de la flotte</h3>
                  <p className="text-sm text-muted-foreground">
                    Doubler le nombre de véhicules d'ici fin 2024
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">🏪</div>
                  <h3 className="font-semibold mb-2">Marketplace locale</h3>
                  <p className="text-sm text-muted-foreground">
                    E-commerce adapté aux besoins locaux
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-4">🤝</div>
                  <h3 className="font-semibold mb-2">Partenariats corporates</h3>
                  <p className="text-sm text-muted-foreground">
                    Contrats avec les entreprises minières
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Découvrez Kwenda Kolwezi</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez la révolution du transport dans la capitale mondiale du cobalt
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Télécharger l'app</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-500">
              <Link to="/support/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default Kolwezi;