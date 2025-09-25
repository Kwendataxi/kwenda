import { useState, useEffect } from 'react';

export interface PartnerStats {
  activeDrivers: number;
  ongoingRides: number;
  monthlyEarnings: number;
  totalVehicles: number;
  availableVehicles: number;
  utilizationRate: number;
  weeklyGrowth: number;
  totalCommissions: number;
  pendingWithdrawals: number;
}

export const usePartnerStats = () => {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      setLoading(true);
      
      // Mock data - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: PartnerStats = {
        activeDrivers: 12,
        ongoingRides: 8,
        monthlyEarnings: 2450000,
        totalVehicles: 15,
        availableVehicles: 11,
        utilizationRate: 85,
        weeklyGrowth: 15,
        totalCommissions: 245000,
        pendingWithdrawals: 45000
      };
      
      setStats(mockStats);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return { stats, loading };
};