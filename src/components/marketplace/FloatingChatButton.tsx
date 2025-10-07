import React, { useState } from 'react';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FloatingChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-full max-w-md">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center"
            >
              ×
            </button>
            <AIAssistantWidget context="marketplace" />
          </div>
        </div>
      )}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "group relative h-12 w-12 rounded-full",
              "bg-card/80 backdrop-blur-xl border border-border/50",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 hover:scale-105",
              "flex items-center justify-center"
            )}
            aria-label="Ouvrir l'assistant IA Kwenda"
          >
            <Bot className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
          </button>
        </div>
      )}
    </>
  );
};