import { UtensilsCrossed, Car } from "lucide-react";
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
    <section className="relative min-h-[75vh] bg-background overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-accent/4 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="container-section py-8 lg:py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content Ultra-Épuré */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Logo + Slogan Simple */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center lg:items-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <BrandLogo size="md" animated withGlow />
              </motion.div>
              
              {/* Slogan court */}
              <div className="space-y-1">
                <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
                  Transport • Livraison • Marketplace
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kinshasa, Lubumbashi, Kolwezi
                </p>
              </div>
            </motion.div>

            {/* CTAs Compacts */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto lg:mx-0"
            >
              {/* Card Transport */}
              <Link to="/app/auth">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 bg-gradient-to-br from-primary/90 to-primary backdrop-blur-xl rounded-lg px-5 py-3 shadow-md hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300"
                >
                  <Car className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-sm font-bold text-white">Réserver</span>
                </motion.div>
              </Link>

              {/* Card Livraison */}
              <Link to="/food">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 bg-gradient-to-br from-orange-500/90 to-amber-500/90 backdrop-blur-xl rounded-lg px-5 py-3 shadow-md hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] transition-all duration-300"
                >
                  <UtensilsCrossed className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-sm font-bold text-white">Commander</span>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Campaign Slider */}
          <div className="relative flex items-center justify-center">
            <HeroCampaignSlider />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHeroSimplified;
