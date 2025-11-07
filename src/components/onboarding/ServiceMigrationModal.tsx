/**
 * 🔀 PHASE 9: Modal de migration - Choix forcé taxi OU delivery
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Car, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ServiceMigrationModalProps {
  open: boolean;
  onComplete: (serviceType: 'taxi' | 'delivery') => void;
}

export const ServiceMigrationModal = ({ open, onComplete }: ServiceMigrationModalProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<'taxi' | 'delivery' | null>(null);
  const [loading, setLoading] = useState(false);

  const services = [
    {
      type: 'taxi' as const,
      icon: Car,
      emoji: '🚗',
      title: 'Chauffeur Taxi',
      description: 'Transport de passagers',
      gradient: 'from-blue-500 to-blue-600',
      features: [
        'Courses de passagers',
        'Tarification au kilomètre',
        'Zones urbaines principales',
        'Paiements instantanés'
      ],
      ideal: 'Idéal pour le transport de personnes'
    },
    {
      type: 'delivery' as const,
      icon: Package,
      emoji: '📦',
      title: 'Livreur Express',
      description: 'Livraison de colis',
      gradient: 'from-green-500 to-orange-500',
      features: [
        'Livraisons Flash/Flex/Maxicharge',
        'Colis et marchandises',
        'Livraisons marketplace',
        'Bonus par colis'
      ],
      ideal: 'Idéal pour la livraison rapide'
    }
  ];

  const handleConfirm = async () => {
    if (!selected || !user) return;

    setLoading(true);
    try {
      // 1. Mettre à jour driver_service_preferences
      const { error: prefError } = await supabase
        .from('driver_service_preferences')
        .upsert({
          driver_id: user.id,
          service_type: selected,
          is_active: true
        });

      if (prefError) throw prefError;

      // 2. Verrouiller dans chauffeurs (via fonction RPC ou laisser le trigger)
      // Note: locked_service_type sera synchronisé automatiquement par trigger DB
      
      // 3. Log l'activité
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'service_migration',
        description: `Service type migrated to ${selected}`,
        metadata: {
          service_type: selected,
          migration_date: new Date().toISOString()
        }
      });

      toast.success(
        selected === 'taxi' 
          ? '🚗 Vous êtes maintenant chauffeur taxi !' 
          : '📦 Vous êtes maintenant livreur express !'
      );

      onComplete(selected);
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Choisissez votre spécialité
          </DialogTitle>
        </DialogHeader>

        {/* Alerte */}
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-foreground mb-1">Choix unique et définitif</p>
              <p className="text-muted-foreground">
                Vous devez choisir entre chauffeur taxi OU livreur. 
                Ce choix est <strong>irrévocable</strong> et déterminera les types de commandes 
                que vous recevrez.
              </p>
            </div>
          </div>
        </Card>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all ${
                  selected === service.type
                    ? 'border-2 border-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelected(service.type)}
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-4xl">{service.emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Ideal for */}
                <div className={`p-3 rounded-lg bg-gradient-to-r ${service.gradient} bg-opacity-10`}>
                  <p className="text-xs text-center text-foreground font-medium">
                    {service.ideal}
                  </p>
                </div>

                {/* Selection indicator */}
                {selected === service.type && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                  >
                    <span className="text-white font-bold">✓</span>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Confirmation */}
        <div className="space-y-3">
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-muted">
                <p className="text-sm text-foreground text-center">
                  Vous avez sélectionné:{' '}
                  <strong className="text-primary">
                    {selected === 'taxi' ? '🚗 Chauffeur Taxi' : '📦 Livreur Express'}
                  </strong>
                </p>
              </Card>
            </motion.div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Confirmation en cours...
              </>
            ) : (
              'Confirmer mon choix'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            En confirmant, vous acceptez que ce choix soit définitif. 
            Contactez le support pour toute modification ultérieure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
