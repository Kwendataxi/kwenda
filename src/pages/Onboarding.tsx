import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import appIcon from "@/assets/app-icon.png";
import driverIcon from "@/assets/driver-icon.png";
import heroVtc from "@/assets/hero-vtc.jpg";

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

const slidesByContext: Record<OnboardingContext, Array<{ title: string; desc: string; img: string }>> = {
  client: [
    { title: "Réservez un trajet en 2 taps", desc: "Moto, Taxi, Bus – au meilleur prix avec suivi en temps réel.", img: heroVtc },
    { title: "Livraison express & cargo", desc: "Envoyez des colis rapidement, avec options d'assistance.", img: appIcon },
    { title: "Marketplace intégrée", desc: "Achetez et vendez avec paiement sécurisé KwendaPay.", img: appIcon },
  ],
  chauffeur: [
    { title: "Gérez vos courses facilement", desc: "Acceptez/Refusez, suivez vos gains et défis.", img: driverIcon },
    { title: "Abonnements & crédits", desc: "Optimisez vos revenus avec des plans adaptés.", img: appIcon },
    { title: "Validation multi-niveaux", desc: "Un processus clair jusqu'à l'approbation.", img: appIcon },
  ],
  partenaire: [
    { title: "Administrez votre flotte", desc: "Suivez performances, commissions et validations.", img: appIcon },
    { title: "Analytics en temps réel", desc: "Visualisez vos KPIs clés instantanément.", img: appIcon },
    { title: "Gestion financière", desc: "Comptes, retraits, partages de revenus.", img: appIcon },
  ],
  marketplace: [
    { title: "Vendez sans friction", desc: "Mettez en ligne, discutez, finalisez en escrow.", img: appIcon },
    { title: "Achetez en confiance", desc: "Produits validés, chat intégré, suivi.", img: appIcon },
    { title: "KwendaPay sécurisé", desc: "Paiements rapides, portefeuille CDF.", img: appIcon },
  ],
  admin: [
    { title: "Supervision totale", desc: "Opérations, support, finances et zones.", img: appIcon },
    { title: "Alertes & temps réel", desc: "Gardez le contrôle avec des widgets live.", img: appIcon },
    { title: "Modération & sécurité", desc: "RLS, vérifications et conformité.", img: appIcon },
  ],
};

const Dots: React.FC<{ total: number; index: number }> = ({ total, index }) => (
  <div className="mt-6 flex items-center justify-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`h-2 w-2 rounded-full transition-all ${i === index ? "bg-primary w-4" : "bg-muted"}`}
        aria-label={i === index ? "Étape active" : "Étape"}
      />
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
    navigate("/auth", { replace: true });
  };

  const onNext = () => {
    if (api) api.scrollNext();
    else setIndex((i) => clamp(i + 1, 0, slides.length - 1));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="Logo Kwenda" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Bienvenue</h1>
          </div>
          <Button variant="ghost" onClick={finish} aria-label="Passer l'onboarding" className="hover-scale">
            Passer
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <Carousel setApi={setApi}>
              <CarouselContent className="-ml-0">
                {slides.map((s, i) => (
                  <CarouselItem key={i} className="pl-0">
                    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-10 text-center">
                      <img src={s.img} alt={s.title} className="mb-6 h-40 w-40 object-cover rounded-xl shadow" loading="lazy" />
                      <h2 className="text-2xl font-semibold">{s.title}</h2>
                      <p className="mt-2 text-muted-foreground">{s.desc}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </CardContent>
        </Card>

        <Dots total={slides.length} index={index} />

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
    </main>
  );
};

export default Onboarding;
