
if (!localStorage.getItem('loggedInUser')) {
    window.location.href = 'login.html';
}


// DOM Elements
const loader = document.getElementById('loader');
const toast = document.getElementById('toast');
const mainContent = document.getElementById('mainContent');
const navLinks = document.querySelectorAll('.nav-link');
const pageTitle = document.querySelector('.page-title');

// Modal Elements
const transactionModal = document.getElementById('transactionModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');
const saveTransactionBtn = document.getElementById('saveTransactionBtn');
const transactionForm = document.getElementById('transactionForm');
let currentUser = localStorage.getItem('loggedInUser') || '';
let editTransactionId = null; // To track if we're editing an existing transaction


// Current active page
let currentPage = 'dashboard';
let users = JSON.parse(localStorage.getItem('users') || '{}');

let transactions = users[currentUser]?.transactions || [];

 /*
sample tansaction data
let transactions = [
    {
        id: 1,
        name: "Grocery Store",
        amount: 85.50,
        type: "expense",
        category: "food",
        date: new Date().toISOString().split('T')[0],
        notes: "Weekly groceries"
    },
    {
        id: 2,
        name: "Paycheck",
        amount: 1200.00,
        type: "income",
        category: "other",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Monthly salary"
    },
    {
        id: 3,
        name: "Electric Bill",
        amount: 75.30,
        type: "expense",
        category: "bills",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "May electricity bill"
    },
    {
        id: 4,
        name: "Amazon Purchase",
        amount: 42.99,
        type: "expense",
        category: "shopping",
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "New book"
    },
    {
        id: 5,
        name: "Dinner Out",
        amount: 35.75,
        type: "expense",
        category: "food",
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Date night"
    }
];
*/


// Show loading spinner
function showLoader() {
    loader.classList.add('active');
}

// Hide loading spinner
function hideLoader() {
    loader.classList.remove('active');
}

// Show toast notification
function showToast(message, type = 'success', duration = 3000) {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}


// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get relative time (e.g., "2 days ago")
function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `diffInDays days ago`;
    if (diffInDays < 30) return `Math.floor(diffInDays / 7) weeks ago`;
    return formatDate(dateString);
}

// Get category icon
function getCategoryIcon(category) {
    switch (category) {
        case 'food': return 'fa-utensils';
        case 'shopping': return 'fa-shopping-bag';
        case 'bills': return 'fa-file-invoice-dollar';
        case 'transport': return 'fa-car';
        case 'entertainment': return 'fa-film';
        default: return 'fa-receipt';
    }
}

// Calculate totals

function calculateTotals(data) {
    const income = data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        balance: income - expenses,
        income,
        expenses
    };
}

// Generate transaction list HTML
function generateTransactionList(data) {
    if (data.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <h3 class="empty-title">No transactions yet</h3>
                <p class="empty-text">Start by adding your first transaction to track your spending</p>
                <button class="btn btn-primary" id="addFirstTransactionBtn">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
            </div>
        `;
    }

    return `
        <ul class="transaction-list">
            ${data.map(transaction => `
                <li class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.category}">
                            <i class="fas ${getCategoryIcon(transaction.category)}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4 class="transaction-title">${transaction.name}</h4>
                            <div class="transaction-meta">
                                <span>${getRelativeTime(transaction.date)}</span>
                                <i class="fas fa-circle"></i>
                                <span>${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </div>
                    <div class="transaction-actions">
                        <button class="action-btn edit">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="action-btn delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

// Apply saved theme preference on dashboard
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode'); // fallback to light
    }
});


// Dashboard content

/*
function getDashboardContent(transactions) {
    const totals = calculateTotals();
    const userName = currentUser || "User";

    return `
    <div class="header">
        <h1 class="page-title">Dashboard</h1>
        <div class="header-actions">
            <div class="search-bar"><i class="fas fa-search"></i><input type="text" placeholder="Search transactions..." id="searchTransactions"></div>
            <div class="user-profile">
                <div class="user-avatar">${userName.slice(0, 2).toUpperCase()}</div>
                <span class="user-name">${userName}</span>
                <div class="user-dropdown">
                    <a href="#" id="openSettings"><i class="fas fa-cog"></i> Settings</a>
                    <a href="#" id="logoutUser"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        </div>
    </div>
    <div class="dashboard-cards">
        <div class="card card-balance">
            <div class="card-header"><h3>Total Balance</h3><div class="card-icon"><i class="fas fa-wallet"></i></div></div>
            <div class="card-value">${formatCurrency(totals.balance)}</div>
        </div>
        <div class="card card-income">
            <div class="card-header"><h3>Income</h3><div class="card-icon"><i class="fas fa-arrow-down"></i></div></div>
            <div class="card-value">${formatCurrency(totals.income)}</div>
        </div>
        <div class="card card-expense">
            <div class="card-header"><h3>Expenses</h3><div class="card-icon"><i class="fas fa-arrow-up"></i></div></div>
            <div class="card-value">${formatCurrency(totals.expenses)}</div>
        </div>
    </div>`;
}*/

/*
function getDashboardContent(filteredTransactions) {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const allTransactions = users[currentUser]?.transactions || [];

    const totals = calculateTotals(allTransactions); // Always use full data for totals

    return `
        <div class="header">
            <h1 class="page-title">Dashboard</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search transactions..." id="searchTransactions">
                </div>
                <div class="user-profile">
                    <div class="user-avatar">${currentUser?.charAt(0).toUpperCase()}</div>
                    <span class="user-name">${currentUser}</span>
                    <div class="user-dropdown">
                        <a href="#" id="openSettings"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#" id="logoutUser"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-cards">
            <div class="card card-balance">
                <div class="card-header">
                    <h3 class="card-title">Total Balance</h3>
                    <div class="card-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.balance)}</div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
            </div>
        </div>

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">Recent Transactions</h2>
            </div>
            ${generateTransactionList(filteredTransactions)}
        </div>

        <button class="floating-add-btn" id="addTransactionBtn">
            <i class="fas fa-plus"></i>
        </button>
    `;
}



function getDashboardContent(transactions) {
    const totals = calculateTotals(transactions);
    const loggedInUser = localStorage.getItem('loggedInUser') || 'User';

    return `
        <div class="header">
            <h1 class="page-title">Dashboard</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search transactions..." id="searchTransactions">
                </div>
                <div class="user-profile">
                    <div class="user-avatar">${loggedInUser.charAt(0).toUpperCase()}</div>
                    <span class="user-name">${loggedInUser}</span>
                    <div class="user-dropdown">
                        <a href="#" id="openSettings"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#" id="logoutUser"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-cards">
            <div class="card card-balance">
                <div class="card-header">
                    <h3 class="card-title">Total Balance</h3>
                    <div class="card-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.balance)}</div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
            </div>
        </div>

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">Recent Transactions</h2>
            </div>
            ${generateTransactionList(transactions)}
        </div>

        <button class="floating-add-btn" id="addTransactionBtn">
            <i class="fas fa-plus"></i>
        </button>
    `;
}

*/// working , but without charts
function getDashboardContent(filteredTransactions) {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const allTransactions = users[currentUser]?.transactions || [];

    const totals = calculateTotals(allTransactions); // full data for totals

    return `
        <div class="header">
            <h1 class="page-title">Dashboard</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search transactions..." id="searchTransactions">
                </div>
                <div class="user-profile">
                    <div class="user-avatar">${currentUser?.charAt(0).toUpperCase()}</div>
                    <span class="user-name">${currentUser}</span>
                    <div class="user-dropdown">
                        <a href="#" id="openSettings"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#" id="logoutUser"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-cards">
            <div class="card card-balance">
                <div class="card-header">
                    <h3 class="card-title">Total Balance</h3>
                    <div class="card-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.balance)}</div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
            </div>
        </div>



    

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">Recent Transactions</h2>
            </div>
            ${generateTransactionList(filteredTransactions)}
        </div>

        <button class="floating-add-btn" id="addTransactionBtn">
            <i class="fas fa-plus"></i>
        </button>
    `;
}






// Transactions content
function getTransactionsContent(transactions = []) {
    return `
        <div class="header">
            <h1 class="page-title">Transactions</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search transactions..." id="searchTransactions">
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-outline">
                        <i class="fas fa-filter"></i> Filters
                    </button>
                    <button class="btn btn-primary" id="addTransactionBtn">
                        <i class="fas fa-plus"></i> Add Transaction
                    </button>
                </div>
            </div>
        </div>

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">All Transactions</h2>
                <div class="transaction-actions">
                    <button class="btn btn-outline">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            
            <div class="transaction-filters">
                <div class="filter-group">
                    <label>Type:</label>
                    <select class="form-control" id="filterType">
                        <option value="all">All</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Category:</label>
                    <select class="form-control" id="filterCategory">
                        <option value="all">All Categories</option>
                        <option value="food">Food</option>
                        <option value="shopping">Shopping</option>
                        <option value="bills">Bills</option>
                        <option value="transport">Transport</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Date Range:</label>
                    <select class="form-control" id="filterDateRange">
                        <option value="30">Last 30 Days</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
            </div>

            <!-- ✅ PASS transactions to the function -->
            ${generateTransactionList(transactions)}
            
            <div class="pagination">
                <button class="btn btn-outline" id="prevPageBtn">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span>Page 1 of 5</span>
                <button class="btn btn-outline" id="nextPageBtn">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}


// Budgets content
function getBudgetsContent() {
    return `
        <div class="header">
            <h1 class="page-title">Budgets</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search budgets...">
                </div>
                <button class="btn btn-primary" id="addBudgetBtn">
                    <i class="fas fa-plus"></i> Create Budget
                </button>
            </div>
        </div>

        <div class="budgets-container">
            <div class="section-header">
                <h2 class="section-title">Monthly Budgets</h2>
                <div class="budget-actions">
                    <button class="btn btn-outline">
                        <i class="fas fa-calendar"></i> May 2023
                    </button>
                </div>
            </div>
            
            <div class="budget-cards">
                <div class="budget-card">
                    <div class="budget-header">
                        <h3>Food & Dining</h3>
                        <span class="budget-amount">${formatCurrency(500)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar" style="width: 65%; background: #ff7675;"></div>
                    </div>
                    <div class="budget-footer">
                        <span>${formatCurrency(325)} spent</span>
                        <span>${formatCurrency(175)} remaining</span>
                    </div>
                </div>
                
                <div class="budget-card">
                    <div class="budget-header">
                        <h3>Shopping</h3>
                        <span class="budget-amount">${formatCurrency(300)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar" style="width: 90%; background: #a29bfe;"></div>
                    </div>
                    <div class="budget-footer">
                        <span>${formatCurrency(270)} spent</span>
                        <span>${formatCurrency(30)} remaining</span>
                    </div>
                </div>
                
                <div class="budget-card">
                    <div class="budget-header">
                        <h3>Transportation</h3>
                        <span class="budget-amount">${formatCurrency(200)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar" style="width: 45%; background: #fdcb6e;"></div>
                    </div>
                    <div class="budget-footer">
                        <span>${formatCurrency(90)} spent</span>
                        <span>${formatCurrency(110)} remaining</span>
                    </div>
                </div>
                
                <div class="budget-card">
                    <div class="budget-header">
                        <h3>Entertainment</h3>
                        <span class="budget-amount">${formatCurrency(150)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar" style="width: 30%; background: #fd79a8;"></div>
                    </div>
                    <div class="budget-footer">
                        <span>${formatCurrency(45)} spent</span>
                        <span>${formatCurrency(105)} remaining</span>
                    </div>
                </div>
            </div>
            
            <button class="btn btn-outline" style="width: 100%; margin-top: 1.5rem;" id="addAnotherBudgetBtn">
                <i class="fas fa-plus"></i> Add Another Budget
            </button>
        </div>
    `;
}

// Goals content
function getGoalsContent() {
    return `
        <div class="header">
            <h1 class="page-title">Goals</h1>
            <div class="header-actions">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search goals...">
                </div>
                <button class="btn btn-primary" id="addGoalBtn">
                    <i class="fas fa-plus"></i> Create Goal
                </button>
            </div>
        </div>

        <div class="goals-container">
            <div class="section-header">
                <h2 class="section-title">My Savings Goals</h2>
                <div class="goal-actions">
                    <button class="btn btn-outline">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                </div>
            </div>
            
            <div class="goal-cards">
                <div class="goal-card">
                    <div class="goal-icon">
                        <i class="fas fa-home"></i>
                    </div>
                    <div class="goal-details">
                        <h3>Down Payment for House</h3>
                        <p>Target: ${formatCurrency(50000)} by Dec 2025</p>
                        <div class="goal-progress">
                            <div class="progress-bar" style="width: 35%;"></div>
                        </div>
                        <div class="goal-stats">
                            <span>${formatCurrency(17500)} saved</span>
                            <span>35% completed</span>
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="action-btn" id="goalMenuBtn1">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                
                <div class="goal-card">
                    <div class="goal-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="goal-details">
                        <h3>New Car</h3>
                        <p>Target: ${formatCurrency(15000)} by Jun 2024</p>
                        <div class="goal-progress">
                            <div class="progress-bar" style="width: 60%;"></div>
                        </div>
                        <div class="goal-stats">
                            <span>${formatCurrency(9000)} saved</span>
                            <span>60% completed</span>
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="action-btn" id="goalMenuBtn2">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                
                <div class="goal-card">
                    <div class="goal-icon">
                        <i class="fas fa-umbrella-beach"></i>
                    </div>
                    <div class="goal-details">
                        <h3>Vacation to Hawaii</h3>
                        <p>Target: ${formatCurrency(5000)} by Mar 2024</p>
                        <div class="goal-progress">
                            <div class="progress-bar" style="width: 20%;"></div>
                        </div>
                        <div class="goal-stats">
                            <span>${formatCurrency(1000)} saved</span>
                            <span>20% completed</span>
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="action-btn" id="goalMenuBtn3">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <h3 class="empty-title">Create your first goal</h3>
                <p class="empty-text">Set financial goals and track your progress towards achieving them</p>
                <button class="btn btn-primary" id="addFirstGoalBtn">
                    <i class="fas fa-plus"></i> Create Goal
                </button>
            </div>
        </div>
    `;
}

// Reports content
// Reports content
function getReportsContent() {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const transactions = users[currentUser]?.transactions || [];

    return `
        <div class="header">
            <h1 class="page-title">Reports</h1>
            <div class="header-actions">
                <select class="form-control" id="reportPeriod">
                    <option value="30">Last 30 Days</option>
                    <option value="this-month">This Month</option>
                    <option value="last-month">Last Month</option>
                    <option value="this-year">This Year</option>
                    <option value="all">All Time</option>
                </select>
                <button class="btn btn-outline">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        </div>

        <div class="reports-container">
            <div class="charts-row">
                <div class="chart-card">
                    <h3>Balance Over Time</h3>
                    <canvas id="balanceTrendChart" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Income vs Expenses</h3>
                    <canvas id="incomeExpenseChart" height="300"></canvas>
                </div>
            </div>


            <!-- Chart Section -->
<div class="chart-section">
    <h3>Balance Over Time</h3>
    <canvas id="balanceTrendChart" height="100"></canvas>

    <h3 style="margin-top: 2rem;">Expenses by Category</h3>
    <canvas id="categoryPieChart" height="100"></canvas>
</div>

            <div class="transactions-summary">
                <h3>Recent Transactions</h3>
                ${generateTransactionList(transactions.slice(0, 5))}
            </div>
        </div>
    `;
}
/*
function getReportsContent() {
    return `
        <div class="header">
            <h1 class="page-title">Reports</h1>
            <div class="header-actions">
                <button class="btn btn-outline">
                    <i class="fas fa-download"></i> Export
                </button>
                <button class="btn btn-primary">
                    <i class="fas fa-calendar"></i> Custom Range
                </button>
            </div>
        </div>
        <div class="chart-section">
    <h3>Balance Over Time</h3>
    <canvas id="balanceTrendChart" height="100"></canvas>

    <h3 style="margin-top: 2rem;">Expenses by Category</h3>
    <canvas id="categoryPieChart" height="100"></canvas>
</div>


        <div class="reports-container">
            <div class="report-tabs">
                <button class="report-tab active" data-tab="spending">Spending</button>
                <button class="report-tab" data-tab="income">Income</button>
                <button class="report-tab" data-tab="categories">Categories</button>
                <button class="report-tab" data-tab="trends">Trends</button>
            </div>
            
            <div class="report-content">
                <div class="report-header">
                    <h2>Spending Report</h2>
                    <select class="form-control" id="reportPeriod">
                        <option value="30">Last 30 Days</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                </div>
                
                <div class="chart-placeholder">
                    <canvas id="reportChart"></canvas>
                </div>
                
                <div class="report-details">
                    <div class="report-summary">
                        <h3>Summary</h3>
                        <div class="summary-item">
                            <span>Total Spending</span>
                            <span>${formatCurrency(1920.50)}</span>
                        </div>
                        <div class="summary-item">
                            <span>Average Daily</span>
                            <span>${formatCurrency(64.02)}</span>
                        </div>
                        <div class="summary-item">
                            <span>Transactions</span>
                            <span>42</span>
                        </div>
                    </div>
                    
                    <div class="report-categories">
                        <h3>Top Categories</h3>
                        <div class="category-item">
                            <span>Food & Dining</span>
                            <span>${formatCurrency(625.30)} (32.5%)</span>
                        </div>
                        <div class="category-item">
                            <span>Shopping</span>
                            <span>${formatCurrency(420.75)} (21.9%)</span>
                        </div>
                        <div class="category-item">
                            <span>Bills</span>
                            <span>${formatCurrency(375.50)} (19.5%)</span>
                        </div>
                        <div class="category-item">
                            <span>Transportation</span>
                            <span>${formatCurrency(210.00)} (10.9%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}*/


function filterByReportPeriod(transactions, period) {
    const now = new Date();
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        switch (period) {
            case '30':
                return (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
            case 'this-month':
                return tDate.getMonth() === now.getMonth() &&
                       tDate.getFullYear() === now.getFullYear();
            case 'last-month':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return tDate.getMonth() === lastMonth.getMonth() &&
                       tDate.getFullYear() === lastMonth.getFullYear();
            case 'this-year':
                return tDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
}


/*
function renderReportsCharts(transactions) {
    if (!transactions || transactions.length === 0) {
        showToast('No transaction data available for charts', 'info');
        return;
    }

    // Filter transactions based on selected period
    const period = document.getElementById('reportPeriod')?.value || '30';
    const filteredTransactions = filterByReportPeriod(transactions, period);

    // 1. Balance Trend Chart
    renderBalanceTrendChart(filteredTransactions);

    // 2. Income vs Expense Chart
    renderIncomeExpenseChart(filteredTransactions);

    // 3. Category Pie Chart
    renderCategoryPieChart(filteredTransactions);

    // 4. Monthly Bar Chart
    renderMonthlyBarChart(filteredTransactions);

    // Add event listener for period change
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', () => {
            const newPeriod = reportPeriod.value;
            const newFiltered = filterByReportPeriod(transactions, newPeriod);
            renderReportsCharts(newFiltered);
        });
    }
}
*/

function renderBalanceTrendChart(transactions) {
    const ctx = document.getElementById('balanceTrendChart')?.getContext('2d');
    if (!ctx) return;

    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let balance = 0;
    const labels = [];
    const data = [];

    sorted.forEach(tx => {
        balance += tx.type === 'income' ? tx.amount : -tx.amount;
        labels.push(formatDate(tx.date));
        data.push(balance);
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Net Balance',
                data,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                fill: true,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#4e73df',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `Balance: ${(formatCurrency(context.raw))}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function renderIncomeExpenseChart(transactions) {
    const ctx = document.getElementById('incomeExpenseChart')?.getContext('2d');
    if (!ctx) return;

    // Group by day
    const dailyData = {};
    transactions.forEach(tx => {
        const date = formatDate(tx.date);
        if (!dailyData[date]) {
            dailyData[date] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            dailyData[date].income += tx.amount;
        } else {
            dailyData[date].expense += tx.amount;
        }
    });

    const labels = Object.keys(dailyData);
    const incomeData = labels.map(date => dailyData[date].income);
    const expenseData = labels.map(date => dailyData[date].expense);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#1cc88a',
                    borderColor: '#1cc88a',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#e74a3b',
                    borderColor: '#e74a3b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${(formatCurrency(context.raw))}`;
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryPieChart(transactions) {
    const ctx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (!ctx) return;

    // Calculate expenses by category
    const categoryData = {};
    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
        }
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', 
                    '#e74a3b', '#858796', '#5a5c69', '#3a3b45'
                ],
                hoverBackgroundColor: [
                    '#2e59d9', '#17a673', '#2c9faf', '#dda20a', 
                    '#be2617', '#656776', '#42444e', '#24252e'
                ],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${(formatCurrency(value))} (${percentage}%)`;
                        }
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderMonthlyBarChart(transactions) {
    const ctx = document.getElementById('monthlyBarChart')?.getContext('2d');
    if (!ctx) return;

    // Group by month
    const monthlyData = {};
    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0 };
        }
        
        if (tx.type === 'income') {
            monthlyData[monthYear].income += tx.amount;
        } else {
            monthlyData[monthYear].expense += tx.amount;
        }
    });

    const labels = Object.keys(monthlyData);
    const incomeData = labels.map(month => monthlyData[month].income);
    const expenseData = labels.map(month => monthlyData[month].expense);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#1cc88a',
                    borderColor: '#1cc88a',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#e74a3b',
                    borderColor: '#e74a3b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${(formatCurrency(context.raw))}`;
                        }
                    }
                }
            }
        }
    });
}
/*
function renderReportsCharts(transactions) {
    const balanceData = [];
    const dateLabels = [];
    const categoryData = {};

    let runningBalance = 0;
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(tx => {
        if (tx.type === 'income') {
            runningBalance += tx.amount;
        } else {
            runningBalance -= tx.amount;
            categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
        }

        dateLabels.push(new Date(tx.date).toLocaleDateString());
        balanceData.push(runningBalance);
    });

    // Balance Over Time Line Chart
    const balanceCtx = document.getElementById('balanceTrendChart')?.getContext('2d');
    if (balanceCtx) {
        new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Net Balance',
                    data: balanceData,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3
                }]
            }
        });
    }

    // Expenses Pie Chart
    const pieCtx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#9966FF', '#4BC0C0']
                }]
            }
        });
    }
}
*/


// Settings content
function getSettingsContent() {
    return `
        <div class="header">
            <h1 class="page-title">Settings</h1>
        </div>

        <div class="settings-container">
            <div class="settings-tabs">
                <button class="settings-tab active" data-tab="account">Account</button>
                <button class="settings-tab" data-tab="preferences">Preferences</button>
                <button class="settings-tab" data-tab="notifications">Notifications</button>
                <button class="settings-tab" data-tab="security">Security</button>
                <button class="settings-tab" data-tab="export">Export Data</button>
            </div>
            
            <div class="settings-content">
                <h2>Account Settings</h2>
                
                <form class="settings-form" id="accountSettingsForm">
                    <div class="form-group">
                        <label class="form-label">Profile Picture</label>
                        <div class="avatar-upload">
                            <div class="avatar-preview">
                                <div class="user-avatar">JD</div>
                            </div>
                            <button type="button" class="btn btn-outline" id="changeAvatarBtn">
                                <i class="fas fa-camera"></i> Change Photo
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <div class="form-row">
                            <input type="text" class="form-control" id="firstName" placeholder="First Name" value="John">
                            <input type="text" class="form-control" id="lastName" placeholder="Last Name" value="Doe">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" value="john.doe@example.com">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Currency</label>
                        <select class="form-control" id="currency">
                            <option>US Dollar (USD)</option>
                            <option>Euro (EUR)</option>
                            <option>British Pound (GBP)</option>
                            <option>Japanese Yen (JPY)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Time Zone</label>
                        <select class="form-control" id="timezone">
                            <option>(GMT-05:00) Eastern Time</option>
                            <option>(GMT-06:00) Central Time</option>
                            <option>(GMT-07:00) Mountain Time</option>
                            <option>(GMT-08:00) Pacific Time</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelSettingsBtn">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="saveSettingsBtn">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

const reportPeriodSelect = document.getElementById('reportPeriod');
if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener('change', () => {
        const selectedRange = reportPeriodSelect.value;

        const filtered = filterByReportPeriod(transactions, selectedRange); // ⬅️ filter your transactions
        renderReportsCharts(filtered); // ⬅️ rerender the charts with new filtered data
    });
}

function filterByReportPeriod(transactions, period) {
    const now = new Date();

    return transactions.filter(t => {
        const txDate = new Date(t.date);
        switch (period) {
            case '30':
                return (now - txDate) / (1000 * 60 * 60 * 24) <= 30;
            case 'this-month':
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            case 'last-month':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
            case 'this-year':
                return txDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
}


// Load page content dynamically
function loadPage(page) {
    showLoader();
    currentPage = page;

    // ✅ Get user and transactions before using them
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userData = users[currentUser] || {};
    const transactions = userData.transactions || [];

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Set page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
    }

    const themeToggle = document.getElementById("themeToggleBtn");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    // Simulate API call with timeout
    setTimeout(() => {
        let content = '';

        switch (page) {
            case 'dashboard':
                content = getDashboardContent(userData.transactions || []);
                break;
            case 'transactions':
                content = getTransactionsContent(transactions);
                break;
            case 'budgets':
                content = getBudgetsContent(transactions);
                break;
            case 'goals':
                content = getGoalsContent();
                break;
            case 'reports':
                content = getReportsContent(userData.transactions || []);
                break;
            case 'settings':
                content = getSettingsContent();
                break;
            default:
                content = getDashboardContent(transactions);
        }

        mainContent.innerHTML = content;

        /*
        // ✅ Render dashboard charts after DOM is updated
        if (page === 'dashboard') {
            setTimeout(() => {
                renderDashboardCharts(userData.transactions || []);
            }, 0);
        }
        */


        
        if (page === 'reports') {
            const filtered = filterByReportPeriod(transactions, '30'); // default
            renderReportsCharts(filtered);
        }
        
        
        
    
        hideLoader();
        setupPageEvents();
    }, 500);

    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
        logoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }
}

// Setup modal events
function setupModalEvents() {
    // Close modal when clicking close button
    closeModalBtn.addEventListener('click', () => {
        transactionModal.classList.remove('active');
    });

    // Close modal when clicking cancel button
    cancelTransactionBtn.addEventListener('click', () => {
        transactionModal.classList.remove('active');
    });

    // Close modal when clicking outside
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            transactionModal.classList.remove('active');
        }
    });

    // Save transaction
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('transactionName').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;

        // Create new transaction
        const newTransaction = {
            id: transactions.length + 1,
            name,
            amount,
            type,
            category,
            date,
            notes
        };

        // Add to transactions array
        transactions.unshift(newTransaction);
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Close modal and reset form
        transactionModal.classList.remove('active');
        transactionForm.reset();

        // Reload current page to show changes
        loadPage(currentPage);

        // Show success message
        showToast('Transaction added successfully!', 'success');
    });
}

// Setup event listeners for the current page
function setupPageEvents() {
    // Navigation links
    const openSettings = document.getElementById('openSettings');
if (openSettings) {
    openSettings.addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('settings'); // assuming 'settings' triggers the settings page render
    });

    const logoutUser = document.getElementById('logoutUser');
if (logoutUser) {
    logoutUser.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
}

}

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page !== currentPage) {
                loadPage(page);
            }
        });
    });

    // Add transaction button (if exists on this page)
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            // Reset form and set default date
            transactionForm.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();

            // Show modal
            transactionModal.classList.add('active');
        });
    }

    // Add first transaction button (empty state)
    const addFirstTransactionBtn = document.getElementById('addFirstTransactionBtn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', () => {
            // Reset form and set default date
            transactionForm.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();

            // Show modal
            transactionModal.classList.add('active');
        });
    }

    // Add budget button (if exists on this page)
    const addBudgetBtn = document.getElementById('addBudgetBtn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', () => {
            showToast('Add budget modal would open here', 'success');
        });
    }

    // Add another budget button
    const addAnotherBudgetBtn = document.getElementById('addAnotherBudgetBtn');
    if (addAnotherBudgetBtn) {
        addAnotherBudgetBtn.addEventListener('click', () => {
            showToast('Add budget modal would open here', 'success');
        });
    }

    // Add goal button (if exists on this page)
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            showToast('Add goal modal would open here', 'success');
        });
    }

    // Add first goal button (empty state)
    const addFirstGoalBtn = document.getElementById('addFirstGoalBtn');
    if (addFirstGoalBtn) {
        addFirstGoalBtn.addEventListener('click', () => {
            showToast('Add goal modal would open here', 'success');
        });
    }

    // Goal menu buttons
    for (let i = 1; i <= 3; i++) {
        const goalMenuBtn = document.getElementById(`goalMenuBtn${i}`);
        if (goalMenuBtn) {
            goalMenuBtn.addEventListener('click', () => {
                showToast(`Goal menu for goal ${i} would open here`, 'success');
            });
        }
    }


    

    // Transaction edit/delete buttons
    document.querySelectorAll('.transaction-item .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = btn.closest('.transaction-item').dataset.id;

            if (btn.classList.contains('edit')) {
                // Find transaction
                const transaction = transactions.find(t => t.id == transactionId);

                if (transaction) {
                    // Fill form with transaction data
                    document.getElementById('transactionName').value = transaction.name;
                    document.getElementById('transactionAmount').value = transaction.amount;
                    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
                    document.getElementById('transactionCategory').value = transaction.category;
                    document.getElementById('transactionDate').value = transaction.date;
                    document.getElementById('transactionNotes').value = transaction.notes || '';

                    // Change save button text
                    document.getElementById('saveTransactionBtn').textContent = 'Update Transaction';

                    // Show modal
                    transactionModal.classList.add('active');
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    // ❌ Your bug was not saving updated list back
            
                    transactions = transactions.filter(t => t.id != transactionId);
                    users[currentUser].transactions = transactions; // ✅ Update in users object
                    localStorage.setItem('users', JSON.stringify(users)); // ✅ Save to localStorage
            
                    loadPage(currentPage);
                    showToast('Transaction deleted successfully!', 'success');
                }
            }
            
        });
    });

    // Transaction item click
    document.querySelectorAll('.transaction-item').forEach(item => {
        item.addEventListener('click', () => {
            const transactionId = item.dataset.id;
            showToast(`Viewing details for transaction #${transactionId}`, 'success');
        });
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showToast(`Switched to ${tab.textContent} settings`, 'success');
        });
    });

    // Report tabs
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showToast(`Switched to ${tab.textContent} report`, 'success');
        });
    });

    const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterDateRange = document.getElementById('filterDateRange');

if (filterType && filterCategory && filterDateRange) {
    [filterType, filterCategory, filterDateRange].forEach(filter => {
        filter.addEventListener('change', () => {
            const type = filterType.value;
            const category = filterCategory.value;
            const dateRange = filterDateRange.value;

            const currentUser = localStorage.getItem('loggedInUser');
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const transactions = users[currentUser]?.transactions || [];

            const now = new Date();

            const filtered = transactions.filter(t => {
                const matchType = type === 'all' || t.type === type;
                const matchCategory = category === 'all' || t.category === category;

                let matchDate = true;
                const tDate = new Date(t.date);

                switch (dateRange) {
                    case '30':
                        matchDate = (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
                        break;
                    case 'this-month':
                        matchDate = tDate.getMonth() === now.getMonth() &&
                                    tDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last-month':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        matchDate = tDate.getMonth() === lastMonth.getMonth() &&
                                    tDate.getFullYear() === lastMonth.getFullYear();
                        break;
                }

                return matchType && matchCategory && matchDate;
            });

            // ✅ re-render only with filtered
            mainContent.innerHTML = getTransactionsContent(filtered);

            // 👇 Restore selected filter values
            setTimeout(() => {
                document.getElementById('filterType').value = type;
                document.getElementById('filterCategory').value = category;
                document.getElementById('filterDateRange').value = dateRange;
            }, 0);

            setupPageEvents(); // necessary after innerHTML replacement
        });
    });
}

    
    


    // Pagination buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            showToast('Loading previous page...', 'success');
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            showToast('Loading next page...', 'success');
        });
    }

    // Settings form
    const accountSettingsForm = document.getElementById('accountSettingsForm');
    if (accountSettingsForm) {
        accountSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Account settings saved!', 'success');
        });
    }

    // Cancel settings button
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', () => {
            showToast('Changes discarded', 'error');
        });
    }

    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            showToast('Avatar change dialog would open here', 'success');
        });
    }
}

// 🔍 Live search transactions by any parameter
// 🔍 Live search transactions by any parameter (fixed)
document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'searchTransactions') {
        const searchQuery = e.target.value.toLowerCase();
        const currentUser = localStorage.getItem('loggedInUser');
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const userData = users[currentUser] || {};
        const allTransactions = userData.transactions || [];

        const filtered = allTransactions.filter(t =>
            Object.values(t).some(value =>
                String(value).toLowerCase().includes(searchQuery)
            )
        );

        const inputVal = e.target.value;

        if (currentPage === 'dashboard') {
            mainContent.innerHTML = getDashboardContent(filtered);
        } else if (currentPage === 'transactions') {
            mainContent.innerHTML = getTransactionsContent(filtered);
        }

        setupPageEvents();

        const newInput = document.getElementById('searchTransactions');
        if (newInput) {
            newInput.value = inputVal;
            newInput.focus(); // optional: keep cursor focus
        }
    }
});



// Initialize the app
function initApp() {
    // Setup modal events
    setupModalEvents();

    // Load dashboard by default
    loadPage('dashboard');

    // Show welcome toast
    setTimeout(() => {
        showToast('Welcome to Spending Tracker!', 'success', 4000);
    }, 1000);

    // Apply saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
} else {
    document.body.classList.remove("dark-mode");
}

}

function renderDashboardCharts(transactions) {
    const ctxBalance = document.getElementById('balanceChart')?.getContext('2d');
    const ctxCategory = document.getElementById('expenseCategoryChart')?.getContext('2d');

    if (!ctxBalance || !ctxCategory) return;

    // 💰 Balance Over Time
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    const labels = [];
    const data = [];

    sortedTx.forEach(tx => {
        balance += tx.type === 'income' ? tx.amount : -tx.amount;
        labels.push(new Date(tx.date).toLocaleDateString());
        data.push(balance);
    });

    new Chart(ctxBalance, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Net Balance',
                data,
                fill: false,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });

    // 🥧 Expenses by Category
    const categoryMap = {};
    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
        }
    });

    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);

    new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryValues,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}


function renderReportsCharts(transactions) {
    if (window.categoryChart) window.categoryChart.destroy();
if (window.trendChart) window.trendChart.destroy();

    if (!window.Chart || !transactions) return;

    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dateLabels = [];
    const balanceData = [];
    const categoryTotals = {};
    let balance = 0;

    sorted.forEach(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString();
        if (!dateLabels.includes(dateStr)) {
            dateLabels.push(dateStr);
        }

        if (tx.type === 'income') balance += tx.amount;
        else {
            balance -= tx.amount;
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
        balanceData.push(balance);
    });

    const balanceCtx = document.getElementById('balanceTrendChart')?.getContext('2d');
    if (balanceCtx) {
        new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Net Balance',
                    data: balanceData,
                    borderWidth: 2,
                    borderColor: '#4BC0C0',
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    }

    const categoryCtx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#9966FF', '#4BC0C0', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}



// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);