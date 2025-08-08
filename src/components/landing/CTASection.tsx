import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Car, Users, Store, Package, Download, 
  ArrowRight, Smartphone, Star, Zap, Heart
} from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  const userTypes = [
    {
      icon: <Car className="w-8 h-8" />,
      title: "Pour les Clients",
      description: "Commandez vos courses, livraisons et découvrez notre marketplace",
      benefits: ["Transport immédiat", "Livraison express", "Achats sécurisés", "Tombola gratuite"],
      cta: "Commencer maintenant",
      gradient: "from-primary to-primary-glow",
      popular: true
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Pour les Chauffeurs",
      description: "Rejoignez notre réseau et augmentez vos revenus facilement",
      benefits: ["Revenus réguliers", "Flexibilité totale", "Support 24/7", "Formation gratuite"],
      cta: "Devenir chauffeur",
      gradient: "from-secondary to-accent"
    },
    {
      icon: <Store className="w-8 h-8" />,
      title: "Pour les Commerçants",
      description: "Vendez vos produits dans tout Kinshasa avec livraison intégrée",
      benefits: ["Audience élargie", "Livraison incluse", "Paiements sécurisés", "Commission faible"],
      cta: "Vendre en ligne",
      gradient: "from-accent to-primary"
    }
  ];

  const downloadOptions = [
    {
      platform: "Android",
      icon: "📱",
      available: true,
      note: "Disponible maintenant"
    },
    {
      platform: "iOS",
      icon: "📲", 
      available: false,
      note: "Bientôt disponible"
    },
    {
      platform: "Web App",
      icon: "🌐",
      available: true,
      note: "Accès direct"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Main CTA Header */}
        <div className="text-center mb-16 space-y-6">
          <Badge variant="outline" className="border-primary/30 text-primary text-lg px-6 py-2">
            🚀 Rejoignez l'aventure Kwenda !
          </Badge>
          <h2 className="text-display-lg bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Prêt à transformer votre
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              expérience à Kinshasa ?
            </span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Que vous soyez client, chauffeur ou commerçant, Kwenda Taxi a la solution parfaite pour vous. 
            Rejoignez dès aujourd'hui la communauté qui révolutionne Kinshasa !
          </p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {userTypes.map((userType, index) => (
            <Card 
              key={index}
              className={`relative group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                userType.popular ? 'border-primary/50 shadow-lg' : 'border-border/30'
              }`}
            >
              {userType.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg">
                    ⭐ Plus Populaire
                  </Badge>
                </div>
              )}

              <CardContent className="p-8 text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${userType.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {userType.icon}
                </div>

                <h3 className="text-heading-lg mb-4 group-hover:text-primary transition-colors">
                  {userType.title}
                </h3>
                
                <p className="text-body-md text-muted-foreground mb-6">
                  {userType.description}
                </p>

                <div className="space-y-3 mb-8">
                  {userType.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link to="/auth">
                  <Button 
                    className={`w-full group-hover:scale-105 transition-all duration-300 bg-gradient-to-r ${userType.gradient} hover:shadow-glow`}
                    size="lg"
                  >
                    {userType.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Download Section */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-heading-lg mb-4 flex items-center justify-center gap-3">
              <Download className="w-8 h-8 text-primary" />
              Téléchargez l'application Kwenda Taxi
            </h3>
            <p className="text-body-md text-muted-foreground max-w-2xl mx-auto">
              Accédez à tous nos services directement depuis votre smartphone. 
              Interface intuitive et optimisée pour les connexions congolaises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {downloadOptions.map((option, index) => (
              <Card key={index} className={`text-center ${option.available ? 'hover:shadow-lg transition-all duration-300' : 'opacity-60'}`}>
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{option.icon}</div>
                  <h4 className="text-heading-sm mb-2">{option.platform}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{option.note}</p>
                  <Button 
                    variant={option.available ? "default" : "outline"}
                    disabled={!option.available}
                    className="w-full"
                  >
                    {option.available ? "Télécharger" : "Bientôt"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ou utilisez directement notre application web
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow">
                <Smartphone className="w-5 h-5 mr-2" />
                Lancer l'application web
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-center items-center gap-4 mb-6">
                <Heart className="w-8 h-8 animate-pulse" />
                <h3 className="text-display-sm">Fait avec ❤️ au Congo</h3>
                <Heart className="w-8 h-8 animate-pulse" />
              </div>
              
              <p className="text-xl mb-8 leading-relaxed">
                Kwenda Taxi n'est pas juste une application, c'est un mouvement pour moderniser 
                le transport et le commerce à Kinshasa. Ensemble, construisons l'avenir de notre ville !
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4">
                    <Zap className="w-5 h-5 mr-2" />
                    Rejoindre maintenant
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                  <Star className="w-5 h-5 mr-2" />
                  En savoir plus
                </Button>
              </div>

              <div className="pt-8 border-t border-white/20">
                <p className="text-white/80 text-sm">
                  🇨🇩 Proudly made in Democratic Republic of Congo • Support local innovation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;