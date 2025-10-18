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
    <div className={`relative flex min-h-[65vh] flex-col items-center justify-center px-6 py-10 text-center overflow-hidden bg-gradient-to-b ${gradient}`}>
      {/* Glow Effect Background */}
      <motion.div
        className="absolute inset-0 opacity-20 blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.3 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/30 rounded-full" />
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
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="relative z-10 mb-8"
      >
        <div className="relative">
          {/* Halo effect */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-3xl border border-primary/20 backdrop-blur-sm">
            <Icon className="w-24 h-24 md:w-28 md:h-28 text-primary drop-shadow-lg" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative z-10 text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3 leading-tight max-w-lg"
      >
        {title}
      </motion.h2>

      {/* Tagline */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="relative z-10 mb-8"
      >
        <p className="text-lg md:text-xl font-semibold text-primary inline-block">
          {tagline}
        </p>
        <motion.div 
          className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mt-2"
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
        className="relative z-10 w-full max-w-md space-y-3"
      >
        {benefits.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
            className="flex items-start gap-3 text-left bg-background/40 backdrop-blur-sm rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="mt-0.5 flex-shrink-0">
              <div className="bg-primary/10 rounded-full p-1">
                <Check className="w-4 h-4 text-primary" strokeWidth={3} />
              </div>
            </div>
            <p className="text-sm md:text-base font-medium text-foreground/90 leading-relaxed">
              {benefit}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
