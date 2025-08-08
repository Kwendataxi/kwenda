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
      className={clsx("rounded-2xl object-contain shadow", className)}
      loading="eager"
    />
  );
};

export default BrandLogo;
