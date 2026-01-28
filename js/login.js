/**
 * UniFund Login Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Check if already logged in
    /*
    const user = auth.getUser();
    if (user) {
        window.location.href = 'dashboard.html';
    }
    */

    // Handle Login Submit
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const result = await auth.login(email, password);
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message);
        }
    });

    // Handle Signup Submit
    document.getElementById('form-signup').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;

        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const result = await auth.signup(name, email, password, role);
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message);
        }
    });
});

// Toggle between Login and Signup
function toggleAuth(mode) {
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        loginForm.classList.add('fade-in');
        signupForm.classList.add('hidden');

        btnLogin.classList.add('bg-white', 'text-brand-600', 'shadow-sm');
        btnLogin.classList.remove('text-slate-500');

        btnSignup.classList.remove('bg-white', 'text-brand-600', 'shadow-sm');
        btnSignup.classList.add('text-slate-500');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        signupForm.classList.add('fade-in');

        btnSignup.classList.add('bg-white', 'text-brand-600', 'shadow-sm');
        btnSignup.classList.remove('text-slate-500');

        btnLogin.classList.remove('bg-white', 'text-brand-600', 'shadow-sm');
        btnLogin.classList.add('text-slate-500');
    }
}

// Quick Login for Demo
function quickLogin(role) {
    // Map roles to mock emails
    const emails = {
        student: 'rahim@uiu.ac.bd',
        donor: 'fatema@foundation.org',
        admin: 'admin@unifund.bd'
    };

    const result = auth.login(emails[role], 'password');
    if (result.success) {
        window.location.href = 'dashboard.html';
    }
}

// Expose functions to window
window.toggleAuth = toggleAuth;
window.quickLogin = quickLogin;
