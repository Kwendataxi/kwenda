import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import BrandLogo from "@/components/brand/BrandLogo";
import { TypeAnimation } from 'react-type-animation';
import { AnimatedBackground } from "@/components/onboarding/AnimatedBackground";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustrations";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export type OnboardingContext = "client" | "chauffeur" | "partenaire" | "marketplace" | "admin";

const useOnboardingContext = (): OnboardingContext => {
  const [params] = useSearchParams();
  const fromParam = (params.get("context") || "").toLowerCase();
  const allowed = ["client", "chauffeur", "partenaire", "marketplace", "admin"];
  if (allowed.includes(fromParam)) return fromParam as OnboardingContext;
  const fromLocal = (localStorage.getItem("last_context") || "client").toLowerCase();
  return allowed.includes(fromLocal) ? (fromLocal as OnboardingContext) : "client";
};

const slidesByContext: Record<OnboardingContext, Array<{ title: string; desc: string }>> = {
  client: [
    { title: "Réservez un trajet en 2 taps", desc: "Moto, Taxi, Bus – au meilleur prix avec suivi en temps réel." },
    { title: "Livraison express & cargo", desc: "Envoyez des colis rapidement, avec options d'assistance." },
    { title: "Marketplace intégrée", desc: "Achetez et vendez avec paiement sécurisé KwendaPay." },
  ],
  chauffeur: [
    { title: "Gérez vos courses facilement", desc: "Acceptez/Refusez, suivez vos gains et défis." },
    { title: "Abonnements & crédits", desc: "Optimisez vos revenus avec des plans adaptés." },
    { title: "Validation multi-niveaux", desc: "Un processus clair jusqu'à l'approbation." },
  ],
  partenaire: [
    { title: "Administrez votre flotte", desc: "Suivez performances, commissions et validations." },
    { title: "Analytics en temps réel", desc: "Visualisez vos KPIs clés instantanément." },
    { title: "Gestion financière", desc: "Comptes, retraits, partages de revenus." },
  ],
  marketplace: [
    { title: "Vendez sans friction", desc: "Mettez en ligne, discutez, finalisez en escrow." },
    { title: "Achetez en confiance", desc: "Produits validés, chat intégré, suivi." },
    { title: "KwendaPay sécurisé", desc: "Paiements rapides, portefeuille CDF." },
  ],
  admin: [
    { title: "Supervision totale", desc: "Opérations, support, finances et zones." },
    { title: "Alertes & temps réel", desc: "Gardez le contrôle avec des widgets live." },
    { title: "Modération & sécurité", desc: "RLS, vérifications et conformité." },
  ],
};

const Dots: React.FC<{ total: number; index: number }> = ({ total, index }) => (
  <div className="mt-6 flex items-center justify-center gap-3">
    {Array.from({ length: total }).map((_, i) => (
      <motion.span
        key={i}
        className={`relative h-3 rounded-full overflow-hidden ${i === index ? "w-12" : "w-3"}`}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        aria-label={i === index ? "Étape active" : "Étape"}
      >
        <div className="absolute inset-0 bg-muted-foreground/30" />
        {i === index && (
          <motion.div
            className="absolute inset-0 bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
            key={`progress-${index}`}
          />
        )}
      </motion.span>
    ))}
  </div>
);

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const ctx = useOnboardingContext();
  const slides = useMemo(() => slidesByContext[ctx], [ctx]);
  const [index, setIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    document.title = `Onboarding ${ctx} — Kwenda Taxi Congo`;
  }, [ctx]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const finish = () => {
    try { localStorage.setItem(`onboarding_seen::${ctx}`, "1"); } catch {}
    
    // Redirection intelligente selon le contexte
    const redirectMap: Record<OnboardingContext, string> = {
      client: "/auth",
      chauffeur: "/auth",
      marketplace: "/auth",
      admin: "/admin/auth",
      partenaire: "/partner/auth",
    };
    
    navigate(redirectMap[ctx] || "/auth", { replace: true });
  };

  const onNext = () => {
    if (api) api.scrollNext();
    else setIndex((i) => clamp(i + 1, 0, slides.length - 1));
  };

  return (
    <motion.main 
      className="min-h-screen text-foreground relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated gradient background */}
      <AnimatedBackground />
      
      <header className="sticky top-0 z-10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 border-b border-border/50">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <BrandLogo size={32} />
            <h1 className="text-lg font-semibold">Bienvenue</h1>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="ghost" onClick={finish} aria-label="Passer l'onboarding" className="hover-scale">
              Passer
            </Button>
          </motion.div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-0">
            <Carousel setApi={setApi}>
              <CarouselContent className="-ml-0">
                {slides.map((s, i) => (
                  <CarouselItem key={i} className="pl-0">
                    <motion.div 
                      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-10 text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* Illustration animée selon le contexte */}
                      <OnboardingIllustration context={ctx} className="mb-6" />
                      
                      {/* Typing animation pour le titre */}
                      <TypeAnimation
                        sequence={[
                          s.title,
                          2000,
                        ]}
                        wrapper="h2"
                        speed={50}
                        className="text-2xl font-semibold mb-2"
                        cursor={false}
                      />
                      
                      <motion.p 
                        className="mt-2 text-muted-foreground max-w-md"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {s.desc}
                      </motion.p>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </CardContent>
        </Card>

        <Dots total={slides.length} index={index} />

        <div className="mx-auto mt-6 flex max-w-2xl items-center justify-end gap-3 px-1">
          {index < slides.length - 1 ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={onNext} className="hover-scale" aria-label="Écran suivant">
                Suivant
              </Button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={finish} className="hover-scale" aria-label="Commencer">
                Commencer
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </motion.main>
  );
};

export default Onboarding;
