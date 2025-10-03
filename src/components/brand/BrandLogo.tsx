import React from "react";
import clsx from "clsx";
const brandLogo = "/lovable-uploads/e5018ec7-a9e4-44b2-ad57-174b4cb5891b.png"; // Provided logo

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
      className={clsx(
        "rounded-2xl object-contain transition-all duration-500",
        "shadow-[0_0_30px_rgba(220,38,38,0.6)] dark:shadow-[0_0_40px_rgba(239,68,68,0.7)]",
        "hover:shadow-[0_0_50px_rgba(220,38,38,0.9)] dark:hover:shadow-[0_0_60px_rgba(239,68,68,1)]",
        "hover:scale-110 hover:brightness-125",
        className
      )}
      loading="eager"
    />
  );
};

export default BrandLogo;
