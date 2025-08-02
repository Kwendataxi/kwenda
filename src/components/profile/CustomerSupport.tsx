import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageCircle, HelpCircle, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CustomerSupport = () => {
  const { toast } = useToast();
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  const handleSubmitTicket = () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ticket créé",
      description: "Votre demande a été envoyée. Nous vous répondrons sous 24h.",
    });

    setTicketForm({
      subject: '',
      category: '',
      priority: 'medium',
      description: '',
    });
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'Téléphone',
      value: '+243 123 456 789',
      description: 'Lun-Ven 8h-18h',
      available: true,
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'support@kwenda.cd',
      description: 'Réponse sous 24h',
      available: true,
    },
    {
      icon: MessageCircle,
      title: 'Chat en direct',
      value: 'Disponible maintenant',
      description: 'Réponse immédiate',
      available: false,
    },
  ];

  const faqItems = [
    {
      question: "Comment puis-je annuler ma course ?",
      answer: "Vous pouvez annuler votre course dans l'application jusqu'à 5 minutes après la réservation sans frais. Après ce délai, des frais d'annulation peuvent s'appliquer."
    },
    {
      question: "Comment fonctionne le paiement ?",
      answer: "Kwenda accepte les paiements via Mobile Money (Airtel, Orange, M-Pesa) et le portefeuille Kwenda Pay. Le paiement est automatique à la fin de chaque course."
    },
    {
      question: "Que faire si j'oublie quelque chose dans le véhicule ?",
      answer: "Contactez immédiatement le support via l'application. Nous vous mettrons en contact avec le chauffeur pour récupérer vos affaires."
    },
    {
      question: "Comment puis-je devenir chauffeur Kwenda ?",
      answer: "Visitez la section 'Travailler comme conducteur' dans votre profil pour débuter le processus d'inscription. Vous devrez fournir vos documents et passer une vérification."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui, nous utilisons un chiffrement de niveau bancaire pour protéger vos données personnelles et financières. Vos informations ne sont jamais partagées avec des tiers sans votre consentement."
    },
  ];

  const mockTickets = [
    {
      id: '001',
      subject: 'Problème de paiement',
      status: 'En cours',
      priority: 'high',
      date: '2024-01-15',
      category: 'Paiement'
    },
    {
      id: '002',
      subject: 'Course non effectuée',
      status: 'Résolu',
      priority: 'medium',
      date: '2024-01-12',
      category: 'Transport'
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En cours': return <Clock className="w-4 h-4" />;
      case 'Résolu': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Résolu': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Centre d'assistance</h2>
        <p className="text-muted-foreground">Nous sommes là pour vous aider</p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {contactMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <Card key={method.title} className={`hover:shadow-md transition-shadow ${!method.available ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 text-center">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  method.available ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <IconComponent className={`w-6 h-6 ${method.available ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm font-medium mb-1">{method.value}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
                {!method.available && (
                  <Badge variant="secondary" className="mt-2">Bientôt disponible</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Ticket Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Créer un ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Sujet *</Label>
              <Input
                id="subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Décrivez brièvement votre problème"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="payment">Paiement</SelectItem>
                    <SelectItem value="account">Compte</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre problème en détail..."
                rows={4}
              />
            </div>

            <Button onClick={handleSubmitTicket} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Envoyer le ticket
            </Button>
          </CardContent>
        </Card>

        {/* My Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Mes tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockTickets.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun ticket pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{ticket.subject}</h4>
                        <p className="text-sm text-muted-foreground">#{ticket.id} • {ticket.category}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{ticket.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};