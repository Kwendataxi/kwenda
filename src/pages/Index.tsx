import React from 'react';
import ModernHero from '@/components/landing/ModernHero';
import InteractiveServicesGrid from '@/components/landing/InteractiveServicesGrid';
import AdvancedFeatures from '@/components/landing/AdvancedFeatures';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import ModernFooter from '@/components/landing/ModernFooter';

const Index = () => {
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