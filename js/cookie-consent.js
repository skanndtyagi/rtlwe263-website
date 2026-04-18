/**
 * Cookie Consent Banner - GDPR Compliance
 *
 * Manages user consent for cookies and data collection.
 * Stores consent decisions in localStorage with 13-month expiry (GDPR max).
 * Logs all consent decisions to Supabase consent_log table for audit trail.
 */

const CONSENT_KEY = 'cookieConsent';
const CONSENT_EXPIRY_MONTHS = 13; // GDPR maximum

/**
 * Check if user has given specific consent type
 * @param {string} type - Consent type to check ('essential' or 'all')
 * @returns {boolean} - True if user has valid consent of the specified type
 */
function hasConsent(type) {
  const consent = getStoredConsent();

  if (!consent) return false;
  if (isConsentExpired(consent)) return false;

  // Essential is always allowed if any consent given
  if (type === 'essential') return true;

  // For 'all', check if user explicitly gave 'all' consent
  return consent.type === 'all';
}

/**
 * Get stored consent from localStorage
 * @returns {Object|null} - Consent object or null if not found
 */
function getStoredConsent() {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading consent from localStorage:', error);
    return null;
  }
}

/**
 * Check if consent has expired (older than 13 months)
 * @param {Object} consent - Consent object with expiry timestamp
 * @returns {boolean} - True if consent has expired
 */
function isConsentExpired(consent) {
  if (!consent || !consent.expiry) return true;
  return Date.now() > consent.expiry;
}

/**
 * Store consent decision in localStorage
 * @param {string} type - Consent type ('essential' or 'all')
 */
function storeConsent(type) {
  const consent = {
    type: type,
    timestamp: Date.now(),
    expiry: Date.now() + (CONSENT_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000), // ~13 months
  };

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Error storing consent to localStorage:', error);
  }
}

/**
 * Show cookie consent banner
 */
function showConsentBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (!banner) {
    console.warn('Cookie consent banner element not found');
    return;
  }

  banner.classList.remove('hidden');
  banner.classList.add('visible');
}

/**
 * Hide cookie consent banner
 */
function hideConsentBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (!banner) return;

  banner.classList.remove('visible');
  banner.classList.add('hidden');
}

/**
 * Accept all cookies (essential + analytics + functional)
 */
async function acceptAllCookies() {
  storeConsent('all');
  await logConsentToSupabase(true, 'all');
  hideConsentBanner();
}

/**
 * Accept essential cookies only
 */
async function acceptEssentialOnly() {
  storeConsent('essential');
  await logConsentToSupabase(true, 'essential');
  hideConsentBanner();
}

/**
 * Log consent decision to Supabase consent_log table
 * @param {boolean} consentGiven - Whether user gave consent
 * @param {string} consentType - Type of consent ('essential' or 'all')
 */
async function logConsentToSupabase(consentGiven, consentType) {
  if (!isSupabaseReady()) {
    console.warn('Supabase not ready, consent not logged to database');
    return;
  }

  try {
    // Generate a session ID for this user (stored in sessionStorage)
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }

    const { data, error } = await SUPABASE
      .from('consent_log')
      .insert({
        session_id: sessionId,
        consent_given: consentGiven,
        consent_type: consentType,
      });

    if (error) {
      console.error('Error logging consent to Supabase:', error);
    } else {
      console.log('Consent logged successfully');
    }
  } catch (error) {
    console.error('Error logging consent to Supabase:', error);
  }
}

/**
 * Generate a UUID v4
 * @returns {string} - UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Initialize cookie consent banner on page load
 */
function initCookieConsent() {
  const consent = getStoredConsent();

  // Show banner if no consent or consent expired
  if (!consent || isConsentExpired(consent)) {
    showConsentBanner();
  }

  // Set up event listeners for banner buttons
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const essentialOnlyBtn = document.getElementById('accept-essential-only');

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', acceptAllCookies);
  }

  if (essentialOnlyBtn) {
    essentialOnlyBtn.addEventListener('click', acceptEssentialOnly);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}
