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
      
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[85vh]">
          {/* Content */}
          <div className="space-y-6 lg:space-y-8 animate-fade-in order-2 lg:order-1">
            {/* Brand Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4 lg:mb-6 text-center sm:text-left">
              <BrandLogo size={48} className="sm:w-14 sm:h-14" />
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-display-md bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Kwenda Taxi
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">🇨🇩 Made in Congo RDC</p>
              </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 text-primary">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <Badge variant="outline" className="border-primary/30 text-primary text-xs sm:text-sm px-2 sm:px-3">
                  #1 Transport App Kinshasa
                </Badge>
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-display-lg leading-tight text-center lg:text-left">
                L'Application <span className="text-primary">Tout-en-Un</span>
                <br />
                <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                  pour Kinshasa
                </span>
              </h2>
              
              <p className="text-sm sm:text-base lg:text-body-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                Transport VTC, Livraison Express, Location de Véhicules, Marketplace et Tombola - 
                Tout ce dont vous avez besoin dans une seule application conçue pour la RDC.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground justify-center lg:justify-start">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                <span className="truncate">Tout Kinshasa</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground justify-center lg:justify-start">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                <span className="truncate">Service 24h/24</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground justify-center lg:justify-start">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="truncate">KwendaPay</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground justify-center lg:justify-start">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                <span className="truncate">Communauté</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <Link to="/auth" className="w-full">
                <Button 
                  size="lg" 
                  className="w-full text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 group min-h-[48px]"
                >
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Commencer maintenant
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-primary/30 hover:bg-primary/5 group min-h-[48px]"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                Voir la démo
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-4 gap-4 pt-4 lg:pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-heading-md text-primary font-bold">5+</div>
                <div className="text-xs sm:text-caption text-muted-foreground">Services</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-heading-md text-secondary font-bold">24/7</div>
                <div className="text-xs sm:text-caption text-muted-foreground">Support</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-heading-md text-accent font-bold">100%</div>
                <div className="text-xs sm:text-caption text-muted-foreground">Sécurisé</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-heading-md text-primary font-bold">🇨🇩</div>
                <div className="text-xs sm:text-caption text-muted-foreground">Local</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-scale-in order-1 lg:order-2 max-w-md mx-auto lg:max-w-none">
            <div className="relative z-10">
              <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl transform hover:rotate-0 lg:rotate-2 transition-transform duration-500">
                <img 
                  src={heroImage} 
                  alt="Kwenda Taxi - Interface moderne de transport intelligent à Kinshasa"
                  className="w-full h-auto object-cover aspect-[4/3] lg:aspect-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-primary/20"></div>
              </div>
              
              {/* Floating Elements - Hidden on mobile */}
              <div className="hidden sm:block absolute -top-4 lg:-top-6 -right-4 lg:-right-6 bg-gradient-to-r from-secondary to-accent text-white px-3 py-2 lg:px-6 lg:py-3 rounded-full shadow-lg text-xs lg:text-sm font-semibold animate-bounce">
                🚀 Nouveau !
              </div>
              
              <div className="hidden sm:block absolute -bottom-4 lg:-bottom-6 -left-4 lg:-left-6 bg-gradient-to-r from-primary to-primary-glow text-white px-3 py-2 lg:px-6 lg:py-3 rounded-full shadow-lg text-xs lg:text-sm font-semibold">
                🎲 + Tombola gratuite
              </div>
            </div>
            
            {/* Decorative Background Elements - Smaller on mobile */}
            <div className="absolute -top-8 lg:-top-12 -left-8 lg:-left-12 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl lg:blur-2xl"></div>
            <div className="absolute -bottom-8 lg:-bottom-12 -right-8 lg:-right-12 w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-2xl lg:blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;