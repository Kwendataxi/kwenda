import React from 'react';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { Sparkles } from 'lucide-react';

interface MarketplaceAIChatProps {
  productId: string;
  productName: string;
  productPrice: number;
  sellerName: string;
  className?: string;
}

export const MarketplaceAIChat: React.FC<MarketplaceAIChatProps> = ({
  productId,
  productName,
  productPrice,
  sellerName,
  className = ''
}) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header personnalisé Kwenda AI */}
      <div className="shrink-0 p-3 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-ping" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Kwenda AI</h3>
            <p className="text-xs text-muted-foreground truncate">
              Assistant intelligent marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Widget AI intégré - Full height */}
      <div className="flex-1 overflow-hidden">
        <AIAssistantWidget
          context="marketplace"
          className="h-full border-0 shadow-none"
        />
      </div>
    </div>
  );
};
