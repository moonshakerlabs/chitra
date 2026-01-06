// External Payment Provider Placeholder
// For Razorpay (India) and Stripe (International)

import { PaymentRegion, PRICING } from '../types/PaymentTypes';

export interface ExternalPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Initialize Razorpay payment for Indian users
 * Placeholder - implement when ready
 */
export const initiateRazorpayPayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): Promise<ExternalPaymentResult> => {
  console.log('Razorpay payment - not yet implemented');
  console.log('Price:', PRICING.IN.symbol + PRICING.IN.oneTime);
  
  return {
    success: false,
    error: 'Payment not yet enabled',
  };
};

/**
 * Initialize Stripe payment for international users
 * Placeholder - implement when ready
 */
export const initiateStripePayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): Promise<ExternalPaymentResult> => {
  console.log('Stripe payment - not yet implemented');
  console.log('Price:', PRICING.INTL.symbol + PRICING.INTL.oneTime);
  
  return {
    success: false,
    error: 'Payment not yet enabled',
  };
};

/**
 * Route to correct payment provider based on region
 */
export const initiatePayment = async (
  userId: string,
  region: PaymentRegion
): Promise<ExternalPaymentResult> => {
  if (region === 'IN') {
    return initiateRazorpayPayment(userId);
  } else {
    return initiateStripePayment(userId);
  }
};

/**
 * Verify payment status
 * Placeholder - implement when ready
 */
export const verifyPayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _transactionId: string
): Promise<boolean> => {
  console.log('Payment verification - not yet implemented');
  return false;
};
