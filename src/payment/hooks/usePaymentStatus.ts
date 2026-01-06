import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/core/storage/database';
import { getPreferences } from '@/core/storage/preferences';
import { 
  PaymentInfo, 
  PaymentStatus, 
  PaymentRegion,
  DEFAULT_PAYMENT_CONFIG,
  PaymentPhaseConfig
} from '../types/PaymentTypes';

const PAYMENT_KEY = 'user';

/**
 * Hook to manage payment status
 */
export const usePaymentStatus = () => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPaymentInfo = useCallback(async () => {
    try {
      const db = await getDatabase();
      const info = await db.get('payment', PAYMENT_KEY);
      
      if (info) {
        setPaymentInfo(info);
      } else {
        // Default to free status
        const prefs = await getPreferences();
        const region: PaymentRegion = prefs.country === 'IN' ? 'IN' : 'INTL';
        
        setPaymentInfo({
          status: 'free',
          region,
        });
      }
    } catch (error) {
      console.error('Failed to load payment info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentInfo();
  }, [loadPaymentInfo]);

  const updatePaymentStatus = async (updates: Partial<PaymentInfo>) => {
    const db = await getDatabase();
    const current = paymentInfo || { status: 'free' as PaymentStatus, region: 'INTL' as PaymentRegion };
    
    const updated: PaymentInfo = {
      ...current,
      ...updates,
    };
    
    await db.put('payment', { ...updated, id: PAYMENT_KEY } as PaymentInfo & { id: string });
    setPaymentInfo(updated);
    return updated;
  };

  const isPaid = paymentInfo?.status === 'paid' || paymentInfo?.status === 'subscription';
  const isFree = paymentInfo?.status === 'free';
  const isTrial = paymentInfo?.status === 'trial';

  return {
    paymentInfo,
    loading,
    reload: loadPaymentInfo,
    updatePaymentStatus,
    isPaid,
    isFree,
    isTrial,
  };
};

/**
 * Hook to get current payment phase config
 */
export const usePaymentPhase = () => {
  const [config, setConfig] = useState<PaymentPhaseConfig>(DEFAULT_PAYMENT_CONFIG);

  // In the future, this could fetch from a remote config
  useEffect(() => {
    // For now, use default config (free phase)
    setConfig(DEFAULT_PAYMENT_CONFIG);
  }, []);

  const isPaymentRequired = config.currentPhase !== 'free';
  const isOneTimePhase = config.currentPhase === 'one_time';
  const isSubscriptionPhase = config.currentPhase === 'subscription';

  return {
    config,
    isPaymentRequired,
    isOneTimePhase,
    isSubscriptionPhase,
  };
};
