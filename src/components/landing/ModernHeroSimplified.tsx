import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ArrowRight, MapPin, Clock, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useEffect } from "react";
import { HeroCampaignSlider } from "./HeroCampaignSlider";
import { motion } from "framer-motion";

const ModernHeroSimplified = () => {
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!roleLoading && user && primaryRole) {
      switch (primaryRole) {
        case 'client':
          navigate("/app/client");
          break;
        case 'driver':
          navigate("/app/chauffeur");
          break;
        case 'partner':
          navigate("/app/partenaire");
          break;
        case 'admin':
          navigate("/app/admin");
          break;
      }
    }
  }, [user, primaryRole, roleLoading, navigate]);

  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-accent/4 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="container-section py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
          {/* Content */}
          <div className="space-y-8 animate-fade-up text-center lg:text-left">
            {/* Brand Header */}
            <div className="flex flex-col items-center lg:items-start gap-4 stagger-1">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <BrandLogo size="lg" animated withGlow />
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-display-md lg:text-display-lg bg-gradient-to-r from-foreground via-primary to-congo-red bg-clip-text text-transparent animate-gradient">
                  Kwenda Taxi
                </h1>
                
                <p className="text-heading-lg font-bold text-primary tracking-tight">
                  Courses abordables tous les jours !
                </p>
              </div>
            </div>

            {/* Main Value Proposition */}
            <div className="space-y-4">
              <h2 className="text-display-sm lg:text-display-lg leading-tight stagger-2">
                Transport, Food et plus à Kinshasa, Lubumbashi et Kolwezi
              </h2>
              
              <p className="text-body-lg text-muted-foreground leading-relaxed stagger-3">
                Commandez votre transport en un clic, faites-vous livrer vos repas préférés et bien plus encore.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start stagger-4">
              <Link to="/app/auth">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary via-primary-glow to-primary hover:shadow-glow min-h-[56px] text-body-lg rounded-xl px-8 gap-2">
                  Commander maintenant
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              
              <Link to="/restaurant/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-orange-500/30 hover:bg-orange-500/5 hover:border-orange-500/50 min-h-[56px] text-body-lg rounded-xl px-8 gap-2 group">
                  <UtensilsCrossed className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Devenir Restaurant
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Quick Stats - Simplified */}
            <div className="grid grid-cols-3 gap-4 pt-6 stagger-5">
              <div className="text-center lg:text-left">
                <div className="text-heading-lg text-primary mb-1">3</div>
                <div className="text-caption text-muted-foreground">Villes</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-heading-lg text-primary mb-1">24/7</div>
                <div className="text-caption text-muted-foreground">Disponible</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-heading-lg text-primary mb-1">4.9</div>
                <div className="text-caption text-muted-foreground">Note</div>
              </div>
            </div>
          </div>

          {/* Campaign Slider */}
          <div className="relative animate-scale-fade flex items-center justify-center">
            <HeroCampaignSlider />
            
            {/* Decorative Background */}
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-red-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHeroSimplified;
