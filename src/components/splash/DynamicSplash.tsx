import React from "react";
import { useLocation } from "react-router-dom";
import appIcon from "@/assets/app-icon.png";
import driverIcon from "@/assets/driver-icon.png";
import heroVtc from "@/assets/hero-vtc.jpg";
import { getStartupContext, StartupContext } from "@/services/startupContext";

interface DynamicSplashProps {
  context?: StartupContext;
}

export const DynamicSplash: React.FC<DynamicSplashProps> = ({ context }) => {
  const location = useLocation();
  const ctx = context || getStartupContext(location.pathname);

  const ctxMeta: Record<StartupContext, { title: string; subtitle: string; image: string }> = {
    client: {
      title: "Kwenda Taxi Congo",
      subtitle: "Transport, Livraison, Marketplace — tout-en-un",
      image: appIcon,
    },
    chauffeur: {
      title: "Espace Chauffeur",
      subtitle: "Gains, courses, défis et récompenses",
      image: driverIcon,
    },
    partenaire: {
      title: "Espace Partenaire",
      subtitle: "Gérez votre flotte et vos revenus",
      image: appIcon,
    },
    marketplace: {
      title: "Kwenda Market",
      subtitle: "Achetez et vendez en toute sécurité",
      image: heroVtc,
    },
    admin: {
      title: "Console Admin",
      subtitle: "Supervision et opérations en temps réel",
      image: appIcon,
    },
  };

  const meta = ctxMeta[ctx];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/80 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative mx-6 w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl animate-enter">
        <img
          src={meta.image}
          alt={`Logo ${meta.title}`}
          className="mx-auto mb-6 h-20 w-20 rounded-xl object-cover shadow-md"
          loading="eager"
        />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {meta.subtitle}
        </p>
        <div className="mt-6 h-1 w-24 mx-auto rounded-full bg-primary/40">
          <div className="h-1 w-12 rounded-full bg-primary animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default DynamicSplash;
