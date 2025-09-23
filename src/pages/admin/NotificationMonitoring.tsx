/**
 * Hook pour intégrer la page admin de monitoring des notifications
 */

import React from 'react';
import { NotificationMonitoringDashboard } from '@/components/admin/NotificationMonitoringDashboard';

export const AdminNotificationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <NotificationMonitoringDashboard />
    </div>
  );
};

export default AdminNotificationPage;