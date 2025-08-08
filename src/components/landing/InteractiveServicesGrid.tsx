import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Package, Store, Truck, Dice1, 
  CheckCircle, ArrowRight, Zap, Clock,
  Shield, Users, MapPin, CreditCard,
  Bike, Bus
} from "lucide-react";
import { useState } from "react";

const InteractiveServicesGrid = () => {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const services = [
    {
      id: "transport",
      icon: <Car className="w-10 h-10" />,
      title: "Transport VTC",
      description: "Déplacements rapides et confortables dans tout Kinshasa",
      price: "À partir de 500 CDF",
      popular: true,
      gradient: "from-primary to-primary-glow",
      features: [
        { icon: <Bike className="w-4 h-4" />, text: "Moto-taxi - Rapide & économique" },
        { icon: <Car className="w-4 h-4" />, text: "Taxi voiture - Confort 4 places" },
        { icon: <Users className="w-4 h-4" />, text: "Taxi-bus - Transport collectif" },
        { icon: <Bus className="w-4 h-4" />, text: "Bus Transco - Service public" }
      ],
      stats: { rides: "10K+", rating: "4.9", drivers: "500+" }
    },
    {
      id: "delivery",
      icon: <Package className="w-10 h-10" />,
      title: "Livraison Express",
      description: "Livraison de colis et documents en temps record",
      price: "À partir de 300 CDF",
      gradient: "from-secondary to-accent",
      features: [
        { icon: <Zap className="w-4 h-4" />, text: "Livraison Flash - En moto" },
        { icon: <Truck className="w-4 h-4" />, text: "Livraison Cargo - En camion" },
        { icon: <Users className="w-4 h-4" />, text: "Assistant de chargement" },
        { icon: <MapPin className="w-4 h-4" />, text: "Suivi temps réel GPS" }
      ],
      stats: { deliveries: "5K+", time: "30min", coverage: "100%" }
    },
    {
      id: "rental",
      icon: <Truck className="w-10 h-10" />,
      title: "Location Véhicules",
      description: "Louez des véhicules pour toutes vos occasions",
      price: "À partir de 25K CDF/jour",
      gradient: "from-accent to-secondary",
      features: [
        { icon: <Car className="w-4 h-4" />, text: "Voitures particulières" },
        { icon: <Truck className="w-4 h-4" />, text: "Véhicules utilitaires" },
        { icon: <Clock className="w-4 h-4" />, text: "Location courte/longue durée" },
        { icon: <Shield className="w-4 h-4" />, text: "Véhicules vérifiés & assurés" }
      ],
      stats: { vehicles: "200+", brands: "15+", locations: "24/7" }
    },
    {
      id: "marketplace",
      icon: <Store className="w-10 h-10" />,
      title: "Marketplace Kwenda",
      description: "Achetez et vendez en toute sécurité avec livraison intégrée",
      price: "Commission 3%",
      gradient: "from-primary via-accent to-secondary",
      features: [
        { icon: <Store className="w-4 h-4" />, text: "Électronique & High-tech" },
        { icon: <Users className="w-4 h-4" />, text: "Mode & Vêtements" },
        { icon: <Package className="w-4 h-4" />, text: "Maison & Jardin" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Paiement sécurisé KwendaPay" }
      ],
      stats: { products: "1K+", sellers: "200+", categories: "10+" }
    },
    {
      id: "lottery",
      icon: <Dice1 className="w-10 h-10" />,
      title: "Kwenda Tombola",
      description: "Gagnez de l'argent réel à chaque course effectuée",
      price: "Gratuit avec chaque course",
      hot: true,
      gradient: "from-accent via-primary to-secondary",
      features: [
        { icon: <Dice1 className="w-4 h-4" />, text: "Tickets gratuits à chaque course" },
        { icon: <Clock className="w-4 h-4" />, text: "Tirages réguliers automatiques" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Gains en argent réel CDF" },
        { icon: <Users className="w-4 h-4" />, text: "Système de récompenses" }
      ],
      stats: { winners: "100+", prizes: "50M CDF", draws: "Weekly" }
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            🚀 Cinq Services Révolutionnaires
          </Badge>
          <h2 className="text-display-md bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Kwenda Taxi combine transport, livraison, location, marketplace et divertissement 
            dans une seule application intelligente adaptée aux réalités de Kinshasa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={service.id}
              className={`relative group hover:shadow-xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 ${
                index === 2 ? 'lg:col-span-3 lg:max-w-md lg:mx-auto' : ''
              } ${
                hoveredService === service.id ? 'scale-105 shadow-glow' : ''
              }`}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {/* Service Badge */}
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg">
                    ⭐ Plus Populaire
                  </Badge>
                </div>
              )}
              
              {service.hot && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-accent to-secondary text-white shadow-lg animate-pulse">
                    🔥 Nouveau !
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 bg-gradient-to-br ${service.gradient} rounded-2xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {service.icon}
                  </div>
                  {hoveredService === service.id && (
                    <ArrowRight className="w-6 h-6 text-primary animate-bounce" />
                  )}
                </div>
                
                <CardTitle className="text-heading-lg group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-body-md">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-heading-md font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {service.price}
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className="flex items-center gap-3 text-sm group-hover:text-foreground transition-colors"
                    >
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                  {Object.entries(service.stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-sm font-bold text-primary">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full group-hover:scale-105 transition-all duration-300 bg-gradient-to-r ${service.gradient} hover:shadow-glow`}
                >
                  {service.id === 'lottery' ? 'Découvrir' : 'Réserver maintenant'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-heading-lg mb-4">
              Prêt à découvrir l'expérience Kwenda ?
            </h3>
            <p className="text-body-md text-muted-foreground mb-6 max-w-2xl mx-auto">
              Téléchargez l'app et profitez de tous nos services en quelques clics !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow">
                <Car className="w-5 h-5 mr-2" />
                Commander maintenant
              </Button>
              <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
                <Users className="w-5 h-5 mr-2" />
                Devenir partenaire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveServicesGrid;