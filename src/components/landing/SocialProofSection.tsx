import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, MapPin, Shield, CreditCard, Gavel, Headphones, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

const SocialProofSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Marie K.",
      role: "Cliente régulière",
      city: "Kinshasa",
      text: "Avec le système d'enchères, je choisis le chauffeur qui me propose le meilleur tarif. Service transparent et fiable!",
      rating: 5
    },
    {
      name: "Jean-Paul M.",
      role: "Restaurant partenaire",
      city: "Lubumbashi",
      text: "Kwenda Food a boosté nos ventes de 40%. Le portefeuille KwendaPay facilite les paiements.",
      rating: 5
    },
    {
      name: "Sarah L.",
      role: "Entreprise",
      city: "Kolwezi",
      text: "La livraison express est parfaite. Le support 24/7 répond toujours rapidement à nos besoins.",
      rating: 5
    },
    {
      name: "Oumar D.",
      role: "Chauffeur partenaire",
      city: "Abidjan",
      text: "Je propose mes tarifs et gagne plus grâce aux défis quotidiens. Kwenda valorise les chauffeurs!",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Gavel className="w-6 h-6" />,
      title: "Bidding Transparent",
      description: "Les chauffeurs proposent leur tarif, vous choisissez",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "KwendaPay Wallet",
      description: "Mobile Money + portefeuille intégré sécurisé",
      gradient: "from-secondary to-accent"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Support 24/7",
      description: "Assistance disponible à tout moment par chat",
      gradient: "from-accent to-primary"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container-section space-y-16">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
          <div className="text-center space-y-2">
            <div className="text-display-sm text-primary font-bold">12K+</div>
            <div className="text-body-sm text-muted-foreground">Utilisateurs</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-display-sm text-primary font-bold flex items-center justify-center gap-1">
              4.8 <Star className="w-6 h-6 fill-current text-yellow-500" />
            </div>
            <div className="text-body-sm text-muted-foreground">Note moyenne</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-display-sm text-primary font-bold">4</div>
            <div className="text-body-sm text-muted-foreground">Villes actives</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-display-sm text-primary font-bold">500+</div>
            <div className="text-body-sm text-muted-foreground">Chauffeurs</div>
          </div>
        </div>

        {/* Témoignage vedette */}
        <Card className="relative overflow-hidden glass border-primary/20">
          <CardContent className="p-8 lg:p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <Badge className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2">
                ⭐ Témoignage client
              </Badge>
              
              <div className="flex gap-1">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-current text-yellow-500" />
                ))}
              </div>

              <p className="text-body-lg lg:text-heading-sm text-foreground max-w-2xl leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </p>

              <div className="space-y-1">
                <div className="font-semibold text-heading-sm">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].city}
                </div>
              </div>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'w-8 bg-primary' 
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features clés */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`group hover:shadow-glow transition-all duration-500 glass border-transparent hover:border-primary/20 stagger-${index + 1}`}
            >
              <CardContent className="p-6 space-y-4">
                <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-xl text-white w-fit group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-heading-sm font-semibold">{feature.title}</h3>
                  <p className="text-body-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
