const ADMIN_EMAIL = 'london.westend@roundtable.org.uk';
const adminLoginForm = document.getElementById('admin-login-form');
const loginStatus = document.getElementById('login-status');

/**
 * Display a status message to the user
 * @param {string} message - The message to display
 * @param {'info'|'success'|'error'} type - Message type for styling
 */
const showLoginError = (message, type = 'error') => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.style.display = 'block';
  loginStatus.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.1)' : type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(96, 165, 250, 0.1)';
  loginStatus.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#22c55e' : '#60a5fa';
  loginStatus.style.borderLeft = `3px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#22c55e' : '#60a5fa'}`;
};

/**
 * Check if user already has an active Supabase session and redirect to dashboard
 */
const checkExistingSession = async () => {
  if (!isSupabaseReady()) {
    showLoginError('⚠ Supabase is not configured. Please check your configuration.', 'error');
    return;
  }

  const { data: { session }, error } = await SUPABASE.auth.getSession();

  if (error) {
    console.error('[admin-login] Error checking session:', error.message);
    return;
  }

  if (session) {
    console.log('[admin-login] Active session found, redirecting to dashboard');
    window.location.href = 'admin.html';
  }
};

/**
 * Handle admin login form submission
 * @param {string} email - Admin email address
 * @param {string} password - Admin password
 */
const handleAdminLogin = async (email, password) => {
  if (!isSupabaseReady()) {
    showLoginError('⚠ Supabase is not configured. Please check your configuration.', 'error');
    return;
  }

  showLoginError('Signing in...', 'info');

  const { data, error } = await SUPABASE.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('[admin-login] Authentication failed:', error.message);
    showLoginError('✗ ' + error.message, 'error');
    return;
  }

  if (data?.session) {
    console.log('[admin-login] Authentication successful');

    // Store login timestamp for notification system
    try {
      localStorage.setItem('lwe623-admin-last-visit', new Date().toISOString());
      console.log('[admin-login] Login timestamp stored for notifications');
    } catch (error) {
      console.warn('[admin-login] Could not store login timestamp:', error);
    }

    showLoginError('✓ Login successful! Redirecting...', 'success');
    window.location.href = 'admin.html';
  }
};

// Check for existing session on page load
(async () => {
  // Give scripts a moment to load
  await new Promise(r => setTimeout(r, 500));

  console.log('[admin-login] Initializing admin login');
  console.log('[admin-login] Supabase ready:', isSupabaseReady());

  await checkExistingSession();

  // Hide status message if no error shown
  if (loginStatus && loginStatus.style.display === 'block' && loginStatus.textContent.includes('⚠')) {
    // Keep error visible
  } else if (loginStatus) {
    loginStatus.style.display = 'none';
  }
})();

// Bind form submission handler
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput?.value?.trim();

    if (!password) {
      showLoginError('Please enter a password.', 'error');
      return;
    }

    await handleAdminLogin(ADMIN_EMAIL, password);
  });
}
