import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedMarketplaceInterface } from '@/components/marketplace/EnhancedMarketplaceInterface';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { TouchOptimizedButton } from '@/components/ui/touch-optimized';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { useNavigate } from 'react-router-dom';

const MarketplacePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 mobile-safe-layout">
      {/* Header */}
      <header className="sticky top-0 z-10 glassmorphism border-b border-border/20">
        <div className="responsive-padding">
          <ResponsiveContainer size="xl" padding="none">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center responsive-gap">
                <TouchOptimizedButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </TouchOptimizedButton>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-responsive-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Kwenda Marketplace
                  </h1>
                  <p className="text-responsive-sm text-muted-foreground hidden sm:block">Achetez et vendez en toute sécurité</p>
                </div>
              </div>
            </div>
          </ResponsiveContainer>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto content-scrollable">
        <EnhancedMarketplaceInterface onBack={() => navigate('/')} />
      </main>
    </div>
  );
};

export default MarketplacePage;