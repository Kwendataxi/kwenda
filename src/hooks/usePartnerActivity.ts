import { useState, useEffect } from 'react';

export interface ActivityItem {
  id: string;
  description: string;
  time: string;
  type: 'driver' | 'vehicle' | 'commission' | 'booking';
}

export const usePartnerActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchActivities = async () => {
      setLoading(true);
      
      // Mock data - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          description: 'Nouveau chauffeur Jean Kouassi ajouté',
          time: '2h',
          type: 'driver'
        },
        {
          id: '2',
          description: 'Commission de 45,000 CDF versée',
          time: '4h',
          type: 'commission'
        },
        {
          id: '3',
          description: 'Véhicule ABC-123 maintenance programmée',
          time: '6h',
          type: 'vehicle'
        },
        {
          id: '4',
          description: '12 courses complétées aujourd\'hui',
          time: '8h',
          type: 'booking'
        },
        {
          id: '5',
          description: 'Marie Diallo a rejoint votre flotte',
          time: '1 jour',
          type: 'driver'
        }
      ];
      
      setActivities(mockActivities);
      setLoading(false);
    };

    fetchActivities();
  }, []);

  return { activities, loading };
};