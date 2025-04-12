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
                
                
                
            </div>
        </div>

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">All Transactions</h2>
                <div class="transaction-actions">
                    
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
}
*/
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
                
                <!-- 🚀 Chart Area -->
                <div class="chart-section">
                    <h3>Spending by Category</h3>
                    <canvas id="categoryChart" height="100"></canvas>

                    <h3 style="margin-top: 2rem;">Spending Over Time</h3>
                    <canvas id="trendChart" height="100"></canvas>
                </div>

                <!-- You can keep summary/details below -->
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
}

function renderReportsCharts(transactions) {
    const categoryTotals = {};
    const dailyTotals = {};

    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + tx.amount;
        }
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    const trendLabels = Object.keys(dailyTotals).sort();
    const trendData = trendLabels.map(date => dailyTotals[date]);

    // Doughnut Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // Line Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Daily Spending',
                data: trendData,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/*
function renderReportsCharts(transactions) {
    // Group by category
    const categoryTotals = {};
    const dailyTotals = {};

    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            // For doughnut chart
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

            // For line chart (by date)
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + tx.amount;
        }
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    const trendLabels = Object.keys(dailyTotals).sort(); // dates
    const trendData = trendLabels.map(date => dailyTotals[date]);

    // 🥯 Doughnut Chart - Spending by Category
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // 📈 Line Chart - Spending Over Time
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Daily Spending',
                data: trendData,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
*/
/*
function renderReportsCharts() {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const transactions = users[currentUser]?.transactions || [];

    // Group by category
    const categoryTotals = {};
    const dailyTotals = {};

    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            // Doughnut chart data
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

            // Line chart data
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + tx.amount;
        }
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    const trendLabels = Object.keys(dailyTotals).sort();
    const trendData = trendLabels.map(date => dailyTotals[date]);

    // 🥯 Doughnut Chart - Spending by Category
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // 📈 Line Chart - Spending Over Time
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [{
                    label: 'Daily Spending',
                    data: trendData,
                    borderColor: '#36A2EB',
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
*/
/*
function renderReportsCharts() {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userTransactions = users[currentUser]?.transactions || [];

    // Proceed only if we have valid data
    if (!userTransactions.length) {
        showToast('No transaction data available to render charts.', 'error');
        return;
    }

    // Group by category and date
    const categoryTotals = {};
    const dailyTotals = {};

    userTransactions.forEach(tx => {
        if (tx.type === 'expense') {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;

            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + tx.amount;
        }
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    const trendLabels = Object.keys(dailyTotals).sort();
    const trendData = trendLabels.map(date => dailyTotals[date]);

    // Doughnut chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
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

    // Line chart
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [{
                    label: 'Spending Over Time',
                    data: trendData,
                    borderColor: '#36A2EB',
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}
*/
function getReportsContent(transactions) {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const totalSpending = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const avgDaily = totalSpending / 30; // Defaulting to last 30 days
    const transactionCount = expenses.length;

    const categoryTotals = {};
    expenses.forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const topCategoriesHTML = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([category, amount]) => {
            const percent = ((amount / totalSpending) * 100).toFixed(1);
            return `<div class="category-item">
                        <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                        <span>${formatCurrency(amount)} (${percent}%)</span>
                    </div>`;
        }).join('');

    return `
        <div class="header">
            <h1 class="page-title">Reports</h1>
            <div class="header-actions">
                <button class="btn btn-outline"><i class="fas fa-download"></i> Export</button>
                <button class="btn btn-primary"><i class="fas fa-calendar"></i> Custom Range</button>
            </div>
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

                <div class="chart-section">
                    <h3>Spending by Category</h3>
                    <canvas id="categoryChart" height="100"></canvas>

                    <h3 style="margin-top: 2rem;">Spending Over Time</h3>
                    <canvas id="trendChart" height="100"></canvas>
                </div>

                <div class="report-details">
                    <div class="report-summary">
                        <h3>Summary</h3>
                        <div class="summary-item">
                            <span>Total Spending</span>
                            <span>${formatCurrency(totalSpending)}</span>
                        </div>
                        <div class="summary-item">
                            <span>Average Daily</span>
                            <span>${formatCurrency(avgDaily)}</span>
                        </div>
                        <div class="summary-item">
                            <span>Transactions</span>
                            <span>${transactionCount}</span>
                        </div>
                    </div>

                    <div class="report-categories">
                        <h3>Top Categories</h3>
                        ${topCategoriesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}



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

// Load page content dynamically

/*
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
                content = getReportsContent(transactions);
                break;
            case 'settings':
                content = getSettingsContent();
                break;
            default:
                content = getDashboardContent(transactions);
        }

        
        mainContent.innerHTML = content;

// 🟩 ADD THIS HERE
if (page === 'reports') {
    renderReportsCharts(transactions);
}

hideLoader();
setupPageEvents(); // Setup event listeners for the new content

        hideLoader();
        setupPageEvents(); // Setup event listeners for the new content
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
*/

function loadPage(page) {
    showLoader();
    currentPage = page;

    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userData = users[currentUser] || {};
    const transactions = userData.transactions || [];

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

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

    setTimeout(() => {
        let content = '';

        switch (page) {
            case 'dashboard':
                content = getDashboardContent(transactions);
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
                content = getReportsContent(transactions);
                break;
            case 'settings':
                content = getSettingsContent();
                break;
            default:
                content = getDashboardContent(transactions);
        }

        mainContent.innerHTML = content;

        // ✅ Chart render AFTER content is placed
        if (page === 'reports') {
            setTimeout(() => renderReportsCharts(transactions), 100);
        }

        setupPageEvents(); // Re-attach event listeners
        hideLoader();
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
/*
function setupPageEvents() {
    const openSettings = document.getElementById('openSettings');
    if (openSettings) {
        openSettings.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage('settings');
        });
    }

    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
        logoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page !== currentPage) loadPage(page);
        });
    });

    const openTransactionModal = () => {
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('saveTransactionBtn').textContent = 'Add Transaction';
        editTransactionId = null;
        transactionModal.classList.add('active');
    };

    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openTransactionModal);
    }

    const addFirstTransactionBtn = document.getElementById('addFirstTransactionBtn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', openTransactionModal);
    }

    document.querySelectorAll('.transaction-item .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = btn.closest('.transaction-item').dataset.id;

            if (btn.classList.contains('edit')) {
                const transaction = transactions.find(t => t.id == transactionId);
                if (transaction) {
                    editTransactionId = transaction.id;
                    document.getElementById('transactionName').value = transaction.name;
                    document.getElementById('transactionAmount').value = transaction.amount;
                    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
                    document.getElementById('transactionCategory').value = transaction.category;
                    document.getElementById('transactionDate').value = transaction.date;
                    document.getElementById('transactionNotes').value = transaction.notes || '';
                    document.getElementById('saveTransactionBtn').textContent = 'Update Transaction';
                    transactionModal.classList.add('active');
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    transactions = transactions.filter(t => t.id != transactionId);
                    users[currentUser].transactions = transactions;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadPage(currentPage);
                    showToast('Transaction deleted successfully!', 'success');
                }
            }
        });
    });

    transactionForm.onsubmit = function (e) {
        e.preventDefault();

        const name = document.getElementById('transactionName').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;

        if (!name || isNaN(amount) || !type || !category || !date) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editTransactionId !== null) {
            transactions = transactions.filter(t => t.id !== editTransactionId);
        }

        const newTransaction = {
            id: Date.now(),
            name,
            amount,
            type,
            category,
            date,
            notes
        };

        transactions.unshift(newTransaction);
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));

        transactionModal.classList.remove('active');
        transactionForm.reset();
        loadPage(currentPage);
        showToast(editTransactionId ? 'Transaction updated!' : 'Transaction added!', 'success');
        editTransactionId = null;
    };
}
*/
/*
function setupPageEvents() {
    // Settings navigation
    const openSettings = document.getElementById('openSettings');
    if (openSettings) {
        openSettings.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage('settings');
        });
    }

    // Logout functionality
    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
        logoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page !== currentPage) loadPage(page);
        });
    });

    // Transaction modal handling
    const openTransactionModal = () => {
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('saveTransactionBtn').textContent = 'Add Transaction';
        editTransactionId = null;
        transactionModal.classList.add('active');
    };

    // Add transaction buttons
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openTransactionModal);
    }

    const addFirstTransactionBtn = document.getElementById('addFirstTransactionBtn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', openTransactionModal);
    }

    // Transaction item actions (edit/delete)
    document.querySelectorAll('.transaction-item .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = parseInt(btn.closest('.transaction-item').dataset.id);

            if (btn.classList.contains('edit')) {
                const transaction = transactions.find(t => t.id === transactionId);
                if (transaction) {
                    editTransactionId = transaction.id;
                    document.getElementById('transactionName').value = transaction.name;
                    document.getElementById('transactionAmount').value = transaction.amount;
                    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
                    document.getElementById('transactionCategory').value = transaction.category;
                    document.getElementById('transactionDate').value = transaction.date;
                    document.getElementById('transactionNotes').value = transaction.notes || '';
                    document.getElementById('saveTransactionBtn').textContent = 'Update Transaction';
                    transactionModal.classList.add('active');
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    transactions = transactions.filter(t => t.id !== transactionId);
                    users[currentUser].transactions = transactions;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadPage(currentPage);
                    showToast('Transaction deleted successfully!', 'success');
                }
            }
        });
    });

    // Form submission handler
    transactionForm.onsubmit = function(e) {
        e.preventDefault();

        const name = document.getElementById('transactionName').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;

        if (!name || isNaN(amount) || !type || !category || !date) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editTransactionId !== null) {
            // Update existing transaction
            const transactionIndex = transactions.findIndex(t => t.id === editTransactionId);
            if (transactionIndex !== -1) {
                transactions[transactionIndex] = {
                    ...transactions[transactionIndex],
                    name,
                    amount,
                    type,
                    category,
                    date,
                    notes
                };
            }
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now(),
                name,
                amount,
                type,
                category,
                date,
                notes
            };
            transactions.unshift(newTransaction);
        }

        // Save to storage
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));

        // Reset and close
        transactionModal.classList.remove('active');
        transactionForm.reset();
        loadPage(currentPage);
        showToast(editTransactionId ? 'Transaction updated!' : 'Transaction added!', 'success');
        editTransactionId = null;
    };

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}
*/

/*
function setupPageEvents() {
    // Settings navigation
    const openSettings = document.getElementById('openSettings');
    if (openSettings) {
        openSettings.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage('settings');
        });
    }

    // Logout functionality
    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
        logoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page !== currentPage) loadPage(page);
        });
    });

    // Transaction modal handling
    const openTransactionModal = () => {
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('saveTransactionBtn').textContent = 'Add Transaction';
        editTransactionId = null;
        transactionModal.classList.add('active');
    };

    // Add transaction buttons
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openTransactionModal);
    }

    const addFirstTransactionBtn = document.getElementById('addFirstTransactionBtn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', openTransactionModal);
    }

    // Transaction item actions (edit/delete)
    document.querySelectorAll('.transaction-item .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = parseInt(btn.closest('.transaction-item').dataset.id);

            if (btn.classList.contains('edit')) {
                const transaction = transactions.find(t => t.id === transactionId);
                if (transaction) {
                    editTransactionId = transaction.id;
                    document.getElementById('transactionName').value = transaction.name;
                    document.getElementById('transactionAmount').value = transaction.amount;
                    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
                    document.getElementById('transactionCategory').value = transaction.category;
                    document.getElementById('transactionDate').value = transaction.date;
                    document.getElementById('transactionNotes').value = transaction.notes || '';
                    document.getElementById('saveTransactionBtn').textContent = 'Update Transaction';
                    transactionModal.classList.add('active');
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    transactions = transactions.filter(t => t.id !== transactionId);
                    users[currentUser].transactions = transactions;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadPage(currentPage);
                    showToast('Transaction deleted successfully!', 'success');
                }
            }
        });
    });

    // Form submission handler - NEW APPROACH
    transactionForm.onsubmit = function(e) {
        e.preventDefault();

        const name = document.getElementById('transactionName').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;

        if (!name || isNaN(amount) || !type || !category || !date) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editTransactionId !== null) {
            // 1. Find the original transaction
            const originalIndex = transactions.findIndex(t => t.id === editTransactionId);
            if (originalIndex === -1) {
                showToast('Transaction not found!', 'error');
                return;
            }

            // 2. Create edited version
            const editedTransaction = {
                ...transactions[originalIndex], // Copy all original properties
                name,
                amount,
                type,
                category,
                date,
                notes
            };

            // 3. Remove original and insert edited version at same position
            transactions.splice(originalIndex, 1, editedTransaction);
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now(),
                name,
                amount,
                type,
                category,
                date,
                notes
            };
            transactions.unshift(newTransaction);
        }

        // Save to storage
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));

        // Reset and close
        transactionModal.classList.remove('active');
        transactionForm.reset();
        loadPage(currentPage);
        showToast(editTransactionId ? 'Transaction updated!' : 'Transaction added!', 'success');
        editTransactionId = null;
    };

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}*/

function setupPageEvents() {
    // Settings navigation
    const openSettings = document.getElementById('openSettings');
    if (openSettings) {
        openSettings.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage('settings');
        });
    }

    // Logout functionality
    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
        logoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page !== currentPage) loadPage(page);
        });
    });

    // Transaction modal handling
    const openTransactionModal = () => {
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('saveTransactionBtn').textContent = 'Add Transaction';
        editTransactionId = null;
        transactionModal.classList.add('active');
    };

    // Add transaction buttons
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openTransactionModal);
    }

    const addFirstTransactionBtn = document.getElementById('addFirstTransactionBtn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', openTransactionModal);
    }

    // Transaction item actions (edit/delete)
    document.querySelectorAll('.transaction-item .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = parseInt(btn.closest('.transaction-item').dataset.id);

            if (btn.classList.contains('edit')) {
                const transaction = transactions.find(t => t.id === transactionId);
                if (transaction) {
                    editTransactionId = transaction.id;
                    document.getElementById('transactionName').value = transaction.name;
                    document.getElementById('transactionAmount').value = transaction.amount;
                    document.querySelector(`input[name="transactionType"][value="${transaction.type}"]`).checked = true;
                    document.getElementById('transactionCategory').value = transaction.category;
                    document.getElementById('transactionDate').value = transaction.date;
                    document.getElementById('transactionNotes').value = transaction.notes || '';
                    document.getElementById('saveTransactionBtn').textContent = 'Update Transaction';
                    transactionModal.classList.add('active');
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    transactions = transactions.filter(t => t.id !== transactionId);
                    users[currentUser].transactions = transactions;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadPage(currentPage);
                    showToast('Transaction deleted successfully!', 'success');
                }
            }
        });
    });

    // Form submission handler - FINAL CORRECTED VERSION
    transactionForm.onsubmit = function(e) {
        e.preventDefault();

        // Get all form values
        const name = document.getElementById('transactionName').value.trim();
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.querySelector('input[name="transactionType"]:checked')?.value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value.trim();

        // Validate all required fields
        if (!name || isNaN(amount) || !type || !category || !date) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            if (editTransactionId !== null) {
                // EDIT EXISTING TRANSACTION
                // 1. Find the original transaction index
                const originalIndex = transactions.findIndex(t => t.id === editTransactionId);
                if (originalIndex === -1) {
                    throw new Error('Transaction not found');
                }

                // 2. Create the edited transaction (keeping same ID)
                const editedTransaction = {
                    id: editTransactionId, // Keep original ID
                    name,
                    amount,
                    type,
                    category,
                    date,
                    notes
                };

                // 3. Remove old transaction and insert edited one at same position
                transactions.splice(originalIndex, 1, editedTransaction);
                
                showToast('Transaction updated successfully!', 'success');
            } else {
                // ADD NEW TRANSACTION
                const newTransaction = {
                    id: Date.now(), // Generate new unique ID
                    name,
                    amount,
                    type,
                    category,
                    date,
                    notes
                };
                transactions.unshift(newTransaction);
                showToast('Transaction added successfully!', 'success');
            }

            // Update storage and UI
            users[currentUser].transactions = transactions;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Reset form and close modal
            transactionModal.classList.remove('active');
            transactionForm.reset();
            loadPage(currentPage);
            editTransactionId = null;

        } catch (error) {
            console.error('Transaction error:', error);
            showToast('Failed to save transaction: ' + error.message, 'error');
        }
    };

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}



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

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);