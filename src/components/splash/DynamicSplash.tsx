import React from "react";
import { useLocation } from "react-router-dom";
import { getStartupContext, StartupContext } from "@/services/startupContext";
import BrandLogo from "@/components/brand/BrandLogo";

interface DynamicSplashProps {
  context?: StartupContext;
}

export const DynamicSplash: React.FC<DynamicSplashProps> = ({ context }) => {
  const location = useLocation();
  const ctx = context || getStartupContext(location.pathname);

  const ctxMeta: Record<StartupContext, { title: string; subtitle: string }> = {
    client: {
      title: "Kwenda Taxi Congo",
      subtitle: "Transport, Livraison, Marketplace — tout-en-un",
    },
    chauffeur: {
      title: "Espace Chauffeur",
      subtitle: "Gains, courses, défis et récompenses",
    },
    partenaire: {
      title: "Espace Partenaire",
      subtitle: "Gérez votre flotte et vos revenus",
    },
    marketplace: {
      title: "Kwenda Market",
      subtitle: "Achetez et vendez en toute sécurité",
    },
    admin: {
      title: "Console Admin",
      subtitle: "Supervision et opérations en temps réel",
    },
  };

  const meta = ctxMeta[ctx];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Dynamic ambient background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl pulse" />
        <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-fade-in" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-background/80 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative mx-6 w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl animate-enter">
        <div className="relative mx-auto mb-6 h-20 w-20 rounded-2xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl" aria-hidden="true" />
          <div className="absolute inset-0 rounded-2xl border border-border/60 bg-card/60 backdrop-blur" aria-hidden="true" />
          <BrandLogo size={80} className="relative z-10 mx-auto" alt={`Logo ${meta.title}`} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{meta.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{meta.subtitle}</p>
        <div className="mt-6 mx-auto h-1 w-28 overflow-hidden rounded-full bg-primary/30">
          <div className="h-full w-1/2 bg-primary animate-[slide-in-right_1.2s_ease-in-out_infinite_alternate]" />
        </div>
      </div>
    </div>
  );
};

export default DynamicSplash;
