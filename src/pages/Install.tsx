import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Download, Smartphone, Zap, Wifi, Clock, 
  HardDrive, Shield, Share, Plus, MoreVertical,
  ArrowRight, Check
} from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Install = () => {
  const { platform, isInstalled, canInstall, install } = useInstallPrompt();
  const [showInstructions, setShowInstructions] = useState(false);
  const navigate = useNavigate();

  const handleInstall = async () => {
    if (platform === 'ios' || !canInstall) {
      setShowInstructions(true);
    } else {
      const success = await install();
      if (success) {
        setTimeout(() => navigate('/auth'), 1500);
      }
    }
  };

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lancement instantané",
      description: "Accédez à Kwenda en un clic depuis votre écran d'accueil"
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: "Fonctionne hors ligne",
      description: "Continuez à utiliser l'app même sans connexion internet"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Mises à jour automatiques",
      description: "Profitez toujours de la dernière version sans rien faire"
    },
    {
      icon: <HardDrive className="w-6 h-6" />,
      title: "Léger et rapide",
      description: "Seulement 2-5 MB contre 50-100 MB pour une app native"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurisé",
      description: "Connexion HTTPS sécurisée et stockage chiffré"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Multi-plateforme",
      description: "Fonctionne sur Android, iOS, Windows, Mac et Linux"
    }
  ];

  const faqs = [
    {
      question: "Qu'est-ce qu'une Progressive Web App (PWA) ?",
      answer: "Une PWA est une application web moderne qui offre une expérience similaire à une application native. Elle peut être installée sur votre appareil, fonctionne hors ligne et envoie des notifications push."
    },
    {
      question: "L'installation nécessite-t-elle un compte Google Play ou App Store ?",
      answer: "Non ! C'est l'un des principaux avantages. L'installation se fait directement depuis votre navigateur, sans passer par un store d'applications."
    },
    {
      question: "Combien d'espace l'application prend-elle ?",
      answer: "Kwenda PWA ne prend que 2-5 MB d'espace, contre 50-100 MB pour une application native typique. C'est jusqu'à 20 fois plus léger !"
    },
    {
      question: "L'application fonctionne-t-elle vraiment hors ligne ?",
      answer: "Oui ! Une fois installée, vous pouvez consulter vos courses récentes, vos adresses enregistrées et certaines fonctionnalités même sans connexion. La synchronisation se fait automatiquement quand vous vous reconnectez."
    },
    {
      question: "Quelle est la différence avec l'app native sur les stores ?",
      answer: "La PWA et l'app native offrent les mêmes fonctionnalités principales. En attendant la publication sur les stores, la PWA est la meilleure solution : installation immédiate, mises à jour automatiques et même expérience utilisateur."
    },
    {
      question: "Puis-je désinstaller l'application ?",
      answer: "Oui, comme toute application. Sur Android, maintenez l'icône appuyée et sélectionnez 'Désinstaller'. Sur iOS, maintenez l'icône et choisissez 'Supprimer l'app'."
    },
    {
      question: "Les données sont-elles sécurisées ?",
      answer: "Absolument ! Kwenda utilise le protocole HTTPS et chiffre toutes vos données. Vos informations personnelles et de paiement sont protégées selon les standards de sécurité les plus élevés."
    },
    {
      question: "L'app native sera-t-elle bientôt disponible ?",
      answer: "Nos applications natives pour Android et iOS sont actuellement en cours de validation sur les stores. En attendant, profitez de la PWA qui offre exactement les mêmes fonctionnalités !"
    }
  ];

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="bg-green-500/10 border-2 border-green-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              ✅ Kwenda est déjà installée !
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              L'application est accessible depuis votre écran d'accueil.
            </p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              Ouvrir l'application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              📱 Installation gratuite et instantanée
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Installez Kwenda Taxi
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Accédez à tous nos services de transport, livraison et marketplace 
              directement depuis votre écran d'accueil
            </p>

            {/* Platform Detection */}
            <Card className="bg-muted/50 border-primary/20 mb-6 max-w-md mx-auto">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Plateforme détectée : <strong className="text-foreground">
                    {platform === 'ios' ? '📱 iOS (iPhone/iPad)' : 
                     platform === 'android' ? '📱 Android' : 
                     '💻 Desktop'}
                  </strong>
                </p>
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow"
              onClick={handleInstall}
            >
              <Download className="w-6 h-6 mr-2" />
              Installer maintenant
            </Button>

            {platform === 'ios' && (
              <p className="text-sm text-muted-foreground mt-4">
                Sur iOS, suivez les instructions simples après avoir cliqué
              </p>
            )}
          </div>

          {/* Installation Instructions Preview */}
          <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                📖 Comment installer Kwenda ?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* iOS */}
                <div className="text-center space-y-3">
                  <div className="bg-background p-4 rounded-xl">
                    <Share className="w-8 h-8 mx-auto text-blue-500" />
                  </div>
                  <h3 className="font-semibold">Sur iOS</h3>
                  <p className="text-sm text-muted-foreground">
                    Safari → <Share className="inline w-4 h-4" /> Partager → "Sur l'écran d'accueil"
                  </p>
                </div>

                {/* Android */}
                <div className="text-center space-y-3">
                  <div className="bg-background p-4 rounded-xl">
                    <MoreVertical className="w-8 h-8 mx-auto text-green-500" />
                  </div>
                  <h3 className="font-semibold">Sur Android</h3>
                  <p className="text-sm text-muted-foreground">
                    Menu (⋮) → "Installer l'application" ou "Ajouter à l'écran d'accueil"
                  </p>
                </div>

                {/* Desktop */}
                <div className="text-center space-y-3">
                  <div className="bg-background p-4 rounded-xl">
                    <Plus className="w-8 h-8 mx-auto text-primary" />
                  </div>
                  <h3 className="font-semibold">Sur Desktop</h3>
                  <p className="text-sm text-muted-foreground">
                    Icône <Download className="inline w-4 h-4" /> dans la barre d'adresse → "Installer"
                  </p>
                </div>
              </div>

              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInstructions(true)}
                >
                  Voir les instructions détaillées
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            ⚡ Pourquoi installer Kwenda ?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 text-primary">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            ❓ Questions fréquentes
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-lg px-4">
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Native Apps Coming Soon */}
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-4">
                Applications natives en cours de validation
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Nos applications Android et iOS sont actuellement en cours de validation sur Google Play Store 
                et Apple App Store. En attendant, profitez de la Progressive Web App qui offre exactement 
                les mêmes fonctionnalités !
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="text-sm px-4 py-2">
                  ✅ Même interface
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  ✅ Mêmes fonctionnalités
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  ✅ Disponible immédiatement
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            🎉 Prêt à commencer ?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Installez Kwenda maintenant et profitez de tous nos services 
            de transport, livraison et marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
              onClick={handleInstall}
            >
              <Download className="w-6 h-6 mr-2" />
              Installer l'application
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => setShowInstructions(true)}
            >
              Voir les instructions
            </Button>
          </div>
        </div>
      </div>

      {/* Installation Instructions Modal */}
      <InstallPrompt 
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        platform={platform}
      />
    </div>
  );
};

export default Install;
