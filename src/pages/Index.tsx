import React from 'react';
import ModernHero from '@/components/landing/ModernHero';
import InteractiveServicesGrid from '@/components/landing/InteractiveServicesGrid';
import AdvancedFeatures from '@/components/landing/AdvancedFeatures';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import ModernFooter from '@/components/landing/ModernFooter';
import CongoColorShowcase from '@/components/demo/CongoColorShowcase';
import { DarkModeShowcase } from '@/components/demo/DarkModeShowcase';
import { VoiceConversationInterface } from '@/components/ai/VoiceConversationInterface';
import { SmartAnalytics } from '@/components/ai/SmartAnalytics';




const Index = () => {
  // Temporary Congo color demo - remove in production
  const showCongoDemo = window.location.search.includes('congo-demo');
  const showDarkModeDemo = window.location.search.includes('dark-mode-demo');
  const showAIDemo = window.location.search.includes('ai-demo');
  
  if (showCongoDemo) {
    return <CongoColorShowcase />;
  }

  if (showDarkModeDemo) {
    return <DarkModeShowcase />;
  }

  if (showAIDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              KwendaGo AI Assistant Demo
            </h1>
            <p className="text-lg text-muted-foreground">
              Assistant conversationnel avec GPT-4o Vision + ElevenLabs Turbo
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <VoiceConversationInterface context="transport" />
            <SmartAnalytics context="general" timeframe="daily" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <ModernHero />
      <InteractiveServicesGrid />
      
      <AdvancedFeatures />
      <CTASection />
      <ModernFooter />
    </div>
  );
};

export default Index;