import React from 'react';
import { PushNotificationToast, PushNotificationToastData } from './PushNotificationToast';

interface NotificationToastContainerProps {
  toasts: PushNotificationToastData[];
  onClose: (id: string) => void;
  onAction?: (id: string, url?: string) => void;
  maxVisible?: number;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onClose,
  onAction,
  maxVisible = 3
}) => {
  // Trier par priorité et timestamp
  const sortedToasts = [...toasts].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });

  // Ne montrer que les N premiers
  const visibleToasts = sortedToasts.slice(0, maxVisible);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {/* Safe area top padding pour mobile */}
      <div className="pt-safe" />
      
      {visibleToasts.map((toast, index) => (
        <PushNotificationToast
          key={toast.id}
          {...toast}
          index={index}
          onClose={onClose}
          onAction={onAction}
        />
      ))}

      {/* Indicateur si plus de notifications en queue */}
      {toasts.length > maxVisible && (
        <div className="fixed top-[340px] left-1/2 -translate-x-1/2 z-[199] pointer-events-none">
          <div className="bg-muted/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground border border-border shadow-lg">
            +{toasts.length - maxVisible} autre{toasts.length - maxVisible > 1 ? 's' : ''} notification{toasts.length - maxVisible > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};
