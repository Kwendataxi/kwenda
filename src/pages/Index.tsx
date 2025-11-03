import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModernHeroSimplified from '@/components/landing/ModernHeroSimplified';
import InteractiveServicesGridLite from '@/components/landing/InteractiveServicesGridLite';
import SocialProofSection from '@/components/landing/SocialProofSection';
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
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Kwenda Taxi AI Assistant Demo
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
    <div className="min-h-screen pt-16 md:pt-20">
      <ModernHeroSimplified />
      <InteractiveServicesGridLite />
      <SocialProofSection />
      <ModernFooter />
    </div>
  );
};

export default Index;