/**
 * Polar Checkout Configuration for Carxai
 * These links redirect users to the Polar-hosted checkout pages.
 */

export const POLAR_CHECKOUT_URLS = {
  starter: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_iv9w45DS2L5hdjZcVHTKZf0Qgs9eI37z7b67e3xp3ws/redirect",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_b3QeiukEBBxeDMyKIxleprE64QgGrxQP9bbJO4VTh1j/redirect",
  },
  pro: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_iv8i9hdPSqGRpEvGugUNlS5Uzu2kkMpjmOLW82g4Qd6/redirect",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_3mBOT85Ebb1SVdIjz9l326RIsiiqvel42LKZG3GdsO0/redirect",
  },
  advanced: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_gHXi7tb3FY3lQGqDNFjQ5nLCOzQivcQNxWfbU2GzmBu/redirect",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_fVAHGeZ2KBJUrvrCMnDBEAZoCarS04I8CJ9IF0iPOSp/redirect",
  }
} as const;

export type PlanType = keyof typeof POLAR_CHECKOUT_URLS;
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Gets the checkout URL for a specific plan and billing cycle
 */
export const getCheckoutUrl = (plan: PlanType, cycle: BillingCycle): string => {
  return POLAR_CHECKOUT_URLS[plan][cycle];
};
