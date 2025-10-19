import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { Car, Package, ShoppingCart, MapPin, Bike, Truck } from "lucide-react";
import BrandLogoWhite from "@/components/brand/BrandLogoWhite";
import { APP_CONFIG } from "@/config/appConfig";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

const MobileSplash: React.FC = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const logoControls = useAnimationControls();

  useEffect(() => {
    // Animation séquentielle du logo
    logoControls.start({
      scale: [0.8, 1.05, 1],
      opacity: [0, 1, 1],
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    });

    const ctx = localStorage.getItem("last_context") || APP_CONFIG.type || "client";
    const exitTimer = setTimeout(() => setIsExiting(true), 2500);
    
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
        
        if (loginIntent) {
          const redirectPath = loginIntent === 'admin' ? '/admin' 
            : loginIntent === 'partner' ? '/partenaire'
            : loginIntent === 'driver' ? '/chauffeur'
            : loginIntent === 'restaurant' ? '/restaurant'
            : '/client';
          
          logger.info('🎯 [MobileSplash] Redirecting via loginIntent', { loginIntent, redirectPath });
          navigate(redirectPath, { replace: true });
          return;
        }
        
        const { data: roles } = await supabase.rpc('get_user_roles', {
          p_user_id: session.user.id
        });
        const primaryRole = roles?.[0]?.role || 'client';
        const redirectPath = primaryRole === 'admin' ? '/admin' 
          : primaryRole === 'partner' ? '/partenaire'
          : primaryRole === 'driver' ? '/chauffeur'
          : primaryRole === 'restaurant' ? '/restaurant'
          : '/client';
        
        logger.info('🚀 [MobileSplash] Redirecting via get_user_roles', { primaryRole, redirectPath });
        navigate(redirectPath, { replace: true });
      } else {
        const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
        if (!onboardingSeen) {
          logger.info('🎓 Not logged in - redirecting to onboarding');
          navigate(`/onboarding?context=${encodeURIComponent(ctx)}`, { replace: true });
        } else {
          logger.info('🔐 Not logged in - redirecting to auth');
          navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
        }
      }
    }, 3000);

    const safetyTimer = setTimeout(() => {
      logger.warn('⚠️ Splash safety timeout');
      navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [navigate, logoControls]);

  // Slogan dynamique
  const getSlogan = () => {
    const loginIntent = localStorage.getItem('kwenda_login_intent');
    
    if (loginIntent === 'restaurant') {
      return 'Livraison express pour vos clients !';
    }
    
    switch (APP_CONFIG.type) {
      case 'driver':
        return 'Gagnez plus, roulez mieux !';
      case 'partner':
        return 'Gérez votre flotte efficacement !';
      default:
        return 'Transport • Livraison • Marketplace';
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#DC2626]"
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Fond rouge dégradé avec vagues animées */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 30% 50%, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
            'radial-gradient(circle at 70% 50%, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
            'radial-gradient(circle at 30% 50%, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
          ]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Cercles de géolocalisation qui se propagent */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute border-2 border-white/20 rounded-full"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: [0, 400, 600],
              height: [0, 400, 600],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Particules-véhicules en orbite */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[
          { Icon: Car, angle: 0, radius: 180, delay: 0 },
          { Icon: Bike, angle: 120, radius: 180, delay: 0.5 },
          { Icon: Truck, angle: 240, radius: 180, delay: 1 },
          { Icon: Package, angle: 60, radius: 220, delay: 0.25 },
          { Icon: ShoppingCart, angle: 180, radius: 220, delay: 0.75 },
          { Icon: MapPin, angle: 300, radius: 220, delay: 1.25 },
        ].map(({ Icon, angle, radius, delay }, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute"
            initial={{ 
              x: Math.cos((angle * Math.PI) / 180) * radius,
              y: Math.sin((angle * Math.PI) / 180) * radius,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: Math.cos(((angle + 360) * Math.PI) / 180) * radius,
              y: Math.sin(((angle + 360) * Math.PI) / 180) * radius,
              opacity: [0, 0.6, 0.6, 0],
              scale: [0, 1, 1, 0.8],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              delay: delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Icon className="w-8 h-8 text-white/70" />
          </motion.div>
        ))}
      </div>

      {/* Ligne de trajet qui se dessine */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d="M 20,50 Q 30,30 50,50 T 80,50"
          stroke="white"
          strokeWidth="0.3"
          fill="none"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100, opacity: 0 }}
          animate={{ 
            strokeDashoffset: [100, 0, 0],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Contenu central */}
      <motion.div
        animate={logoControls}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Logo blanc avec halo pulsant */}
        <div className="relative">
          {/* Halo externe */}
          <motion.div
            className="absolute -inset-12 rounded-full blur-3xl"
            style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
          
          {/* Cercle de fond blanc doux */}
          <motion.div
            className="absolute -inset-8 rounded-full bg-white/10 backdrop-blur-sm"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
            }}
          />

          {/* Logo */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          >
            <BrandLogoWhite size={220} className="relative z-10" />
          </motion.div>

          {/* Points lumineux qui tournent autour du logo */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <motion.div
                key={`dot-${i}`}
                className="absolute w-2 h-2 rounded-full bg-white"
                style={{
                  top: '50%',
                  left: '50%',
                  marginTop: '-4px',
                  marginLeft: '-4px',
                }}
                animate={{
                  x: Math.cos(((angle + 360) * Math.PI) / 180) * 130,
                  y: Math.sin(((angle + 360) * Math.PI) / 180) * 130,
                  opacity: [0.2, 1, 0.2],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            );
          })}
        </div>

        {/* Slogan avec animation de typing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center px-8"
        >
          <motion.h2
            className="text-white text-2xl font-bold tracking-wide"
            style={{ 
              textShadow: '0 2px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.1)' 
            }}
            animate={{
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {getSlogan()}
          </motion.h2>
          
          {/* Barre de progression stylisée */}
          <motion.div
            className="mt-6 h-1 bg-white/20 rounded-full overflow-hidden"
            style={{ width: '200px', margin: '24px auto 0' }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Indicateur de chargement minimaliste */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1] }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 mt-4"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`loader-${i}`}
              className="w-2 h-2 rounded-full bg-white"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MobileSplash;
