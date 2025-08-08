import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Users, Zap, Globe, Target, Award, ExternalLink } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const About = () => {
  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Innovation Locale",
      description: "Solutions créées par et pour les Congolais, adaptées aux réalités locales",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Inclusion Social",
      description: "Opportunités économiques pour tous, chauffeurs et entrepreneurs",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Excellence Technique",
      description: "Technologie de pointe adaptée aux connexions locales",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Impact Durable",
      description: "Transformation positive de la mobilité urbaine en RDC",
      color: "bg-primary-glow/10 text-primary-glow"
    }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Conception & Vision",
      description: "Identification des besoins de mobilité à Kinshasa et début du développement"
    },
    {
      year: "2024 Q1",
      title: "Lancement Pilote",
      description: "Tests en version bêta avec 50 chauffeurs pionniers dans 3 communes"
    },
    {
      year: "2024 Q2",
      title: "Expansion Kinshasa",
      description: "Déploiement progressif dans les 24 communes de Kinshasa"
    },
    {
      year: "2024 Q3",
      title: "Services Intégrés",
      description: "Lancement marketplace, livraison et système de loterie"
    },
    {
      year: "2024 Q4",
      title: "Horizon National",
      description: "Extension vers Lubumbashi et Kolwezi"
    }
  ];

  const team = [
    {
      role: "Direction Générale",
      description: "Leadership visionnaire et stratégie d'expansion",
      count: "2 dirigeants"
    },
    {
      role: "Équipe Technique",
      description: "Développement et infrastructure technologique",
      count: "8 développeurs"
    },
    {
      role: "Operations & Support",
      description: "Gestion quotidienne et support utilisateurs",
      count: "12 opérateurs"
    },
    {
      role: "Partenaires Chauffeurs",
      description: "Réseau de chauffeurs et livreurs certifiés",
      count: "1,200+ actifs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-16">
          <Badge variant="secondary" className="mb-4">
            À propos de Kwenda Taxi
          </Badge>
          <h1 className="text-display-lg">Révolutionner la mobilité en RDC</h1>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Kwenda Taxi est né d'une vision simple : transformer la mobilité urbaine en République 
            Démocratique du Congo grâce à la technologie et l'innovation locale.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary-glow/10">
            <CardHeader>
              <CardTitle className="text-heading-lg flex items-center gap-3">
                <Target className="w-6 h-6" />
                Notre Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-md">
                Démocratiser l'accès aux services de transport, livraison et commerce électronique 
                en République Démocratique du Congo, en créant des opportunités économiques durables 
                pour les Congolais.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold">Nos objectifs :</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Connecter 1 million d'utilisateurs d'ici 2025</li>
                  <li>• Créer 10,000 emplois directs et indirects</li>
                  <li>• Couvrir les 5 plus grandes villes du Congo</li>
                  <li>• Devenir la super-app de référence en RDC</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-accent/10">
            <CardHeader>
              <CardTitle className="text-heading-lg flex items-center gap-3">
                <Award className="w-6 h-6" />
                Notre Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-md">
                Devenir la plateforme technologique de référence qui transforme la vie quotidienne 
                des Congolais, en rendant les services essentiels accessibles, abordables et fiables.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold">Notre impact :</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Réduire les temps de transport urbain</li>
                  <li>• Stimuler l'économie numérique locale</li>
                  <li>• Favoriser l'inclusion financière</li>
                  <li>• Promouvoir l'entrepreneuriat congolais</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-heading-lg text-center mb-8">Nos valeurs fondamentales</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-xl ${value.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {value.icon}
                  </div>
                  <CardTitle className="text-heading-sm">{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-heading-lg text-center mb-8">Notre parcours</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-gradient-to-b from-primary/50 to-transparent mt-4"></div>
                    )}
                  </div>
                  <Card className="flex-1 group-hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.year}
                        </Badge>
                      </div>
                      <h3 className="text-heading-sm mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-heading-lg text-center mb-8">Notre équipe</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-body-lg mb-2">{member.role}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{member.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {member.count}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Developer Credit & CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <h2 className="text-heading-lg">Développé au Congo, pour le Congo</h2>
              <p className="text-body-md text-muted-foreground max-w-2xl mx-auto">
                Kwenda Taxi est fièrement développé par{" "}
                <a 
                  href="https://icon-sarl.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  ICON SARL
                </a>
                , une entreprise technologique congolaise spécialisée dans les solutions digitales innovantes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Rejoindre l'aventure
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Visiter ICON SARL
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50">
                <div className="text-center">
                  <h4 className="font-semibold text-heading-md">🇨🇩</h4>
                  <p className="text-sm text-muted-foreground">Made in Congo</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-heading-md">💻</h4>
                  <p className="text-sm text-muted-foreground">Innovation Tech</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-heading-md">🚀</h4>
                  <p className="text-sm text-muted-foreground">Impact Social</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <ModernFooter />
    </div>
  );
};

export default About;