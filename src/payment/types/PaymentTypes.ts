// Payment Types for CHITRA
// Placeholder module for future payment integration

export type PaymentStatus = 'free' | 'trial' | 'paid' | 'subscription';

export type PaymentProvider = 'external' | 'google_play' | 'apple_store' | 'razorpay' | 'stripe';

export type PaymentRegion = 'IN' | 'INTL';

export interface PricingConfig {
  IN: {
    oneTime: number;
    currency: string;
    symbol: string;
  };
  INTL: {
    oneTime: number;
    currency: string;
    symbol: string;
  };
}

export const PRICING: PricingConfig = {
  IN: {
    oneTime: 50,
    currency: 'INR',
    symbol: '₹',
  },
  INTL: {
    oneTime: 5,
    currency: 'USD',
    symbol: '$',
  },
};

export interface PaymentInfo {
  status: PaymentStatus;
  provider?: PaymentProvider;
  purchaseDate?: string;
  expiryDate?: string; // For subscription
  region: PaymentRegion;
  transactionId?: string;
}

// Payment phases
export type PaymentPhase = 'free' | 'one_time' | 'subscription';

export interface PaymentPhaseConfig {
  currentPhase: PaymentPhase;
  freeUntil?: string; // ISO date
  oneTimeEnabled: boolean;
  subscriptionEnabled: boolean;
}

// Default config - currently free
export const DEFAULT_PAYMENT_CONFIG: PaymentPhaseConfig = {
  currentPhase: 'free',
  freeUntil: undefined, // Set when launching paid version
  oneTimeEnabled: false,
  subscriptionEnabled: false,
};
