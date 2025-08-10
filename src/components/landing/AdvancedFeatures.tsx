import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Clock, CreditCard, Shield, Smartphone, 
  Wifi, Users, Zap, Globe, Heart, Star, TrendingUp,
  CheckCircle, ArrowRight
} from "lucide-react";
import { useState } from "react";

const AdvancedFeatures = () => {
  const [activeFeature, setActiveFeature] = useState<string>("geolocation");

  const mainFeatures = [
    {
      id: "geolocation",
      icon: <MapPin className="w-8 h-8" />,
      title: "Géolocalisation Précise",
      subtitle: "Optimisé pour le Congo RDC",
      description: "Navigation intelligente qui connaît chaque rue de Kinshasa, Lubumbashi et Kolwezi. Localisation précise même dans les zones les plus reculées.",
      benefits: [
        "Reconnaissance automatique des adresses",
        "Navigation optimisée pour les embouteillages",
        "Points de repère locaux intégrés",
        "Mode hors-ligne pour les zones sans réseau"
      ],
      gradient: "from-primary to-primary-glow",
      stats: { accuracy: "99%", coverage: "3 Villes", landmarks: "1500+" }
    },
    {
      id: "payment",
      icon: <CreditCard className="w-8 h-8" />,
      title: "KwendaPay & Mobile Money",
      subtitle: "Paiements adaptés à la RDC",
      description: "Système de paiement intégré avec support complet du Mobile Money congolais. Rechargez et payez en toute simplicité.",
      benefits: [
        "Airtel Money, Orange Money, M-Pesa",
        "Portefeuille KwendaPay intégré",
        "Paiements sans contact",
        "Historique des transactions sécurisé"
      ],
      gradient: "from-secondary to-accent",
      stats: { methods: "5+", security: "256-bit", instant: "Immédiat" }
    },
    {
      id: "availability",
      icon: <Clock className="w-8 h-8" />,
      title: "Service 24h/24",
      subtitle: "Toujours disponible",
      description: "Service continu jour et nuit avec des chauffeurs vérifiés disponibles à toute heure. Support client réactif.",
      benefits: [
        "Chauffeurs disponibles 24/7",
        "Support client en temps réel",
        "Service d'urgence prioritaire",
        "Maintenance continue de la flotte"
      ],
      gradient: "from-accent to-primary",
      stats: { uptime: "99.9%", response: "<3min", support: "24/7" }
    },
    {
      id: "security",
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité Maximale",
      subtitle: "Votre sécurité d'abord",
      description: "Chauffeurs vérifiés, véhicules assurés et système de suivi en temps réel pour votre tranquillité d'esprit totale.",
      benefits: [
        "Chauffeurs avec background check",
        "Véhicules régulièrement inspectés",
        "Assurance complète incluse",
        "Bouton d'urgence intégré"
      ],
      gradient: "from-primary via-secondary to-accent",
      stats: { verified: "100%", insurance: "Complète", incidents: "<0.1%" }
    }
  ];

  const uniqueFeatures = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Interface Intuitive",
      description: "Conçue pour tous les niveaux techniques",
      color: "text-primary"
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: "Mode Hors-ligne",
      description: "Fonctionne même avec connexion faible",
      color: "text-secondary"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Communauté Active",
      description: "Réseau grandissant de partenaires",
      color: "text-accent"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance Optimisée",
      description: "Application légère et rapide",
      color: "text-primary"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multilingue",
      description: "Français, Lingala, Kikongo et plus",
      color: "text-secondary"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Fait au Congo",
      description: "Par des Congolais pour les Congolais",
      color: "text-accent"
    }
  ];

  const activeFeatureData = mainFeatures.find(f => f.id === activeFeature) || mainFeatures[0];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-muted/20 via-background to-muted/10">
      <div className="container-section">
        {/* Enhanced Header */}
        <div className="text-center mb-20 space-y-fluid animate-fade-up">
          <Badge variant="outline" className="border-secondary/30 text-secondary px-6 py-3 text-base bg-secondary/5 animate-glow-pulse">
            💡 Innovation Congolaise
          </Badge>
          <h2 className="text-display-lg bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent animate-gradient">
            Pourquoi choisir Kwenda Taxi ?
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Une application pensée spécifiquement pour les défis et opportunités du Congo RDC,
            avec des fonctionnalités uniques adaptées à Kinshasa, Lubumbashi et Kolwezi.
          </p>
        </div>

        {/* Enhanced Main Features Interactive Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-20 lg:mb-32">
          {/* Feature Tabs */}
          <div className="space-y-4 lg:space-y-6 animate-fade-up">
            {mainFeatures.map((feature, index) => (
              <Card
                key={feature.id}
                className={`cursor-pointer transition-all duration-500 touch-scale glass border-2 ${
                  activeFeature === feature.id
                    ? 'border-primary/50 shadow-glow scale-105 bg-primary/5'
                    : 'border-border/20 hover:border-primary/30 hover:shadow-lg'
                } ${`stagger-${index + 1}`}`}
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4 lg:gap-6">
                    <div className={`p-3 lg:p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-glow`}>
                      <div className="w-6 h-6 lg:w-8 lg:h-8">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-heading-sm lg:text-heading-md mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-body-sm lg:text-body-md text-muted-foreground">{feature.subtitle}</p>
                      {activeFeature === feature.id && (
                        <div className="mt-3 lg:mt-4 text-body-sm lg:text-body-md text-foreground/80 leading-relaxed animate-fade-up">
                          {feature.description}
                        </div>
                      )}
                    </div>
                    {activeFeature === feature.id && (
                      <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 animate-float" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Feature Detail */}
          <Card className="glass border-2 border-primary/30 shadow-glow animate-scale-fade">
            <CardContent className="p-8 lg:p-10">
              <div className={`inline-flex p-4 lg:p-5 rounded-2xl bg-gradient-to-br ${activeFeatureData.gradient} text-white mb-6 lg:mb-8 shadow-glow animate-float`}>
                <div className="w-8 h-8 lg:w-10 lg:h-10">
                  {activeFeatureData.icon}
                </div>
              </div>
              
              <h3 className="text-heading-lg lg:text-display-sm mb-4 lg:mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{activeFeatureData.title}</h3>
              <p className="text-body-md lg:text-body-lg text-muted-foreground mb-6 lg:mb-8 leading-relaxed">
                {activeFeatureData.description}
              </p>

              {/* Enhanced Benefits */}
              <div className="space-y-4 lg:space-y-5 mb-6 lg:mb-8">
                {activeFeatureData.benefits.map((benefit, index) => (
                  <div key={index} className={`flex items-start gap-3 lg:gap-4 animate-fade-up stagger-${index + 1}`}>
                    <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-body-sm lg:text-body-md leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 p-6 lg:p-8 glass rounded-2xl border border-primary/20">
                {Object.entries(activeFeatureData.stats).map(([key, value], index) => (
                  <div key={key} className={`text-center group stagger-${index + 1}`}>
                    <div className="text-heading-md lg:text-heading-lg font-bold text-primary group-hover:scale-110 transition-transform">{value}</div>
                    <div className="text-caption text-muted-foreground capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Unique Features Grid */}
        <div className="mb-20 lg:mb-32 animate-fade-up">
          <h3 className="text-heading-lg lg:text-display-sm text-center mb-12 lg:mb-16 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Ce qui nous rend uniques
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {uniqueFeatures.map((feature, index) => (
              <Card key={index} className={`group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 touch-scale glass border-2 border-transparent hover:border-primary/20 stagger-${(index % 6) + 1}`}>
                <CardContent className="p-6 lg:p-8 text-center">
                  <div className={`inline-flex p-3 lg:p-4 rounded-2xl bg-muted/30 ${feature.color} mb-4 lg:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    <div className="w-6 h-6 lg:w-8 lg:h-8">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-heading-sm lg:text-heading-md mb-2 lg:mb-3 group-hover:text-primary transition-colors">{feature.title}</h4>
                  <p className="text-body-sm lg:text-body-md text-muted-foreground leading-relaxed line-clamp-2">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-glow border-0 animate-fade-up overflow-hidden relative">
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 animate-gradient"></div>
          
          <CardContent className="p-8 lg:p-12 relative z-10">
            <div className="text-center mb-10 lg:mb-12">
              <h3 className="text-heading-lg lg:text-display-sm mb-4">Kwenda Taxi en chiffres</h3>
              <p className="text-white/90 text-body-md lg:text-body-lg">Des résultats qui parlent d'eux-mêmes</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 text-center">
              <div className="group stagger-1">
                <div className="text-display-sm lg:text-display-md font-bold mb-2 lg:mb-3 group-hover:scale-110 transition-transform">5+</div>
                <div className="text-white/90 text-body-sm lg:text-body-md">Services Intégrés</div>
              </div>
              <div className="group stagger-2">
                <div className="text-display-sm lg:text-display-md font-bold mb-2 lg:mb-3 group-hover:scale-110 transition-transform">24/7</div>
                <div className="text-white/90 text-body-sm lg:text-body-md">Support Client</div>
              </div>
              <div className="group stagger-3">
                <div className="text-display-sm lg:text-display-md font-bold mb-2 lg:mb-3 group-hover:scale-110 transition-transform">100%</div>
                <div className="text-white/90 text-body-sm lg:text-body-md">Chauffeurs Vérifiés</div>
              </div>
              <div className="col-span-2 sm:col-span-1 group stagger-4">
                <div className="text-display-sm lg:text-display-md font-bold mb-2 lg:mb-3 group-hover:scale-110 transition-transform animate-float">🇨🇩</div>
                <div className="text-white/90 text-body-sm lg:text-body-md">Made in Congo</div>
              </div>
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 group stagger-5">
                <div className="text-display-sm lg:text-display-md font-bold mb-2 lg:mb-3 group-hover:scale-110 transition-transform">∞</div>
                <div className="text-white/90 text-body-sm lg:text-body-md">Possibilités</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdvancedFeatures;