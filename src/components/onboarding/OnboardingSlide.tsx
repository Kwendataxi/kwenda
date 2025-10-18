import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";

interface OnboardingSlideProps {
  icon: LucideIcon;
  title: string;
  tagline: string;
  benefits: string[];
  gradient: string;
  index: number;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  icon: Icon,
  title,
  tagline,
  benefits,
  gradient,
  index
}) => {
  return (
    <div className={`relative flex min-h-[50vh] flex-col items-center justify-center px-4 py-6 text-center overflow-hidden bg-gradient-to-b ${gradient}`}>
      {/* Glow Effect Background */}
      <motion.div
        className="absolute inset-0 opacity-20 blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.3 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/30 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-accent/30 rounded-full" />
      </motion.div>

      {/* Icon avec animation */}
      <motion.div
        initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          delay: 0.1 
        }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        className="relative z-10 mb-4"
      >
        <div className="relative">
          {/* Halo effect */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-2xl border border-primary/20 backdrop-blur-sm">
            <Icon className="w-16 h-16 md:w-20 md:h-20 text-primary drop-shadow-lg" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative z-10 text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2 leading-tight max-w-lg"
      >
        {title}
      </motion.h2>

      {/* Tagline */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="relative z-10 mb-4"
      >
        <p className="text-base md:text-lg font-semibold text-primary inline-block">
          {tagline}
        </p>
        <motion.div 
          className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mt-1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        />
      </motion.div>

      {/* Benefits List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="relative z-10 w-full max-w-md space-y-2"
      >
        {benefits.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
            className="flex items-start gap-2 text-left bg-background/40 backdrop-blur-sm rounded-lg p-2 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="mt-0.5 flex-shrink-0">
              <div className="bg-primary/10 rounded-full p-0.5">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-foreground/90 leading-snug">
              {benefit}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
