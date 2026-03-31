const ADMIN_AUTH_KEY = 'lwe623-admin-auth';
const ADMIN_PASSWORD = 'westend623';
const adminLoginForm = document.getElementById('admin-login-form');

if (localStorage.getItem(ADMIN_AUTH_KEY)) {
  window.location.href = 'admin.html';
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = document.getElementById('admin-password')?.value?.trim();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, '1');
      window.location.href = 'admin.html';
    } else {
      alert('Incorrect password. Please try again.');
    }
  });
}
