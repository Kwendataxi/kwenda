import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import BrandLogo from "@/components/brand/BrandLogo";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { onboardingContent, type OnboardingContext } from "@/constants/onboardingContent";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import confetti from "canvas-confetti";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const useOnboardingContext = (): OnboardingContext => {
  const [params] = useSearchParams();
  const fromParam = (params.get("context") || "").toLowerCase();
  const allowed = ["client", "chauffeur", "partenaire", "marketplace", "admin"];
  if (allowed.includes(fromParam)) return fromParam as OnboardingContext;
  const fromLocal = (localStorage.getItem("last_context") || "client").toLowerCase();
  return allowed.includes(fromLocal) ? (fromLocal as OnboardingContext) : "client";
};

const NumberedDots: React.FC<{ total: number; index: number }> = ({ total, index }) => (
  <div className="mt-8 space-y-4">
    {/* Progress Bar */}
    <div className="mx-auto max-w-xs">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>

    {/* Numbered Dots */}
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: i === index ? 1.2 : 1, 
            opacity: 1 
          }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all
            ${i === index 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50 ring-2 ring-primary/30" 
              : i < index 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            }
          `}>
            {i + 1}
          </div>
        </motion.div>
      ))}
    </div>

    {/* Step Label */}
    <p className="text-center text-sm text-muted-foreground font-medium">
      Étape {index + 1} sur {total}
    </p>
  </div>
);

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const ctx = useOnboardingContext();
  const slides = useMemo(() => onboardingContent[ctx], [ctx]);
  const [index, setIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { triggerHaptic, triggerSuccess } = useHapticFeedback();

  useEffect(() => {
    document.title = `Onboarding ${ctx} — Kwenda Taxi Congo`;
  }, [ctx]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      setIndex(newIndex);
      triggerHaptic('light');
      
      // Confetti sur le dernier slide
      if (newIndex === slides.length - 1) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))']
          });
        }, 300);
      }
    };
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, slides.length, triggerHaptic]);

  const finish = () => {
    triggerSuccess();
    
    // Confetti de fin
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))']
    });

    // ✅ CORRECTION: Sauvegarder IMMÉDIATEMENT et SYNCHRONIQUEMENT
    try { 
      localStorage.setItem(`onboarding_seen::${ctx}`, "1"); 
      localStorage.setItem(`onboarding_completed_at::${ctx}`, new Date().toISOString());
      
      // ✅ NOUVEAU: Flag global pour indiquer que l'onboarding est complété
      localStorage.setItem('onboarding_just_completed', 'true');
      console.log('✅ [Onboarding] Flags saved, redirecting to auth');
    } catch (e) {
      console.error('❌ [Onboarding] Failed to save flags:', e);
    }
    
    // Redirection intelligente selon le contexte
    const redirectMap: Record<OnboardingContext, string> = {
      client: "/app/auth",
      chauffeur: "/app/auth",
      marketplace: "/app/auth",
      admin: "/operatorx/admin/auth",
      partenaire: "/partner/auth",
    };
    
    // ✅ CORRECTION: Rediriger IMMÉDIATEMENT sans délai
    navigate(redirectMap[ctx] || "/app/auth", { replace: true });
  };

  const onNext = () => {
    triggerHaptic('medium');
    if (api) api.scrollNext();
    else setIndex((i) => clamp(i + 1, 0, slides.length - 1));
  };

  return (
    <motion.main 
      className="min-h-screen bg-background text-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <h1 className="text-lg font-semibold">Bienvenue</h1>
          </div>
          <Button variant="ghost" onClick={finish} aria-label="Passer l'onboarding" className="hover-scale">
            Passer
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            <Carousel setApi={setApi} opts={{ loop: false, align: "center" }}>
              <CarouselContent className="-ml-0">
                {slides.map((slide, i) => (
                  <CarouselItem key={i} className="pl-0">
                    <OnboardingSlide
                      icon={slide.icon}
                      title={slide.title}
                      tagline={slide.tagline}
                      benefits={slide.benefits}
                      gradient={slide.gradient}
                      index={i}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </CardContent>
        </Card>

        <NumberedDots total={slides.length} index={index} />

        <div className="mx-auto mt-6 flex max-w-2xl items-center justify-end gap-3 px-1">
          {index < slides.length - 1 ? (
            <Button onClick={onNext} className="hover-scale" aria-label="Écran suivant">
              Suivant
            </Button>
          ) : (
            <Button onClick={finish} className="hover-scale" aria-label="Commencer">
              Commencer
            </Button>
          )}
        </div>
      </section>
    </motion.main>
  );
};

export default Onboarding;
