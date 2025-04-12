document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    let isLogin = true;

    // 🌗 Apply saved theme on load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    // 🌗 Theme toggle functionality
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    // 🔁 Toggle login/register mode
    toggleLink.addEventListener('click', () => {
        isLogin = !isLogin;
        formTitle.textContent = isLogin ? 'Login' : 'Register';
        submitBtn.textContent = isLogin ? 'Login' : 'Register';
        toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
        toggleLink.textContent = isLogin ? "Register" : "Login";
    });

    // 🔐 Handle login/register submission
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        let users = JSON.parse(localStorage.getItem('users') || '{}');

        if (isLogin) {
            if (users[username] && users[username].password === password) {
                localStorage.setItem('loggedInUser', username);
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid username or password!');
            }
        } else {
            if (users[username]) {
                alert('User already exists!');
            } else {
                users[username] = {
                    password,
                    transactions: []
                };
                localStorage.setItem('users', JSON.stringify(users));
                alert('Registration successful!');
                toggleLink.click();
            }
        }

        authForm.reset();
    });

    // 🚪 Auto-redirect if already logged in
    const currentUser = localStorage.getItem('loggedInUser');
    if (currentUser && window.location.pathname.includes('login')) {
        window.location.href = 'dashboard.html';
    }
});
