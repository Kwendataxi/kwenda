import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Car, Package, Store, Users, Star, Shield, Zap, Globe, CheckCircle, ArrowRight, MapPin, Clock, CreditCard } from 'lucide-react';
import kwendaLogo from '@/assets/kwenda-logo.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={kwendaLogo} 
                alt="Kwenda Taxi Logo" 
                className="h-12 w-auto"
              />
            </div>
            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
              Congo RDC
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Nouveau à Kinshasa
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Transport Intelligent
                  <span className="bg-gradient-primary bg-clip-text text-transparent"> à Kinshasa</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Découvrez Kwenda Taxi - la nouvelle application de transport, livraison et marketplace 
                  conçue spécialement pour les habitants de Kinshasa.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 w-full sm:w-auto">
                    <Car className="w-5 h-5 mr-2" />
                    Commander maintenant
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5 w-full sm:w-auto">
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                </Link>
                <Link to="/partner">
                  <Button variant="outline" size="sm" className="w-full">
                    <Store className="w-4 h-4 mr-1" />
                    Partenaire
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary fill-current" />
                  <span className="text-sm font-medium">4.9/5</span>
                  <span className="text-xs text-muted-foreground">2k+ avis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Flotte en croissance</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden">
                <img 
                  src="/placeholder.svg" 
                  alt="Kwenda Taxi App Interface"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-primary rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-secondary rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Trois services en une seule app
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kwenda Taxi révolutionne le transport à Kinshasa avec une plateforme complète
              pour tous vos besoins de mobilité et de commerce.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-primary">Transport VTC</CardTitle>
                <CardDescription>
                  Course en voiture ou moto dans toute la ville de Kinshasa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Moto-taxi - Rapide et économique</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Taxi voiture - Confort 4 places</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Taxi-bus - Transport collectif</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Bus Transco - Service public</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-secondary/10 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-light rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-secondary">Livraison</CardTitle>
                <CardDescription>
                  Service de livraison pour tous types de colis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Livraison Flash - Moto</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Livraison Cargo - Camion</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Assistant de chargement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Suivi temps réel</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/10 hover:border-accent/30 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-light rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-accent">Marketplace</CardTitle>
                <CardDescription>
                  Achetez et vendez en toute sécurité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Électronique & High-tech</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Mode & Vêtements</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Maison & Jardin</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Paiement sécurisé</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi choisir Kwenda Taxi ?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une application pensée pour les spécificités de Kinshasa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Géolocalisation précise</h4>
              <p className="text-sm text-muted-foreground">Navigation optimisée pour Kinshasa</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="font-semibold">Disponible 24h/24</h4>
              <p className="text-sm text-muted-foreground">Service continu jour et nuit</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-semibold">KwendaPay & Mobile Money</h4>
              <p className="text-sm text-muted-foreground">Airtel Money, Orange Money, M-Pesa</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Sécurisé</h4>
              <p className="text-sm text-muted-foreground">Chauffeurs vérifiés et assurés</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Prêt à découvrir Kwenda Taxi ?
          </h3>
           <p className="text-white/90 mb-8 max-w-2xl mx-auto">
             Rejoignez notre communauté grandissante d'utilisateurs qui choisissent Kwenda Taxi 
             pour leurs déplacements à Kinshasa.
           </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Car className="w-5 h-5 mr-2" />
                Commencer comme client
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Users className="w-5 h-5 mr-2" />
                Devenir partenaire chauffeur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={kwendaLogo} 
                  alt="Kwenda Taxi Logo" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                L'application de transport intelligent pour Kinshasa
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Transport VTC</li>
                <li>Livraison de colis</li>
                <li>Marketplace</li>
                <li>Partenaire chauffeur</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Centre d'aide</li>
                <li>Nous contacter</li>
                <li>Conditions d'utilisation</li>
                <li>Politique de confidentialité</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Congo RDC</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Kinshasa</li>
                <li>Disponible bientôt dans d'autres villes</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Kwenda Taxi. Tous droits réservés. Conçu pour Kinshasa, Congo RDC.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;