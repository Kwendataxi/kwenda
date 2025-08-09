import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
import PackageTypeSelector from './PackageTypeSelector';
import { Package, Clock, Truck } from 'lucide-react';

interface DeliveryHomeProps {
  onCancel: () => void;
  onContinue: (mode: 'flash' | 'flex' | 'maxicharge', selectedPackageId?: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const modes: Array<{ id: 'flash' | 'flex' | 'maxicharge'; title: string; desc: string; icon: string; tag?: string }> = [
  { id: 'flash', title: 'Flash', desc: 'Le plus rapide (moto)', icon: '🏍️', tag: 'Express' },
  { id: 'flex', title: 'Flex', desc: 'Équilibré et économique', icon: '🚗', tag: 'Populaire' },
  { id: 'maxicharge', title: 'MaxiCharge', desc: 'Gros colis et volumineux', icon: '🚛' },
];

const DeliveryHome: React.FC<DeliveryHomeProps> = ({ onCancel, onContinue, activeTab = 'home', onTabChange = () => {} }) => {
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge' | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Livraison</h1>
            <p className="text-sm opacity-90">Choisissez le mode et le type de colis</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-primary-foreground">✕</Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-5 pb-24">
        {/* Modes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Mode de livraison</span>
            <span className="text-xs text-primary-foreground/80 bg-primary/30 px-2 py-0.5 rounded">
              Temps réel <Clock className="inline w-3 h-3 ml-1" />
            </span>
          </div>

          {modes.map(m => (
            <Card
              key={m.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedMode === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedMode(m.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{m.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{m.title}</h3>
                      {m.tag && <Badge variant="secondary" className="text-xs">{m.tag}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <Truck className="w-4 h-4 inline mr-1" />
                  {m.id === 'flash' ? 'Moto' : m.id === 'flex' ? 'Voiture' : 'Camion'}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Package selector */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground flex items-center gap-2"><Package className="w-4 h-4" /> Type de colis</span>
          <PackageTypeSelector
            selectedPackageId={selectedPackageId}
            onPackageSelect={(pkg) => setSelectedPackageId(pkg.id)}
          />
        </div>

        {/* Promo banner */}
        <Card className="p-4 bg-muted/40">
          <div className="text-sm text-muted-foreground">
            Astuce: Les livraisons Flex offrent le meilleur rapport prix/temps en heures de pointe.
          </div>
        </Card>
      </div>

      {/* Bottom action */}
      <div className="p-4 border-t bg-background">
        <Button
          className="w-full"
          size="lg"
          disabled={!selectedMode}
          onClick={() => selectedMode && onContinue(selectedMode, selectedPackageId)}
        >
          {selectedMode ? 'Continuer' : 'Sélectionnez un mode'}
        </Button>
      </div>

      {/* Bottom nav */}
      <ModernBottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default DeliveryHome;
