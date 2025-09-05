import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, Clock, Car, ArrowRight, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-vtc.jpg";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const ModernHero = () => {
  const {user} = useAuth();
  useEffect(()=>{
    if(user && user.user_metadata){
      if(user.user_metadata.role === "simple_user_client"){
        window.location.href = "/client";
      }else if(user.user_metadata.role === "chauffeur"){
         window.location.href = "/chauffeur";
      }
    }
  },[user])

  return (
    <section className="relative min-h-screen bg-gradient-congo-vibrant overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-congo-red/30 rounded-full blur-xl animate-congo-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-congo-yellow/40 rounded-full blur-lg animate-congo-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-congo-green/25 rounded-full blur-2xl animate-congo-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-congo-blue/20 rounded-full blur-lg animate-congo-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,hsl(var(--congo-red))_0%,transparent_50%)] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--congo-yellow))_0%,transparent_40%)] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-congo-glow opacity-40"></div>
      </div>
      
      <div className="container-section py-8 sm:py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[85vh]">
          {/* Content */}
          <div className="space-y-fluid animate-fade-up order-2 lg:order-1">
            {/* Brand Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left stagger-1">
              <div className="interactive-scale">
                <BrandLogo size={56} className="sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
              </div>
              <div className="space-y-2">
                <h1 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent animate-gradient">
                  Kwenda Taxi
                </h1>
                <p className="text-muted-foreground text-body-md">🇨🇩 Made in Congo RDC</p>
              </div>
            </div>

            <div className="space-y-fluid">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 text-primary stagger-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse" />
                <Badge variant="outline" className="border-primary/30 text-primary text-sm px-4 py-2 bg-primary/5 animate-glow-pulse">
                  #1 Transport App Kinshasa
                </Badge>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse" style={{animationDelay: '0.5s'}} />
              </div>
              
              <h2 className="text-display-lg leading-tight text-center lg:text-left stagger-3">
                L'Application <span className="text-primary animate-gradient bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">Tout-en-Un</span>
                <br />
                <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  pour le Congo RDC
                </span>
              </h2>
              
              <p className="text-body-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 text-center lg:text-left stagger-4">
                Transport VTC, Livraison Express, Location de Véhicules, Marketplace et Tombola - 
                Disponible à Kinshasa, Lubumbashi et Kolwezi. Une seule application pour tout le Congo RDC.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-5">
              <div className="glass rounded-xl p-4 text-center group hover:bg-primary/5 transition-all duration-300 interactive-scale">
                <MapPin className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">3 Villes</div>
                <div className="text-caption text-muted-foreground">Kinshasa • Lubumbashi • Kolwezi</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-secondary/5 transition-all duration-300 interactive-scale">
                <Clock className="w-6 h-6 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">24h/24</div>
                <div className="text-caption text-muted-foreground">Service continu</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-accent/5 transition-all duration-300 interactive-scale">
                <Zap className="w-6 h-6 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">KwendaPay</div>
                <div className="text-caption text-muted-foreground">Paiements</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-primary/5 transition-all duration-300 interactive-scale">
                <Users className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">Communauté</div>
                <div className="text-caption text-muted-foreground">Active</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
              <Link to="/auth" className="flex-1">
                <Button 
                  size="lg" 
                  className="w-full text-body-lg px-8 py-6 bg-congo-red hover:bg-congo-red/90 text-white hover:shadow-congo transition-all duration-500 group min-h-[56px] rounded-xl animate-congo-pulse border-2 border-congo-yellow/30"
                >
                  <Car className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Commencer maintenant
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo" className="flex-1 sm:flex-initial">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full text-body-lg px-8 py-6 border-congo-yellow border-2 hover:bg-congo-yellow/20 text-congo-yellow group min-h-[56px] rounded-xl backdrop-blur-sm bg-white/10"
                >
                  <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-border/30">
              <div className="text-center group">
                <div className="text-heading-lg text-primary font-bold group-hover:scale-110 transition-transform">5+</div>
                <div className="text-caption text-muted-foreground">Services Intégrés</div>
              </div>
              <div className="text-center group">
                <div className="text-heading-lg text-secondary font-bold group-hover:scale-110 transition-transform">24/7</div>
                <div className="text-caption text-muted-foreground">Support Client</div>
              </div>
              <div className="text-center group">
                <div className="text-heading-lg text-accent font-bold group-hover:scale-110 transition-transform">100%</div>
                <div className="text-caption text-muted-foreground">Sécurisé</div>
              </div>
              <div className="text-center group">
                <div className="text-heading-lg text-primary font-bold group-hover:scale-110 transition-transform animate-float">🇨🇩</div>
                <div className="text-caption text-muted-foreground">Made in Congo</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-scale-fade order-1 lg:order-2 max-w-lg mx-auto lg:max-w-none">
            <div className="relative z-10 group">
              <div className="relative overflow-hidden rounded-3xl shadow-elegant transform hover:rotate-0 lg:rotate-1 transition-all duration-700 hover:shadow-glow interactive-scale">
                <img 
                  src={heroImage} 
                  alt="Kwenda Taxi - Interface moderne de transport intelligent à Kinshasa"
                  className="w-full h-auto object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-primary/20 group-hover:from-black/20 transition-all duration-500"></div>
                
                {/* Interactive overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-500"></div>
              </div>
              
              {/* Enhanced Floating Elements */}
              <div className="hidden sm:block absolute -top-6 -right-6 bg-gradient-to-r from-secondary to-accent text-white px-6 py-3 rounded-full shadow-glow text-sm font-semibold animate-float glass border border-white/20">
                🚀 Nouveau !
              </div>
              
              <div className="hidden sm:block absolute -bottom-6 -left-6 bg-gradient-to-r from-primary to-primary-glow text-white px-6 py-3 rounded-full shadow-glow text-sm font-semibold animate-float glass border border-white/20" style={{animationDelay: '1s'}}>
                🎲 + Tombola gratuite
              </div>
              
              {/* Side floating element */}
              <div className="hidden lg:block absolute top-1/2 -left-12 transform -translate-y-1/2 bg-gradient-to-r from-accent to-secondary text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold animate-pulse">
                💫 5 Services
              </div>
            </div>
            
            {/* Enhanced Decorative Background Elements */}
            <div className="absolute -top-12 -left-12 w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl animate-float"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 lg:w-48 lg:h-48 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 -right-8 w-24 h-24 bg-gradient-to-br from-secondary/15 to-accent/15 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;