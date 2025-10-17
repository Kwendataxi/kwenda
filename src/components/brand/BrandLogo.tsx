import React from "react";
import clsx from "clsx";
import brandLogo from "@/assets/kwenda-logo.png";

interface BrandLogoProps {
  size?: number; // px
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 64, className, alt }) => {
  return (
    <img
      src={brandLogo}
      width={size}
      height={size}
      alt={alt || "Kwenda Taxi Congo — logo"}
      className={clsx("rounded-2xl object-contain shadow-congo-glow transition-all duration-300 hover:shadow-congo-intense hover:scale-105", className)}
      loading="eager"
    />
  );
};

export default BrandLogo;
