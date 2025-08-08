import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, Clock, Car, ArrowRight, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-vtc.jpg";
import { BrandLogo } from "@/components/brand/BrandLogo";

const ModernHero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-lg animate-pulse delay-300"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-accent/10 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,hsl(var(--primary))_0%,transparent_50%)] opacity-5"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Brand Header */}
            <div className="flex items-center gap-4 mb-6">
              <BrandLogo size={56} />
              <div>
                <h1 className="text-display-md bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Kwenda Taxi
                </h1>
                <p className="text-muted-foreground text-lg">🇨🇩 Made in Congo RDC</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Star className="w-5 h-5 fill-current" />
                <Badge variant="outline" className="border-primary/30 text-primary">
                  #1 Transport App Kinshasa
                </Badge>
                <Star className="w-5 h-5 fill-current" />
              </div>
              
              <h2 className="text-display-lg leading-tight">
                L'Application <span className="text-primary">Tout-en-Un</span>
                <br />
                <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                  pour Kinshasa
                </span>
              </h2>
              
              <p className="text-body-lg text-muted-foreground leading-relaxed max-w-lg">
                Transport VTC, Livraison Express, Location de Véhicules, Marketplace et Tombola - 
                Tout ce dont vous avez besoin dans une seule application conçue pour la RDC.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Tout Kinshasa couvert</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-secondary" />
                <span>Service 24h/24</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-accent" />
                <span>Paiement KwendaPay</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span>Communauté active</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth" className="flex-1 sm:flex-none">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 group"
                >
                  <Car className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Commencer maintenant
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/5 group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Voir la démo
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="text-heading-md text-primary font-bold">5+</div>
                <div className="text-caption text-muted-foreground">Services</div>
              </div>
              <div className="text-center">
                <div className="text-heading-md text-secondary font-bold">24/7</div>
                <div className="text-caption text-muted-foreground">Support</div>
              </div>
              <div className="text-center">
                <div className="text-heading-md text-accent font-bold">100%</div>
                <div className="text-caption text-muted-foreground">Sécurisé</div>
              </div>
              <div className="text-center">
                <div className="text-heading-md text-primary font-bold">🇨🇩</div>
                <div className="text-caption text-muted-foreground">Local</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-scale-in">
            <div className="relative z-10">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src={heroImage} 
                  alt="Kwenda Taxi - Interface moderne de transport intelligent à Kinshasa"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-primary/20"></div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-secondary to-accent text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold animate-bounce">
                🚀 Nouveau !
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-primary to-primary-glow text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold">
                🎲 + Tombola gratuite
              </div>
            </div>
            
            {/* Decorative Background Elements */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;