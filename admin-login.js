const ADMIN_AUTH_KEY = 'lwe623-admin-auth';
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk';
const ADMIN_PASSWORD = 'Marchesi623';
const adminLoginForm = document.getElementById('admin-login-form');
const loginStatus = document.getElementById('login-status');

const setStatus = (message, type = 'info') => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.style.display = 'block';
  loginStatus.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.1)' : type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(96, 165, 250, 0.1)';
  loginStatus.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#22c55e' : '#60a5fa';
  loginStatus.style.borderLeft = `3px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#22c55e' : '#60a5fa'}`;
};

const setAuthorized = () => localStorage.setItem(ADMIN_AUTH_KEY, '1');
const isLocalAuthorized = () => localStorage.getItem(ADMIN_AUTH_KEY) === '1';
const redirectToAdmin = () => (window.location.href = 'admin.html');

const hasSupabaseSession = async () => {
  if (!isSupabaseReady()) return false;
  const { data, error } = await SUPABASE.auth.getSession();
  return !error && !!data?.session;
};

const ensureLoggedIn = async () => {
  if (isLocalAuthorized() || (await hasSupabaseSession())) {
    redirectToAdmin();
  }
};

// Check initial state
(async () => {
  // Give scripts a moment to load
  await new Promise(r => setTimeout(r, 500));
  
  console.log('[admin-login-init] Starting initial check');
  console.log('[admin-login-init] window.supabase:', typeof window.supabase);
  console.log('[admin-login-init] SUPABASE_URL:', typeof SUPABASE_URL !== 'undefined' ? 'OK' : 'MISSING');
  console.log('[admin-login-init] SUPABASE_ANON_KEY:', typeof SUPABASE_ANON_KEY !== 'undefined' ? (SUPABASE_ANON_KEY === 'your-anon-publishable-key-here' ? 'PLACEHOLDER' : 'OK') : 'MISSING');
  console.log('[admin-login-init] isSupabaseReady():', isSupabaseReady());
  
  if (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY === 'your-anon-publishable-key-here') {
    setStatus('⚠ Supabase config not set up. Using local auth only. Replace "your-anon-publishable-key-here" in supabase-config.js with your anon key.', 'error');
  } else if (!isSupabaseReady()) {
    setStatus('⚠ Supabase failed to initialize. Using local auth only.', 'error');
  }
  
  if (isLocalAuthorized() || (await hasSupabaseSession())) {
    redirectToAdmin();
  }
  loginStatus.style.display = 'none';
})();

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('admin-password')?.value?.trim();
    if (!password) {
      setStatus('Please enter a password.', 'error');
      return;
    }

    console.log('[admin-login] Login attempt with password:', password.substring(0, 3) + '***');
    console.log('[admin-login] Supabase ready:', isSupabaseReady());
    setStatus('Checking credentials...', 'info');

    if (isSupabaseReady()) {
      console.log('[admin-login] Attempting Supabase Auth with email:', ADMIN_EMAIL);
      setStatus('Signing in with Supabase...', 'info');
      try {
        const { data, error } = await SUPABASE.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password,
        });

        if (error) {
          console.error('[admin-login] Supabase auth error:', error.message || error);
          console.log('[admin-login] Supabase signin failed, trying local fallback');
        } else if (data?.session) {
          console.log('[admin-login] Supabase auth success!');
          setStatus('✓ Login successful! Redirecting...', 'success');
          setAuthorized();
          return redirectToAdmin();
        } else {
          console.warn('[admin-login] Supabase auth succeeded but no session returned');
        }
      } catch (err) {
        console.error('[admin-login] Supabase auth exception:', err.message || err);
      }
    } else {
      console.log('[admin-login] Supabase not ready, using local auth only');
      setStatus('Using local authentication', 'info');
    }

    console.log('[admin-login] Trying local password fallback');
    if (password === ADMIN_PASSWORD) {
      console.log('[admin-login] Local password matched!');
      setStatus('✓ Login successful! Redirecting...', 'success');
      setAuthorized();
      redirectToAdmin();
      return;
    }

    console.error('[admin-login] Password incorrect');
    setStatus('✗ Incorrect password. Please try again.', 'error');
  });
}
