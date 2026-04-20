/**
 * Google Analytics (GA4) Utility
 * Tracking ID: G-0038B4EY83
 */

export const GA_TRACKING_ID = 'G-0038B4EY83';

// Safely access gtag from the window object
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  } else {
    console.warn('[Analytics] gtag is not initialized yet.');
  }
};

// Safely access fbq from the window object
const fbq = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq(...args);
  } else {
    // fbq is expected to be deferred by 4 seconds
  }
};

/**
 * Tracks a page view manually.
 * Recommended for Single Page Applications (SPAs).
 */
export const trackPageView = (path: string) => {
  if (!path) return;
  gtag('config', GA_TRACKING_ID, {
    page_path: path,
  });
  fbq('track', 'PageView');
};

/**
 * Tracks a custom event.
 */
export const trackEvent = (
  eventName: string,
  category: 'engagement' | 'conversion' | 'ecommerce' | 'system',
  label?: string,
  value?: number,
  otherParams?: Record<string, any>
) => {
  gtag('event', eventName, {
    event_category: category,
    event_label: label,
    value: value,
    ...otherParams,
  });
};

/**
 * Sets the user ID for cross-device tracking.
 */
export const setUserId = (userId: string | null) => {
  if (userId) {
    gtag('config', GA_TRACKING_ID, {
      user_id: userId,
    });
  }
};

/**
 * Sets custom user properties (e.g., subscription plan).
 */
export const setUserProperties = (properties: Record<string, any>) => {
  gtag('set', 'user_properties', properties);
};

export const SaaSAnalytics = {
  // Diagnosis Events
  startDiagnosis: () => trackEvent('start_diagnosis', 'engagement', 'User started diagnostic flow'),
  completeDiagnosis: (issueName: string) => trackEvent('complete_diagnosis', 'conversion', issueName),
  
  // Marketing / Interaction Events
  upgradeClick: (planName: string) => {
    trackEvent('upgrade_click', 'conversion', planName);
    fbq('track', 'Subscribe', { content_name: planName });
  },
  callMechanic: (mechanicName: string) => trackEvent('call_mechanic', 'conversion', mechanicName),
  viewProvider: (providerName: string) => trackEvent('view_provider', 'engagement', providerName),
  openChat: () => trackEvent('open_chat', 'engagement'),
};
