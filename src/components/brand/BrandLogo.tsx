import React from "react";
import clsx from "clsx";
import brandLogo from "@/assets/app-icon.png"; // Placeholder; will be replaced by provided logo asset

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
      className={clsx("rounded-xl object-contain shadow", className)}
      loading="eager"
    />
  );
};

export default BrandLogo;
