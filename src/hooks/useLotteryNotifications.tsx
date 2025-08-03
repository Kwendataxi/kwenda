import { useState, useCallback } from 'react';

interface LotteryNotification {
  id: string;
  show: boolean;
  ticketCount: number;
  sourceType: string;
  multiplier?: number;
}

export const useLotteryNotifications = () => {
  const [notifications, setNotifications] = useState<LotteryNotification[]>([]);

  const showNotification = useCallback((
    ticketCount: number,
    sourceType: string,
    multiplier: number = 1
  ) => {
    const id = `lottery-${Date.now()}-${Math.random()}`;
    const notification: LotteryNotification = {
      id,
      show: true,
      ticketCount,
      sourceType,
      multiplier
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove après 6 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);

    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, show: false } : n)
    );
    
    // Remove après animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAll
  };
};