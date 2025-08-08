import React from 'react';
import { DriverDeliveryDashboard } from '@/components/driver/DriverDeliveryDashboard';

const DriverApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <DriverDeliveryDashboard />
      </div>
    </div>
  );
};

export default DriverApp;