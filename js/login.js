document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('loginForm');
  const passwordEl  = document.getElementById('password');
  const errorEl     = document.getElementById('loginError');
  const loginBtn    = document.getElementById('loginBtn');

  passwordEl.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordEl.value;
    errorEl.style.display  = 'none';
    loginBtn.disabled      = true;
    loginBtn.textContent   = 'Signing in...';

    try {
      const res = await fetch('/api/auth.php?action=login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        errorEl.textContent    = 'Incorrect password. Please try again.';
        errorEl.style.display  = 'block';
        passwordEl.value       = '';
        passwordEl.focus();
      }
    } catch {
      errorEl.textContent   = 'Connection error. Please try again.';
      errorEl.style.display = 'block';
    } finally {
      loginBtn.disabled     = false;
      loginBtn.textContent  = 'Sign In';
    }
  });
});
