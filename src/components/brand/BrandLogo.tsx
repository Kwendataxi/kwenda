import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import brandLogo from "@/assets/kwenda-logo.png";

interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  animated?: boolean;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className, 
  alt,
  animated = false,
  withGlow = false 
}) => {
  // Mapping responsive
  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 80,
    xl: 96
  };
  
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  
  const LogoImage = animated ? motion.img : 'img';
  
  const animationProps = animated ? {
    whileHover: { scale: 1.1, rotate: 3 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  } : {};
  
  return (
    <LogoImage
      src={brandLogo}
      width={pixelSize}
      height={pixelSize}
      alt={alt || "Kwenda Taxi Congo — logo"}
      className={clsx(
        "rounded-lg object-contain transition-all duration-300",
        withGlow && "drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]",
        className
      )}
      loading="eager"
      fetchPriority="high"
      {...animationProps}
    />
  );
};

export default BrandLogo;
