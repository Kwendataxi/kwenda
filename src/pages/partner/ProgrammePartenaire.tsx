import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Car, Truck, DollarSign, Star, Shield, 
  Calendar, TrendingUp, Award, CheckCircle, 
  ArrowRight, MapPin, Clock, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import ModernFooter from "@/components/landing/ModernFooter";

const ProgrammePartenaire = () => {
  const partnerTypes = [
    {
      title: "Chauffeur Partenaire",
      icon: <Car className="w-8 h-8" />,
      description: "Rejoignez notre réseau de chauffeurs professionnels",
      earnings: "150 000 - 400 000 CDF/mois",
      requirements: ["Permis de conduire valide", "Véhicule en bon état", "Casier judiciaire vierge"],
      benefits: ["Revenus garantis", "Formation gratuite", "Assurance incluse", "Support 24/7"],
      gradient: "from-primary to-primary-glow",
      route: "/partners/devenir-chauffeur"
    },
    {
      title: "Propriétaire de Flotte",
      icon: <Truck className="w-8 h-8" />,
      description: "Louez vos véhicules et générez des revenus passifs",
      earnings: "50 000 - 150 000 CDF/véhicule/mois",
      requirements: ["Flotte de 3+ véhicules", "Documents légaux", "Entretien régulier"],
      benefits: ["Revenus passifs", "Gestion simplifiée", "Maintenance incluse", "Contrats flexibles"],
      gradient: "from-secondary to-accent",
      route: "/partners/louer-vehicule"
    },
    {
      title: "Livreur Express",
      icon: <Zap className="w-8 h-8" />,
      description: "Effectuez des livraisons rapides en moto",
      earnings: "80 000 - 250 000 CDF/mois",
      requirements: ["Moto en bon état", "Casque et équipements", "Connaissance de la ville"],
      benefits: ["Bonus de rapidité", "Horaires flexibles", "Carburant remboursé", "Équipements fournis"],
      gradient: "from-accent to-primary",
      route: "/partners/devenir-livreur"
    },
    {
      title: "Marchand Marketplace",
      icon: <Users className="w-8 h-8" />,
      description: "Vendez vos produits dans toute la RDC",
      earnings: "Commission de 8% seulement",
      requirements: ["Produits de qualité", "Stock disponible", "Service client"],
      benefits: ["Audience nationale", "Livraison intégrée", "Paiements sécurisés", "Marketing inclus"],
      gradient: "from-primary via-secondary to-accent",
      route: "/partners/vendre-en-ligne"
    }
  ];

  const cities = [
    { name: "Kinshasa", partners: "500+", earnings: "Jusqu'à 400K CDF/mois" },
    { name: "Lubumbashi", partners: "200+", earnings: "Jusqu'à 350K CDF/mois" },
    { name: "Kolwezi", partners: "100+", earnings: "Jusqu'à 300K CDF/mois" }
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Revenus Attractifs",
      description: "Gagnez plus que la concurrence avec nos tarifs avantageux"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Protection Complète",
      description: "Assurance, support juridique et protection sociale"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Formation Gratuite",
      description: "Programmes de formation continue et certification"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Flexibilité Totale",
      description: "Travaillez quand vous voulez, où vous voulez"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Croissance Garantie",
      description: "Opportunités d'évolution et de promotion interne"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Reconnaissance",
      description: "Système de récompenses et programme de fidélité"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl text-center relative z-10">
            <Badge variant="outline" className="border-white/30 text-white mb-6">
              🤝 Programme Partenaire Kwenda
            </Badge>
            <h1 className="text-display-lg mb-6">
              Rejoignez l'Écosystème
              <br />
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Kwenda Taxi
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Transformez votre passion du transport en une source de revenus stable. 
              Rejoignez plus de 800 partenaires dans les 3 plus grandes villes du Congo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Users className="w-5 h-5 mr-2" />
                Devenir Partenaire
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <MapPin className="w-5 h-5 mr-2" />
                Voir les Opportunités
              </Button>
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Choisissez Votre Voie
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Plusieurs opportunités s'offrent à vous selon vos moyens et objectifs
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              {partnerTypes.map((type, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${type.gradient} text-white group-hover:scale-110 transition-transform`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-heading-lg group-hover:text-primary transition-colors">
                          {type.title}
                        </CardTitle>
                        <p className="text-body-md text-muted-foreground">{type.description}</p>
                        <Badge variant="secondary" className="mt-2">
                          {type.earnings}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-heading-sm mb-3">Prérequis :</h4>
                      <div className="space-y-2">
                        {type.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-heading-sm mb-3">Avantages :</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {type.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-secondary" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link to={type.route}>
                      <Button className={`w-full bg-gradient-to-r ${type.gradient} hover:shadow-glow group-hover:scale-105 transition-all`}>
                        Postuler Maintenant
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cities Coverage */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4">Opportunités par Ville</h2>
              <p className="text-body-lg text-muted-foreground">
                Des revenus attractifs dans les 3 principales villes du Congo
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {cities.map((city, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-heading-lg mb-2">{city.name}</h3>
                    <p className="text-body-md text-muted-foreground mb-4">{city.partners} partenaires actifs</p>
                    <Badge variant="outline" className="text-primary border-primary">
                      {city.earnings}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4">Pourquoi Kwenda Taxi ?</h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Plus qu'un simple travail, rejoignez une famille de partenaires soutenus et valorisés
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <h3 className="text-heading-sm mb-3 group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-body-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-display-md mb-6">Prêt à Commencer ?</h2>
            <p className="text-xl mb-8 text-white/90">
              Rejoignez-nous dès aujourd'hui et commencez à générer des revenus dès la semaine prochaine
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Users className="w-5 h-5 mr-2" />
                  S'inscrire Maintenant
                </Button>
              </Link>
              <Link to="/support/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Clock className="w-5 h-5 mr-2" />
                  Nous Contacter
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default ProgrammePartenaire;