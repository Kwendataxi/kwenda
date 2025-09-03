import React from 'react';
import ModernHero from '@/components/landing/ModernHero';
import InteractiveServicesGrid from '@/components/landing/InteractiveServicesGrid';
import AdvancedFeatures from '@/components/landing/AdvancedFeatures';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import ModernFooter from '@/components/landing/ModernFooter';
import CongoColorShowcase from '@/components/demo/CongoColorShowcase';

const Index = () => {
  // Temporary Congo color demo - remove in production
  const showCongoDemo = window.location.search.includes('congo-demo');
  
  if (showCongoDemo) {
    return <CongoColorShowcase />;
  }

  return (
    <div className="min-h-screen">
      <ModernHero />
      <InteractiveServicesGrid />
      <AdvancedFeatures />
      <TestimonialsSection />
      <CTASection />
      <ModernFooter />
    </div>
  );
};

export default Index;