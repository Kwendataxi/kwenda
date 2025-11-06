import React from 'react';
import { EnhancedMarketplaceInterface } from '@/components/marketplace/EnhancedMarketplaceInterface';
import { useNavigate } from 'react-router-dom';

const MarketplacePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mobile-safe-layout">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto content-scrollable">
        <EnhancedMarketplaceInterface onNavigate={(path) => navigate('/')} />
      </main>
    </div>
  );
};

export default MarketplacePage;