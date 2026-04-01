const SUPABASE =
  typeof SUPABASE_URL !== 'undefined' &&
  typeof SUPABASE_ANON_KEY !== 'undefined' &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const isSupabaseReady = () => typeof SUPABASE !== 'undefined' && SUPABASE !== null;

const SUPABASE_SITE_KEY = 'site-content';
