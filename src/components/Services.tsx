import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Bike, Truck, Crown, Users, Clock } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: <Car className="w-8 h-8" />,
      title: "VTC Standard",
      description: "Véhicules confortables et écologiques pour vos déplacements quotidiens.",
      price: "À partir de 500 FCFA",
      features: ["Véhicules récents", "Climatisation", "Chauffeur professionnel"],
      color: "border-primary/20 hover:border-primary/40"
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "VTC Luxe",
      description: "Limousines et véhicules haut de gamme pour vos événements spéciaux.",
      price: "À partir de 2000 FCFA",
      features: ["Véhicules de luxe", "Service premium", "Conciergerie"],
      color: "border-accent/20 hover:border-accent/40",
      popular: true
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Trajets Partagés",
      description: "Économisez en partageant votre trajet avec d'autres passagers.",
      price: "À partir de 300 FCFA",
      features: ["Tarifs réduits", "Écologique", "Réservation flexible"],
      color: "border-secondary/20 hover:border-secondary/40"
    },
    {
      icon: <Bike className="w-8 h-8" />,
      title: "Livraison Moto",
      description: "Service de livraison rapide en moto pour vos colis et documents.",
      price: "À partir de 1000 FCFA",
      features: ["Livraison express", "Suivi en temps réel", "Sécurisé"],
      color: "border-primary/20 hover:border-primary/40"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Véhicules Utilitaires",
      description: "Transport de marchandises et déménagements avec nos utilitaires.",
      price: "À partir de 5000 FCFA",
      features: ["Véhicules spacieux", "Aide au chargement", "Assurance"],
      color: "border-secondary/20 hover:border-secondary/40"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Réservation Avancée",
      description: "Planifiez vos trajets à l'avance pour vos rendez-vous importants.",
      price: "Sans supplément",
      features: ["Garantie horaire", "Confirmation SMS", "Priorité"],
      color: "border-accent/20 hover:border-accent/40"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Nos <span className="text-primary">Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une gamme complète de services de transport adaptés à tous vos besoins en Côte d'Ivoire.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-elegant transition-all duration-300 ${service.color} hover:-translate-y-1`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ Populaire
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg text-primary group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </div>
                <p className="text-muted-foreground">{service.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-primary">{service.price}</div>
                
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full group-hover:scale-105 transition-transform" 
                  variant={service.popular ? "hero" : "outline"}
                >
                  Réserver maintenant
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-muted/50 to-background border rounded-3xl p-12">
            <h3 className="text-3xl font-bold mb-4">
              Prêt à transformer votre expérience de transport ?
            </h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui font confiance à NTA TECH VTC pour leurs déplacements quotidiens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                Télécharger l'App
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Devenir Chauffeur Partenaire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;