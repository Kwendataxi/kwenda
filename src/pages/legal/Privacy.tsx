import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const Privacy = () => {
  const dataTypes = [
    {
      icon: <UserCheck className="w-5 h-5" />,
      title: "Données d'identification",
      description: "Nom, prénom, email, téléphone, photo de profil",
      purpose: "Création et gestion de votre compte"
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Données de géolocalisation",
      description: "Position GPS, adresses fréquentes, trajets",
      purpose: "Optimisation des services de transport et livraison"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Données financières",
      description: "Historique KwendaPay, méthodes de paiement",
      purpose: "Traitement des paiements et prévention de la fraude"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Données d'usage",
      description: "Navigation app, préférences, évaluations",
      purpose: "Amélioration de l'expérience utilisateur"
    }
  ];

  const rights = [
    "Droit d'accès à vos données personnelles",
    "Droit de rectification des informations inexactes",
    "Droit à l'effacement (droit à l'oubli)",
    "Droit à la portabilité de vos données",
    "Droit d'opposition au traitement",
    "Droit de limitation du traitement"
  ];

  const securityMeasures = [
    "Chiffrement des données sensibles",
    "Authentification à deux facteurs",
    "Audits de sécurité réguliers",
    "Accès limité aux données par nos équipes",
    "Sauvegarde sécurisée des données",
    "Surveillance continue des accès"
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <Badge variant="secondary" className="mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Politique de confidentialité
          </Badge>
          <h1 className="text-display-lg">Protection de vos données personnelles</h1>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Chez Kwenda Taxi, nous prenons la protection de votre vie privée très au sérieux. 
            Cette politique explique comment nous collectons, utilisons et protégeons vos données.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Dernière mise à jour : 15 janvier 2024</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Conforme RGPD</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-heading-sm">Navigation rapide</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-6 pt-0">
                    {[
                      "Types de données collectées",
                      "Utilisation des données",
                      "Partage des données",
                      "Vos droits",
                      "Sécurité des données",
                      "Conservation des données",
                      "Cookies et technologies",
                      "Contact"
                    ].map((item, index) => (
                      <a
                        key={index}
                        href={`#section-${index + 1}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded hover:bg-muted/50"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Data Types */}
            <Card id="section-1">
              <CardHeader>
                <CardTitle className="text-heading-md">1. Types de données collectées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-body-md text-muted-foreground">
                  Nous collectons différents types de données pour vous fournir le meilleur service possible :
                </p>
                
                <div className="grid gap-4">
                  {dataTypes.map((type, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-body-lg">{type.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                        <p className="text-xs font-medium text-primary">{type.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card id="section-2">
              <CardHeader>
                <CardTitle className="text-heading-md">2. Utilisation des données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Vos données sont utilisées uniquement pour :
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Fournir nos services de transport, livraison et marketplace</li>
                  <li>• Traiter vos paiements et gérer votre portefeuille KwendaPay</li>
                  <li>• Vous mettre en relation avec les chauffeurs-partenaires</li>
                  <li>• Améliorer la sécurité et prévenir les fraudes</li>
                  <li>• Personnaliser votre expérience utilisateur</li>
                  <li>• Vous envoyer des notifications importantes</li>
                  <li>• Respecter nos obligations légales</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card id="section-3">
              <CardHeader>
                <CardTitle className="text-heading-md">3. Partage des données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement :
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Avec les chauffeurs-partenaires (uniquement les informations nécessaires au service)</li>
                  <li>• Avec les vendeurs marketplace (pour les commandes)</li>
                  <li>• Avec nos prestataires techniques (hébergement, paiement)</li>
                  <li>• Avec les autorités sur réquisition judiciaire</li>
                  <li>• En cas de fusion ou acquisition (avec votre consentement)</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card id="section-4">
              <CardHeader>
                <CardTitle className="text-heading-md">4. Vos droits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Conformément à la réglementation, vous disposez des droits suivants :
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {rights.map((right, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{right}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Pour exercer ces droits, contactez-nous à : privacy@kwenda.cd
                </p>
              </CardContent>
            </Card>

            {/* Security */}
            <Card id="section-5">
              <CardHeader>
                <CardTitle className="text-heading-md">5. Sécurité des données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Nous mettons en place des mesures de sécurité strictes :
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {securityMeasures.map((measure, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>{measure}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card id="section-6">
              <CardHeader>
                <CardTitle className="text-heading-md">6. Conservation des données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Nous conservons vos données uniquement le temps nécessaire :
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Données de compte : Tant que votre compte est actif + 3 ans</li>
                  <li>• Historique des courses : 7 ans (obligation comptable)</li>
                  <li>• Données de géolocalisation : 30 jours maximum</li>
                  <li>• Données marketplace : 10 ans (protection des consommateurs)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card id="section-8" className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-heading-md">8. Nous contacter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body-md text-muted-foreground">
                  Pour toute question concernant cette politique :
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email :</strong> privacy@kwenda.cd</p>
                  <p><strong>Téléphone :</strong> +243 XXX XXX XXX</p>
                  <p><strong>Adresse :</strong> Kinshasa, République Démocratique du Congo</p>
                </div>
                
                <Separator />
                
                <p className="text-xs text-muted-foreground">
                  Développé par{" "}
                  <a 
                    href="https://icon-sarl.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ICON SARL
                  </a>
                  {" "}• Conforme aux réglementations congolaises et internationales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ModernFooter />
    </div>
  );
};

export default Privacy;