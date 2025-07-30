import { Card, CardContent } from "@/components/ui/card";
import { Shield, Smartphone, Car, Users, CreditCard, Star } from "lucide-react";
import ecoCarIcon from "@/assets/eco-car-icon.png";
import appIcon from "@/assets/app-icon.png";
import driverIcon from "@/assets/driver-icon.png";

const Features = () => {
  const features = [
    {
      icon: <img src={ecoCarIcon} alt="Véhicules éco" className="w-12 h-12" />,
      title: "Flotte Écologique",
      description: "1000 véhicules de luxe respectueux de l'environnement pour un transport propre et confortable.",
      color: "text-secondary"
    },
    {
      icon: <img src={appIcon} alt="Application mobile" className="w-12 h-12" />,
      title: "Géolocalisation Intelligente",
      description: "Système de géolocalisation en temps réel pour une arrivée rapide et un suivi précis de votre trajet.",
      color: "text-primary"
    },
    {
      icon: <img src={driverIcon} alt="Chauffeurs professionnels" className="w-12 h-12" />,
      title: "Chauffeurs Certifiés",
      description: "Conducteurs professionnels formés et vérifiés pour votre sécurité et votre confort.",
      color: "text-accent"
    },
    {
      icon: <CreditCard className="w-12 h-12" />,
      title: "Paiements Flexibles",
      description: "Mobile Money, cartes bancaires, espèces - tous les moyens de paiement acceptés.",
      color: "text-primary"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Trajets Partagés",
      description: "Options de covoiturage et trajets groupés pour économiser et réduire l'impact environnemental.",
      color: "text-secondary"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Sécurité Maximale",
      description: "Assurance complète, suivi GPS, système de notation pour votre tranquillité d'esprit.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Pourquoi choisir{" "}
            <span className="text-primary">NTA TECH VTC</span> ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une expérience de transport révolutionnaire adaptée aux besoins du marché ivoirien.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/50 backdrop-blur-sm hover:-translate-y-2"
            >
              <CardContent className="p-8 text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-background to-muted mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-primary rounded-3xl p-8 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">1000+</div>
              <div className="text-white/80">Véhicules Disponibles</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Support Client</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-white/80">Véhicules Écologiques</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2 Villes</div>
              <div className="text-white/80">Abidjan & Bouaké</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;