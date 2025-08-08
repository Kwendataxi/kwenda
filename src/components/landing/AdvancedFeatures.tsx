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
      subtitle: "Optimisé pour Kinshasa",
      description: "Navigation intelligente qui connaît chaque rue, avenue et quartier de Kinshasa. Localisation précise même dans les zones les plus reculées.",
      benefits: [
        "Reconnaissance automatique des adresses",
        "Navigation optimisée pour les embouteillages",
        "Points de repère locaux intégrés",
        "Mode hors-ligne pour les zones sans réseau"
      ],
      gradient: "from-primary to-primary-glow",
      stats: { accuracy: "99%", coverage: "Tout Kinshasa", landmarks: "1000+" }
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
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-secondary/30 text-secondary">
            💡 Innovation Congolaise
          </Badge>
          <h2 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Pourquoi choisir Kwenda Taxi ?
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Une application pensée spécifiquement pour les défis et opportunités de Kinshasa,
            avec des fonctionnalités uniques que vous ne trouverez nulle part ailleurs.
          </p>
        </div>

        {/* Main Features Interactive Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16 lg:mb-20">
          {/* Feature Tabs */}
          <div className="space-y-3 lg:space-y-4">
            {mainFeatures.map((feature) => (
              <Card
                key={feature.id}
                className={`cursor-pointer transition-all duration-300 touch-manipulation ${
                  activeFeature === feature.id
                    ? 'border-primary/50 shadow-lg scale-105'
                    : 'border-border/30 hover:border-primary/30 active:border-primary/50'
                }`}
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl bg-gradient-to-br ${feature.gradient} text-white flex-shrink-0`}>
                      <div className="w-5 h-5 lg:w-8 lg:h-8">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base lg:text-heading-sm mb-1 truncate">{feature.title}</h3>
                      <p className="text-xs lg:text-sm text-muted-foreground">{feature.subtitle}</p>
                      {activeFeature === feature.id && (
                        <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-foreground/80 leading-relaxed">
                          {feature.description}
                        </div>
                      )}
                    </div>
                    {activeFeature === feature.id && (
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Detail */}
          <Card className="border-primary/20 shadow-xl">
            <CardContent className="p-6 lg:p-8">
              <div className={`inline-flex p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-br ${activeFeatureData.gradient} text-white mb-4 lg:mb-6`}>
                <div className="w-6 h-6 lg:w-8 lg:h-8">
                  {activeFeatureData.icon}
                </div>
              </div>
              
              <h3 className="text-xl lg:text-heading-lg mb-3 lg:mb-4">{activeFeatureData.title}</h3>
              <p className="text-sm lg:text-body-md text-muted-foreground mb-4 lg:mb-6 leading-relaxed">
                {activeFeatureData.description}
              </p>

              {/* Benefits */}
              <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                {activeFeatureData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 lg:gap-3">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs lg:text-sm leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 lg:gap-4 p-3 lg:p-4 bg-muted/50 rounded-lg lg:rounded-xl">
                {Object.entries(activeFeatureData.stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-sm lg:text-lg font-bold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground capitalize truncate">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unique Features Grid */}
        <div className="mb-12 lg:mb-16">
          <h3 className="text-xl lg:text-heading-lg text-center mb-6 lg:mb-8">Ce qui nous rend uniques</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {uniqueFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 touch-manipulation">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className={`inline-flex p-2 lg:p-3 rounded-lg lg:rounded-xl bg-muted/50 ${feature.color} mb-3 lg:mb-4 group-hover:scale-110 transition-transform`}>
                    <div className="w-4 h-4 lg:w-6 lg:h-6">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-sm lg:text-heading-sm mb-1 lg:mb-2">{feature.title}</h4>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <CardContent className="p-6 lg:p-8">
            <div className="text-center mb-6 lg:mb-8">
              <h3 className="text-xl lg:text-heading-lg mb-2">Kwenda Taxi en chiffres</h3>
              <p className="text-white/90 text-sm lg:text-base">Des résultats qui parlent d'eux-mêmes</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-8 text-center">
              <div>
                <div className="text-2xl lg:text-display-sm font-bold mb-1 lg:mb-2">5+</div>
                <div className="text-white/80 text-xs lg:text-sm">Services Intégrés</div>
              </div>
              <div>
                <div className="text-2xl lg:text-display-sm font-bold mb-1 lg:mb-2">24/7</div>
                <div className="text-white/80 text-xs lg:text-sm">Support Client</div>
              </div>
              <div>
                <div className="text-2xl lg:text-display-sm font-bold mb-1 lg:mb-2">100%</div>
                <div className="text-white/80 text-xs lg:text-sm">Chauffeurs Vérifiés</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-2xl lg:text-display-sm font-bold mb-1 lg:mb-2">🇨🇩</div>
                <div className="text-white/80 text-xs lg:text-sm">Made in Congo</div>
              </div>
              <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                <div className="text-2xl lg:text-display-sm font-bold mb-1 lg:mb-2">∞</div>
                <div className="text-white/80 text-xs lg:text-sm">Possibilités</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdvancedFeatures;