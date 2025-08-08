import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Shield, AlertTriangle } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const Terms = () => {
  const sections = [
    {
      title: "1. Définitions et champ d'application",
      content: [
        "Kwenda Taxi désigne la plateforme numérique de services de transport, livraison et marketplace opérée par Kwenda Taxi SARL.",
        "L'Utilisateur désigne toute personne physique ou morale utilisant les services de la plateforme.",
        "Le Chauffeur-Partenaire désigne tout prestataire de services de transport agréé par Kwenda Taxi.",
        "Les présentes conditions s'appliquent à tous les services proposés via l'application mobile et le site web."
      ]
    },
    {
      title: "2. Services proposés",
      content: [
        "Transport VTC : Réservation de véhicules de tourisme avec chauffeur (moto-taxi, taxi-voiture, taxi-bus).",
        "Livraison : Services de livraison express (flash) et cargo dans la zone de Kinshasa.",
        "Marketplace : Plateforme de vente en ligne entre particuliers et professionnels.",
        "KwendaPay : Portefeuille électronique pour les paiements sur la plateforme.",
        "Kwenda Tombola : Système de loterie intégré avec des tirages réguliers."
      ]
    },
    {
      title: "3. Inscription et compte utilisateur",
      content: [
        "L'inscription nécessite la fourniture d'informations exactes et à jour.",
        "Chaque utilisateur ne peut créer qu'un seul compte personnel.",
        "L'utilisateur est responsable de la confidentialité de ses identifiants.",
        "Kwenda Taxi se réserve le droit de suspendre tout compte en cas de violation des présentes conditions."
      ]
    },
    {
      title: "4. Utilisation de la plateforme",
      content: [
        "Les services sont destinés à un usage personnel et non commercial (sauf autorisation expresse).",
        "Il est interdit d'utiliser la plateforme pour des activités illégales ou contraires aux bonnes mœurs.",
        "L'utilisateur s'engage à respecter les chauffeurs-partenaires et les autres utilisateurs.",
        "Toute manipulation du système de notation ou des prix est strictement interdite."
      ]
    },
    {
      title: "5. Tarification et paiement",
      content: [
        "Les tarifs sont affichés avant validation de la commande et incluent les taxes applicables.",
        "Le paiement s'effectue via KwendaPay, rechargeable par Mobile Money (Airtel, Orange, M-Pesa).",
        "Des frais de service peuvent s'appliquer selon le type de prestation.",
        "En cas de litige sur la facturation, l'utilisateur dispose de 7 jours pour contester."
      ]
    },
    {
      title: "6. Responsabilités",
      content: [
        "Kwenda Taxi agit en qualité d'intermédiaire technologique entre utilisateurs et chauffeurs-partenaires.",
        "Les chauffeurs-partenaires sont responsables de la prestation de transport et de la sécurité des passagers.",
        "Kwenda Taxi ne saurait être tenu responsable des dommages résultant d'un usage inapproprié de la plateforme.",
        "L'utilisateur s'engage à respecter le matériel et les véhicules mis à disposition."
      ]
    },
    {
      title: "7. Protection des données",
      content: [
        "Kwenda Taxi s'engage à protéger les données personnelles conformément à sa politique de confidentialité.",
        "Les données de géolocalisation ne sont utilisées que pour l'optimisation des services.",
        "L'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.",
        "Aucune donnée n'est cédée à des tiers sans consentement explicite."
      ]
    },
    {
      title: "8. Marketplace et transactions",
      content: [
        "Les vendeurs sont responsables de la légalité et de la qualité des produits proposés.",
        "Kwenda Taxi propose un système de garantie via le portefeuille sécurisé (escrow).",
        "Les litiges entre acheteurs et vendeurs sont traités par notre service de médiation.",
        "Les produits interdits incluent les armes, drogues, contrefaçons et contenus illégaux."
      ]
    },
    {
      title: "9. Suspension et résiliation",
      content: [
        "Kwenda Taxi peut suspendre un compte en cas de non-respect des présentes conditions.",
        "L'utilisateur peut résilier son compte à tout moment via les paramètres de l'application.",
        "En cas de résiliation, le solde KwendaPay restant est remboursable sous 30 jours.",
        "Certaines restrictions peuvent s'appliquer en cas de litiges en cours."
      ]
    },
    {
      title: "10. Droit applicable et juridiction",
      content: [
        "Les présentes conditions sont régies par le droit congolais (RDC).",
        "Tout litige sera soumis à la juridiction des tribunaux de Kinshasa.",
        "En cas de différend, une médiation amiable sera privilégiée avant tout recours judiciaire.",
        "Les présentes conditions prévalent sur toute autre condition générale."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <Badge variant="secondary" className="mb-4">
            <FileText className="w-4 h-4 mr-2" />
            Conditions d'utilisation
          </Badge>
          <h1 className="text-display-lg">Conditions Générales d'Utilisation</h1>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Les présentes conditions régissent votre utilisation de la plateforme Kwenda Taxi. 
            Veuillez les lire attentivement avant d'utiliser nos services.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Dernière mise à jour : 15 janvier 2024</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Version 2.1</span>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Information importante</h3>
                <p className="text-sm text-amber-800">
                  En utilisant Kwenda Taxi, vous acceptez ces conditions dans leur intégralité. 
                  Si vous n'acceptez pas ces termes, veuillez ne pas utiliser nos services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-heading-sm">Sommaire</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-6 pt-0">
                    {sections.map((section, index) => (
                      <a
                        key={index}
                        href={`#section-${index + 1}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded hover:bg-muted/50"
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Terms Sections */}
          <div className="lg:col-span-3 space-y-8">
            {sections.map((section, index) => (
              <Card key={index} id={`section-${index + 1}`}>
                <CardHeader>
                  <CardTitle className="text-heading-md">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.content.map((paragraph, idx) => (
                    <p key={idx} className="text-body-md text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Developer Credit */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Plateforme développée par{" "}
              <a 
                href="https://icon-sarl.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                ICON SARL
              </a>
              {" "}• Conforme au droit congolais (RDC)
            </p>
          </CardContent>
        </Card>
      </main>

      <ModernFooter />
    </div>
  );
};

export default Terms;