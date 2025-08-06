import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';

interface FinancialUpdate {
  type: 'commission' | 'credit_transaction' | 'wallet_update';
  amount: number;
  currency: string;
  timestamp: string;
  metadata: any;
}

interface UseRealtimeFinancialUpdatesReturn {
  updates: FinancialUpdate[];
  totalCommissions: number;
  totalCredits: number;
  isConnected: boolean;
  clearUpdates: () => void;
}

export const useRealtimeFinancialUpdates = (): UseRealtimeFinancialUpdatesReturn => {
  const { user } = useAuth();
  const { hasPermission } = useUserRoles();
  const [updates, setUpdates] = useState<FinancialUpdate[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id || !hasPermission('finance_read')) return;

    const channel = supabase
      .channel('financial-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: 'description.ilike.*commission*'
        },
        (payload) => {
          handleCommissionUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions'
        },
        (payload) => {
          handleCreditUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_credits'
        },
        (payload) => {
          handleDriverCreditUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, hasPermission]);

  const handleCommissionUpdate = (record: any) => {
    const update: FinancialUpdate = {
      type: 'commission',
      amount: parseFloat(record.amount),
      currency: record.currency || 'CDF',
      timestamp: record.created_at,
      metadata: {
        transactionId: record.id,
        userId: record.user_id,
        description: record.description,
        referenceType: record.reference_type,
        referenceId: record.reference_id
      }
    };

    setUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
    setTotalCommissions(prev => prev + update.amount);
  };

  const handleCreditUpdate = (record: any) => {
    const update: FinancialUpdate = {
      type: 'credit_transaction',
      amount: parseFloat(record.amount),
      currency: record.currency || 'CDF',
      timestamp: record.created_at,
      metadata: {
        transactionId: record.id,
        driverId: record.driver_id,
        transactionType: record.transaction_type,
        description: record.description,
        balanceBefore: record.balance_before,
        balanceAfter: record.balance_after
      }
    };

    setUpdates(prev => [update, ...prev.slice(0, 99)]);
    
    if (record.transaction_type === 'credit') {
      setTotalCredits(prev => prev + update.amount);
    } else if (record.transaction_type === 'debit') {
      setTotalCredits(prev => prev - update.amount);
    }
  };

  const handleDriverCreditUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && oldRecord && newRecord) {
      const balanceChange = parseFloat(newRecord.balance) - parseFloat(oldRecord.balance);
      
      if (Math.abs(balanceChange) > 0) {
        const update: FinancialUpdate = {
          type: 'wallet_update',
          amount: balanceChange,
          currency: newRecord.currency || 'CDF',
          timestamp: newRecord.updated_at,
          metadata: {
            driverId: newRecord.driver_id,
            balanceChange,
            newBalance: newRecord.balance,
            oldBalance: oldRecord.balance
          }
        };

        setUpdates(prev => [update, ...prev.slice(0, 99)]);
      }
    }
  };

  const clearUpdates = () => {
    setUpdates([]);
    setTotalCommissions(0);
    setTotalCredits(0);
  };

  return {
    updates,
    totalCommissions,
    totalCredits,
    isConnected,
    clearUpdates
  };
};