import React from 'react';
import { motion } from 'framer-motion';
import { Car, Wallet, Gift, Shield } from 'lucide-react';

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: Car,
      title: 'Transport Immédiat',
      description: 'Course disponible en moins de 3 minutes, 24h/24 et 7j/7'
    },
    {
      icon: Wallet,
      title: 'Économies Garanties',
      description: 'Prix fixes et transparents, pas de surprises à l\'arrivée'
    },
    {
      icon: Gift,
      title: 'Tombola Gratuite',
      description: 'Gagne des crédits et des cadeaux à chaque course'
    },
    {
      icon: Shield,
      title: '100% Sécurisé',
      description: 'Paiement mobile money sécurisé et traçabilité totale'
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
