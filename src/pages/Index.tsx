import React from 'react';
import ModernHero from '@/components/landing/ModernHero';
import InteractiveServicesGrid from '@/components/landing/InteractiveServicesGrid';
import AdvancedFeatures from '@/components/landing/AdvancedFeatures';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import ModernFooter from '@/components/landing/ModernFooter';
import CongoColorShowcase from '@/components/demo/CongoColorShowcase';
import { DarkModeShowcase } from '@/components/demo/DarkModeShowcase';
import { TestFixMessage } from '@/components/navigation/TestFixMessage';
import { HeaderThemeToggle } from '@/components/navigation/HeaderThemeToggle';
import { ThemeToggleSection } from '@/components/landing/ThemeToggleSection';

const Index = () => {
  // Temporary Congo color demo - remove in production
  const showCongoDemo = window.location.search.includes('congo-demo');
  const showDarkModeDemo = window.location.search.includes('dark-mode-demo');
  
  if (showCongoDemo) {
    return <CongoColorShowcase />;
  }

  if (showDarkModeDemo) {
    return <DarkModeShowcase />;
  }

  return (
    <div className="min-h-screen">
      <HeaderThemeToggle />
      <TestFixMessage />
      <ModernHero />
      <InteractiveServicesGrid />
      <ThemeToggleSection />
      <AdvancedFeatures />
      <CTASection />
      <ModernFooter />
    </div>
  );
};

export default Index;