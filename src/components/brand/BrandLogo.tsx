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
      className={clsx("rounded-lg object-contain", className)}
      loading="eager"
      fetchPriority="high"
    />
  );
};

export default BrandLogo;
