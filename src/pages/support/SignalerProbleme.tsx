import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageCircle, Camera, FileText, Clock, Shield, Phone, Mail } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { Link } from 'react-router-dom';

const SignalerProbleme = () => {
  const problemTypes = [
    {
      type: "Problème de course",
      icon: <AlertTriangle className="w-6 h-6" />,
      examples: ["Chauffeur ne répond pas", "Véhicule différent", "Trajet incorrect", "Prix incorrect"],
      urgency: "Normale",
      response: "2-4 heures"
    },
    {
      type: "Problème de livraison",
      icon: <AlertTriangle className="w-6 h-6" />,
      examples: ["Colis non livré", "Colis endommagé", "Livreur non professionnel", "Retard important"],
      urgency: "Normale",
      response: "1-2 heures"
    },
    {
      type: "Problème de paiement",
      icon: <AlertTriangle className="w-6 h-6" />,
      examples: ["Double facturation", "Paiement non passé", "Remboursement", "Erreur de tarif"],
      urgency: "Élevée",
      response: "30 minutes"
    },
    {
      type: "Urgence/Sécurité",
      icon: <Shield className="w-6 h-6" />,
      examples: ["Accident", "Comportement inapproprié", "Vol/Agression", "Urgence médicale"],
      urgency: "Critique",
      response: "Immédiat"
    }
  ];

  const reportingSteps = [
    {
      step: "1",
      title: "Type de problème",
      description: "Sélectionnez la catégorie de votre problème",
      icon: <FileText className="w-5 h-5" />
    },
    {
      step: "2", 
      title: "Détails",
      description: "Décrivez précisément ce qui s'est passé",
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      step: "3",
      title: "Preuves",
      description: "Ajoutez photos, captures d'écran si possible",
      icon: <Camera className="w-5 h-5" />
    },
    {
      step: "4",
      title: "Suivi",
      description: "Recevez les mises à jour par notifications",
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const emergencyContacts = [
    {
      service: "Urgence Kwenda",
      number: "08 58 04 04 00",
      description: "Support prioritaire 24h/24",
      availability: "24h/24, 7j/7"
    },
    {
      service: "Police Nationale",
      number: "112",
      description: "Urgences sécuritaires",
      availability: "24h/24, 7j/7"
    },
    {
      service: "Ambulance",
      number: "114",
      description: "Urgences médicales",
      availability: "24h/24, 7j/7"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-red-500/10 to-orange-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Signaler un Problème
            </Badge>
            <h1 className="text-display-lg">
              Nous sommes là pour <span className="text-red-600">résoudre</span> vos problèmes
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Signalez tout problème rencontré avec nos services. Notre équipe s'engage à traiter 
              rapidement votre demande et à trouver une solution satisfaisante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <Link to="/auth">Signaler via l'app</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:0858040400">Appeler maintenant</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="py-4 bg-red-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-center">
            <Shield className="w-6 h-6" />
            <p className="font-semibold">
              En cas d'urgence ou de danger immédiat, appelez le{" "}
              <a href="tel:0858040400" className="underline font-bold">08 58 04 04 00</a>
            </p>
          </div>
        </div>
      </section>

      {/* Problem Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Types de problèmes</h2>
            <p className="text-body-md text-muted-foreground">
              Choisissez la catégorie qui correspond à votre situation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problemTypes.map((problem, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-red-600">{problem.icon}</div>
                    <Badge variant={problem.urgency === "Critique" ? "destructive" : "outline"}>
                      {problem.urgency}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{problem.type}</CardTitle>
                  <CardDescription>Réponse: {problem.response}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Exemples :</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {problem.examples.map((example, idx) => (
                        <li key={idx}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant={problem.urgency === "Critique" ? "destructive" : "default"}
                    asChild
                  >
                    <Link to="/auth">Signaler</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting Process */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment signaler un problème</h2>
            <p className="text-body-md text-muted-foreground">
              Processus simple en 4 étapes pour un traitement rapide
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {reportingSteps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {step.step}
                </div>
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto text-red-600">
                  {step.icon}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips for Effective Reporting */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Conseils pour un signalement efficace</h2>
            <p className="text-body-md text-muted-foreground">
              Aidez-nous à mieux vous aider en suivant ces recommandations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Soyez précis
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Indiquez date et heure exactes</li>
                  <li>• Mentionnez le numéro de course/commande</li>
                  <li>• Décrivez les faits chronologiquement</li>
                  <li>• Évitez les jugements personnels</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-600" />
                  Fournissez des preuves
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Photos du problème si applicable</li>
                  <li>• Captures d'écran de l'app</li>
                  <li>• Reçus ou factures</li>
                  <li>• Messages échangés avec le chauffeur</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  Restez disponible
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Activez les notifications</li>
                  <li>• Répondez rapidement à nos questions</li>
                  <li>• Gardez votre téléphone accessible</li>
                  <li>• Suivez l'évolution de votre dossier</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Contacts d'urgence</h2>
            <p className="text-body-md text-muted-foreground">
              En cas de situation critique, contactez immédiatement ces numéros
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {emergencyContacts.map((contact, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Phone className="w-8 h-8 text-red-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{contact.service}</h3>
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    <a href={`tel:${contact.number.replace(/\s/g, '')}`} className="hover:underline">
                      {contact.number}
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{contact.description}</p>
                  <p className="text-xs text-muted-foreground">{contact.availability}</p>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    asChild
                  >
                    <a href={`tel:${contact.number.replace(/\s/g, '')}`}>Appeler</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resolution Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-500/5 to-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Processus de résolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🔍 Investigation</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Analyse approfondie de votre signalement</li>
                      <li>• Vérification des données de la course</li>
                      <li>• Contact avec le chauffeur/livreur</li>
                      <li>• Examen des preuves fournies</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">⚖️ Résolution</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Remboursement si justifié</li>
                      <li>• Mesures correctives pour le prestataire</li>
                      <li>• Formation supplémentaire si nécessaire</li>
                      <li>• Suivi pour éviter la récidive</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">📊 Nos engagements</h4>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{'< 30min'}</p>
                      <p className="text-xs text-muted-foreground">Réponse urgences</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{'< 4h'}</p>
                      <p className="text-xs text-muted-foreground">Premiers retours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{'< 48h'}</p>
                      <p className="text-xs text-muted-foreground">Résolution standard</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">100%</p>
                      <p className="text-xs text-muted-foreground">Dossiers traités</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Autres moyens de nous contacter</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Chat en direct</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Support instantané dans l'app
                </p>
                <Button asChild>
                  <Link to="/auth">Ouvrir le chat</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Mail className="w-8 h-8 text-secondary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  contact@kwendataxi.com
                </p>
                <Button variant="outline" asChild>
                  <a href="mailto:contact@kwendataxi.com">Envoyer un email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Phone className="w-8 h-8 text-accent mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Téléphone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  08 58 04 04 00
                </p>
                <Button variant="outline" asChild>
                  <a href="tel:0858040400">Appeler</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Votre sécurité est notre priorité</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            N'hésitez jamais à nous signaler un problème. Notre équipe est formée pour vous aider rapidement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Signaler un problème</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-red-500">
              <a href="tel:0858040400">Appel d'urgence</a>
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default SignalerProbleme;