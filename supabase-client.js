// Initialize Supabase client - waits for CDN to load if needed
let SUPABASE = null;
let supabaseInitAttempted = false;

const initializeSupabase = () => {
  if (supabaseInitAttempted && SUPABASE !== null) {
    return SUPABASE; // Already initialized
  }

  if (typeof SUPABASE_URL === 'undefined' || !SUPABASE_URL) {
    console.error('[supabase] SUPABASE_URL is not defined');
    return null;
  }

  if (typeof SUPABASE_ANON_KEY === 'undefined' || !SUPABASE_ANON_KEY) {
    console.error('[supabase] SUPABASE_ANON_KEY is not defined');
    return null;
  }

  if (typeof supabase === 'undefined') {
    console.warn('[supabase] Supabase library not loaded yet from CDN');
    return null;
  }

  supabaseInitAttempted = true;

  try {
    SUPABASE = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[supabase] Client initialized successfully');
    return SUPABASE;
  } catch (error) {
    console.error('[supabase] Error creating client:', error);
    return null;
  }
};

// Try to initialize immediately
SUPABASE = initializeSupabase();

// If CDN hasn't loaded yet, retry when window loads
if (!SUPABASE) {
  window.addEventListener('load', () => {
    if (!SUPABASE) {
      console.log('[supabase] Retrying initialization after window load...');
      SUPABASE = initializeSupabase();
    }
  });
}

const isSupabaseReady = () => {
  if (!SUPABASE) {
    SUPABASE = initializeSupabase();
  }
  return SUPABASE !== null;
};

const SUPABASE_SITE_KEY = 'site-content';
