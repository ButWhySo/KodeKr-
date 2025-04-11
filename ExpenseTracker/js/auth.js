document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleRegister = document.getElementById('toggleRegister');
    const toggleLogin = document.getElementById('toggleLogin');

    if (!loginForm || !registerForm || !toggleRegister || !toggleLogin) {
        console.error("Login/Register form elements not found!");
        return;
    }

    // Switch to register view
    toggleRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleRegister.style.display = 'none';
        toggleLogin.style.display = 'block';
    });

    // Switch to login view
    toggleLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleRegister.style.display = 'block';
        toggleLogin.style.display = 'none';
    });

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username] && users[username].password === password) {
            localStorage.setItem('loggedInUser', username);
            window.location.href = 'dashboard.html'; // or index.html
        } else {
            alert('Invalid username or password');
        }
    });

    // Handle registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username]) {
            alert('User already exists!');
            return;
        }

        // Save new user
        users[username] = {
            password,
            transactions: [] // This holds cash flow per user
        };

        localStorage.setItem('users', JSON.stringify(users));
        alert('Registration successful! Please log in.');

        // Redirect to login
        registerForm.reset();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        toggleRegister.style.display = 'block';
        toggleLogin.style.display = 'none';
    });

    // Auto-redirect if already logged in
    const currentUser = localStorage.getItem('loggedInUser');
    if (currentUser && window.location.pathname.includes('login')) {
        window.location.href = 'dashboard.html'; // or index.html
    }
});
