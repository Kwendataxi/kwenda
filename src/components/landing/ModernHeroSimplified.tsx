import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ArrowRight, MapPin, Clock, Zap, Car, Store } from "lucide-react";
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
      
      <div className="container-section py-8 lg:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
          {/* Content */}
          <div className="space-y-6 animate-fade-up text-center lg:text-left">
            {/* Brand Header - Simplifié */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center lg:items-start gap-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <BrandLogo size="lg" animated withGlow />
              </motion.div>
              
              {/* H1 Principal - Slogan uniquement */}
              <h1 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary via-congo-red to-primary bg-clip-text text-transparent">
                  Courses abordables
                </span>
                {" "}tous les jours !
              </h1>
            </motion.div>

            {/* Description condensée */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Transport, livraison et marketplace à Kinshasa, Lubumbashi et Kolwezi. Commandez en un clic.
            </motion.p>

            {/* CTAs en Cards Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0 pt-2"
            >
              {/* Card Transport */}
              <Link to="/app/auth">
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300 group"
                >
                  <div className="relative z-10 space-y-3">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Car className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white">Transport VTC</h3>
                    <p className="text-sm text-white/90">Réservez votre course</p>
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              </Link>

              {/* Card Food */}
              <Link to="/food">
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden bg-gradient-to-br from-orange-500/90 to-amber-500/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] transition-all duration-300 group"
                >
                  <div className="relative z-10 space-y-3">
                    <motion.div
                      whileHover={{ rotate: -5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <UtensilsCrossed className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white">Livraison repas</h3>
                    <p className="text-sm text-white/90">Commandez à manger</p>
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Lien secondaire Restaurant */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-2"
            >
              <Link to="/restaurant/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Store className="w-4 h-4" />
                <span>Vous êtes restaurateur ?</span>
                <span className="underline underline-offset-4 group-hover:text-primary">Rejoignez-nous</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Stats modernes avec icônes */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 flex-wrap justify-center lg:justify-start pt-4 border-t border-border/50"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                className="flex items-center gap-2 text-sm"
              >
                <MapPin className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium">3 villes</span>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.1 }} 
                className="flex items-center gap-2 text-sm"
              >
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Service 24/7</span>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.1 }} 
                className="flex items-center gap-2 text-sm"
              >
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-medium">Note 4.9★</span>
              </motion.div>
            </motion.div>
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
