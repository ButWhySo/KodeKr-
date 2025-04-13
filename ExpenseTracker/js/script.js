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
    const currency = localStorage.getItem('currency') || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    });
    return formatter.format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

// Get relative time (e.g., "2 days ago")
function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
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
    const monthlyStats = calculateMonthlyStats(transactions);

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
                <div class="card-footer ${totals.balance >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${totals.balance >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(totals.balance / totals.income * 100).toFixed(1)}% of income
                </div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Total Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
                <div class="card-footer positive">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.incomeGrowth}% vs last month
                </div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Total Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
                <div class="card-footer negative">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.expenseGrowth}% vs last month
                </div>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="balanceTrendChart"></canvas>
        </div>
        <div class="statistics-section">
            <div class="stat-card">
                <div class="stat-title">Average Daily Spending</div>
                <div class="stat-value">${formatCurrency(monthlyStats.avgDailySpending)}</div>
                <div class="stat-change ${monthlyStats.avgDailySpendingChange >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${monthlyStats.avgDailySpendingChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(monthlyStats.avgDailySpendingChange)}% vs last month
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Largest Expense</div>
                <div class="stat-value">${formatCurrency(monthlyStats.largestExpense)}</div>
                <div class="stat-change">${monthlyStats.largestExpenseCategory}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Savings Rate</div>
                <div class="stat-value">${monthlyStats.savingsRate}%</div>
                <div class="stat-change ${monthlyStats.savingsRateChange >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${monthlyStats.savingsRateChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(monthlyStats.savingsRateChange)}% vs last month
                </div>
            </div>
        </div>
        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">Recent Transactions</h2>
                <div class="transaction-actions">
                    <button class="btn btn-primary" id="addTransactionBtn">
                        <i class="fas fa-plus"></i> Add Transaction
                    </button>
            </div>
        </div>
            ${generateTransactionList(transactions.slice(0, 5))}
        </div>
    `;
}

*/// working , but without charts
function getDashboardContent(filteredTransactions) {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const allTransactions = users[currentUser]?.transactions || [];

    const totals = calculateTotals(allTransactions); // full data for totals
    const monthlyStats = calculateMonthlyStats(allTransactions);

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
                <div class="card-footer ${totals.balance >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${totals.balance >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(totals.balance / totals.income * 100).toFixed(1)}% of income
                </div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Total Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
                <div class="card-footer positive">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.incomeGrowth}% vs last month
                </div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Total Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
                <div class="card-footer negative">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.expenseGrowth}% vs last month
                </div>
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
    const currentUser = localStorage.getItem('loggedInUser');
    const budgets = JSON.parse(localStorage.getItem(`${currentUser}_budgets`) || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const transactions = users[currentUser]?.transactions || [];
    
    // Calculate monthly spending by category
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear && 
               t.type === 'expense';
    });
    
    const spendingByCategory = {};
    monthlyTransactions.forEach(t => {
        if (!spendingByCategory[t.category]) {
            spendingByCategory[t.category] = 0;
        }
        spendingByCategory[t.category] += t.amount;
    });
    
    return `
        <div class="page-header">
            <h1>Budgets & Calculators</h1>
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="budgets">Budgets</button>
                <button class="tab-btn" data-tab="calculators">Calculators</button>
                </div>
        </div>
        
        <div class="tab-content active" id="budgets-tab">
            <div class="budget-header">
                <h2>Monthly Budgets</h2>
                <button class="btn btn-primary" id="addBudgetBtn">
                    <i class="fas fa-plus"></i> Add Budget
                </button>
        </div>

        <div class="budgets-container">
                ${budgets.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-chart-pie"></i>
                        <p>No budgets set yet. Create your first budget to start tracking your spending.</p>
                        <button class="btn btn-primary" id="createFirstBudgetBtn">
                            <i class="fas fa-plus"></i> Create First Budget
                    </button>
                </div>
                ` : `
                    <div class="budget-grid">
                        ${budgets.map(budget => {
                            const spent = spendingByCategory[budget.category] || 0;
                            const percentage = Math.min((spent / budget.amount) * 100, 100);
                            const statusClass = percentage >= 100 ? 'danger' : 
                                               percentage >= 80 ? 'warning' : 'success';
                            
                            return `
                                <div class="budget-card" data-id="${budget.id}">
                    <div class="budget-header">
                                        <div class="budget-icon">
                                            <i class="fas ${getCategoryIcon(budget.category)}"></i>
                                        </div>
                                        <div class="budget-title">
                                            <h3>${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</h3>
                                            <p>${formatCurrency(budget.amount)} / month</p>
                                        </div>
                                        <div class="budget-actions">
                                            <button class="action-btn edit" title="Edit Budget">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete" title="Delete Budget">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                    </div>
                    <div class="budget-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
                    </div>
                                        <div class="progress-stats">
                                            <span>${formatCurrency(spent)} spent</span>
                                            <span>${formatCurrency(budget.amount - spent)} remaining</span>
                    </div>
                </div>
                    </div>
                            `;
                        }).join('')}
                    </div>
                `}
                    </div>
                </div>
                
        <div class="tab-content" id="calculators-tab">
            <div class="calculators-container">
                <div class="calculator-card">
                    <h3>EMI Calculator</h3>
                    <form id="emiCalculatorForm">
                        <div class="form-group">
                            <label for="loanAmount">Loan Amount</label>
                            <input type="number" id="loanAmount" class="form-control" required min="0" step="1">
                    </div>
                        <div class="form-group">
                            <label for="interestRate">Interest Rate (%)</label>
                            <input type="number" id="interestRate" class="form-control" required min="0" step="0.1">
                    </div>
                        <div class="form-group">
                            <label for="loanTerm">Loan Term (Years)</label>
                            <input type="number" id="loanTerm" class="form-control" required min="1" >
                    </div>
                        <button type="submit" class="btn btn-primary">Calculate EMI</button>
                    </form>
                    <div id="emiResult" class="calculator-result"></div>
                </div>
                
                <div class="calculator-card">
                    <h3>Tax Calculator</h3>
                    <form id="taxCalculatorForm">
                        <div class="form-group">
                            <label for="annualIncome">Annual Income</label>
                            <input type="number" id="annualIncome" class="form-control" required min="0" step="1">
                    </div>
                        <div class="form-group">
                            <label for="taxRate">Tax Rate (%)</label>
                            <input type="number" id="taxRate" class="form-control" required min="0" step="0.1">
                    </div>
                        <button type="submit" class="btn btn-primary">Calculate Tax</button>
                    </form>
                    <div id="taxResult" class="calculator-result"></div>
                    </div>
                
                <div class="calculator-card">
                    <h3>Savings Goal Calculator</h3>
                    <form id="savingsCalculatorForm">
                        <div class="form-group">
                            <label for="targetAmount">Target Amount</label>
                            <input type="number" id="targetAmount" class="form-control" required min="0" step="1">
                </div>
                        <div class="form-group">
                            <label for="timeframe">Timeframe (Months)</label>
                            <input type="number" id="timeframe" class="form-control" required min="1" >
            </div>
                        <div class="form-group">
                            <label for="interestRateSavings">Interest Rate (%)</label>
                            <input type="number" id="interestRateSavings" class="form-control" required min="0" step="0.1">
        </div>
                        <button type="submit" class="btn btn-primary">Calculate Savings</button>
                    </form>
                    <div id="savingsResult" class="calculator-result"></div>
                </div>
            </div>
        </div>
        
        <style>
            .page-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .tab-buttons {
                display: flex;
                gap: 0.5rem;
                background: var(--card-bg);
                padding: 0.25rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .tab-btn {
                padding: 0.5rem 1rem;
                border: none;
                background: transparent;
                color: var(--text-color);
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .tab-btn.active {
                background: var(--primary-color);
                color: white;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .budget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .budget-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1rem;
            }
            
            .budget-card {
                background: var(--card-bg);
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .budget-card .budget-header {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .budget-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
            }
            
            .budget-title {
                flex: 1;
            }
            
            .budget-title h3 {
                margin: 0;
                font-size: 1.1rem;
            }
            
            .budget-title p {
                margin: 0;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            
            .budget-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .budget-progress {
                margin-top: 1rem;
            }
            
            .progress-bar {
                height: 8px;
                background: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            
            .progress-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .progress-fill.success {
                background: var(--success-color);
            }
            
            .progress-fill.warning {
                background: var(--warning-color);
            }
            
            .progress-fill.danger {
                background: var(--danger-color);
            }
            
            .progress-stats {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
                color: var(--text-muted);
            }
            
            .empty-state {
                text-align: center;
                padding: 2rem;
                background: var(--card-bg);
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .empty-state i {
                font-size: 3rem;
                color: var(--text-muted);
                margin-bottom: 1rem;
            }
            
            .empty-state p {
                color: var(--text-muted);
                margin-bottom: 1.5rem;
            }
            
            .calculators-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
            }
            
            .calculator-card {
                background: var(--card-bg);
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .calculator-card h3 {
                margin-top: 0;
                margin-bottom: 1.5rem;
                color: var(--text-color);
            }
            
            .calculator-result {
                margin-top: 1.5rem;
                padding: 1rem;
                background: var(--bg-color);
                border-radius: 6px;
                display: none;
            }
            
            .calculator-result.active {
                display: block;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }
            
            .form-control {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--input-bg);
                color: var(--text-color);
            }
            
            .btn {
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: var(--primary-color);
                color: white;
                border: none;
            }
            
            .btn:hover {
                opacity: 0.9;
            }
        </style>
    `;
}

// Goals content
function getGoalsContent() {
    const currentUser = localStorage.getItem('loggedInUser');
    const goals = JSON.parse(localStorage.getItem(`${currentUser}_goals`) || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const transactions = users[currentUser]?.transactions || [];
    
    // Calculate total savings from transactions
    const totalSavings = transactions.reduce((sum, tx) => {
        if (tx.type === 'income') {
            return sum + tx.amount;
        }
        return sum - tx.amount;
    }, 0);
    
    return `
        <div class="header">
        <h1 class="page-title">Financial Goals</h1>
            <div class="header-actions">
                <button class="btn btn-primary" id="addGoalBtn">
                <i class="fas fa-plus"></i> Add Goal
                </button>
            </div>
        </div>

        <div class="goals-container">
        <div class="goals-overview">
            <div class="overview-card">
                <h3>Total Savings</h3>
                <div class="overview-value">${formatCurrency(totalSavings)}</div>
                <div class="overview-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${Math.min((totalSavings / 10000) * 100, 100)}%"></div>
                    </div>
                    <span class="progress-label">Progress to $10,000</span>
                </div>
            </div>
            
            <div class="overview-card">
                <h3>Active Goals</h3>
                <div class="overview-value">${goals.length}</div>
                <div class="overview-stats">
                    <div class="stat-item">
                        <span>Completed</span>
                        <span>${goals.filter(g => g.progress >= 100).length}</span>
                    </div>
                    <div class="stat-item">
                        <span>In Progress</span>
                        <span>${goals.filter(g => g.progress < 100).length}</span>
                        </div>
                        </div>
                    </div>
                    </div>
        
        ${goals.length === 0 ? `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <h3 class="empty-title">No goals set</h3>
                <p class="empty-text">Set financial goals to track your progress</p>
                <button class="btn btn-primary" id="createFirstGoalBtn">
                    <i class="fas fa-plus"></i> Create Goal
                </button>
            </div>
        ` : `
            <div class="goals-grid">
                ${goals.map(goal => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    const status = progress >= 100 ? 'completed' : progress >= 75 ? 'near-complete' : 'in-progress';
                    const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return `
                        <div class="goal-card ${status}" data-id="${goal.id}">
                            <div class="goal-header">
                                <h3>${goal.name}</h3>
                    <div class="goal-icon">
                                    <i class="fas ${getGoalIcon(goal.type)}"></i>
                    </div>
                            </div>
                        <div class="goal-progress">
                                <div class="progress-bar">
                                    <div class="progress" style="width: ${progress}%"></div>
                        </div>
                                <div class="goal-amounts">
                                    <span>${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
                                    <span class="goal-percentage">${Math.round(progress)}%</span>
                        </div>
                    </div>
                    <div class="goal-details">
                                <div class="detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${daysLeft} days left</span>
                        </div>
                                <div class="detail-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span>${goal.type}</span>
                        </div>
                    </div>
                            <div class="goal-footer">
                    <div class="goal-actions">
                                    <button class="action-btn edit" data-id="${goal.id}">
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                    <button class="action-btn delete" data-id="${goal.id}">
                                        <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
                    `;
                }).join('')}
                </div>
        `}
        </div>
    `;
}

function getGoalIcon(type) {
    switch (type) {
        case 'savings': return 'fa-piggy-bank';
        case 'debt': return 'fa-credit-card';
        case 'investment': return 'fa-chart-line';
        case 'purchase': return 'fa-shopping-cart';
        default: return 'fa-bullseye';
    }
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
        if (tx.type === 'income') balance += tx.amount;
        else {
            balance -= tx.amount;
            categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
        }

        dateLabels.push(new Date(tx.date).toLocaleDateString());
        balanceData.push(balance);
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
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    
    return `
        <div class="header">
            <h1 class="page-title">Settings</h1>
        </div>
        <div class="settings-container">
        <div class="settings-section">
            <h2 class="section-title">Appearance</h2>
            <div class="settings-group">
                <label class="settings-label">Theme</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="lightTheme" name="theme" value="light" ${savedTheme === 'light' ? 'checked' : ''}>
                        <label for="lightTheme" class="radio-label">
                            <i class="fas fa-sun"></i>
                            Light
                        </label>
            </div>
                    <div class="radio-option">
                        <input type="radio" id="darkTheme" name="theme" value="dark" ${savedTheme === 'dark' ? 'checked' : ''}>
                        <label for="darkTheme" class="radio-label">
                            <i class="fas fa-moon"></i>
                            Dark
                        </label>
                            </div>
                        </div>
                        </div>
                    </div>
                    
        <div class="settings-section">
            <h2 class="section-title">Preferences</h2>
            <div class="settings-group">
                <label class="settings-label">Currency</label>
                <select id="currencySelect" class="form-control form-select">
                    <option value="USD" ${savedCurrency === 'USD' ? 'selected' : ''}>USD - US Dollar ($)</option>
                    <option value="EUR" ${savedCurrency === 'EUR' ? 'selected' : ''}>EUR - Euro (€)</option>
                    <option value="GBP" ${savedCurrency === 'GBP' ? 'selected' : ''}>GBP - British Pound (£)</option>
                    <option value="JPY" ${savedCurrency === 'JPY' ? 'selected' : ''}>JPY - Japanese Yen (¥)</option>
                    <option value="AUD" ${savedCurrency === 'AUD' ? 'selected' : ''}>AUD - Australian Dollar (A$)</option>
                    <option value="CAD" ${savedCurrency === 'CAD' ? 'selected' : ''}>CAD - Canadian Dollar (C$)</option>
                    <option value="CHF" ${savedCurrency === 'CHF' ? 'selected' : ''}>CHF - Swiss Franc (Fr)</option>
                    <option value="CNY" ${savedCurrency === 'CNY' ? 'selected' : ''}>CNY - Chinese Yuan (¥)</option>
                    <option value="INR" ${savedCurrency === 'INR' ? 'selected' : ''}>INR - Indian Rupee (₹)</option>
                    <option value="BRL" ${savedCurrency === 'BRL' ? 'selected' : ''}>BRL - Brazilian Real (R$)</option>
                    <option value="RUB" ${savedCurrency === 'RUB' ? 'selected' : ''}>RUB - Russian Ruble (₽)</option>
                    <option value="KRW" ${savedCurrency === 'KRW' ? 'selected' : ''}>KRW - South Korean Won (₩)</option>
                    <option value="SGD" ${savedCurrency === 'SGD' ? 'selected' : ''}>SGD - Singapore Dollar (S$)</option>
                    <option value="NZD" ${savedCurrency === 'NZD' ? 'selected' : ''}>NZD - New Zealand Dollar (NZ$)</option>
                    <option value="MXN" ${savedCurrency === 'MXN' ? 'selected' : ''}>MXN - Mexican Peso (Mex$)</option>
                    <option value="HKD" ${savedCurrency === 'HKD' ? 'selected' : ''}>HKD - Hong Kong Dollar (HK$)</option>
                    <option value="TRY" ${savedCurrency === 'TRY' ? 'selected' : ''}>TRY - Turkish Lira (₺)</option>
                    <option value="SAR" ${savedCurrency === 'SAR' ? 'selected' : ''}>SAR - Saudi Riyal (﷼)</option>
                    <option value="AED" ${savedCurrency === 'AED' ? 'selected' : ''}>AED - UAE Dirham (د.إ)</option>
                    <option value="SEK" ${savedCurrency === 'SEK' ? 'selected' : ''}>SEK - Swedish Krona (kr)</option>
                    <option value="NOK" ${savedCurrency === 'NOK' ? 'selected' : ''}>NOK - Norwegian Krone (kr)</option>
                    <option value="DKK" ${savedCurrency === 'DKK' ? 'selected' : ''}>DKK - Danish Krone (kr)</option>
                    <option value="PLN" ${savedCurrency === 'PLN' ? 'selected' : ''}>PLN - Polish Złoty (zł)</option>
                    <option value="THB" ${savedCurrency === 'THB' ? 'selected' : ''}>THB - Thai Baht (฿)</option>
                    <option value="IDR" ${savedCurrency === 'IDR' ? 'selected' : ''}>IDR - Indonesian Rupiah (Rp)</option>
                    <option value="HUF" ${savedCurrency === 'HUF' ? 'selected' : ''}>HUF - Hungarian Forint (Ft)</option>
                    <option value="CZK" ${savedCurrency === 'CZK' ? 'selected' : ''}>CZK - Czech Koruna (Kč)</option>
                    <option value="ILS" ${savedCurrency === 'ILS' ? 'selected' : ''}>ILS - Israeli Shekel (₪)</option>
                    <option value="CLP" ${savedCurrency === 'CLP' ? 'selected' : ''}>CLP - Chilean Peso ($)</option>
                    <option value="PHP" ${savedCurrency === 'PHP' ? 'selected' : ''}>PHP - Philippine Peso (₱)</option>
                    <option value="AED" ${savedCurrency === 'AED' ? 'selected' : ''}>AED - UAE Dirham (د.إ)</option>
                    <option value="COP" ${savedCurrency === 'COP' ? 'selected' : ''}>COP - Colombian Peso ($)</option>
                    <option value="SAR" ${savedCurrency === 'SAR' ? 'selected' : ''}>SAR - Saudi Riyal (﷼)</option>
                    <option value="MYR" ${savedCurrency === 'MYR' ? 'selected' : ''}>MYR - Malaysian Ringgit (RM)</option>
                    <option value="RON" ${savedCurrency === 'RON' ? 'selected' : ''}>RON - Romanian Leu (lei)</option>
                        </select>
                    </div>
                    </div>
                    
        <div class="settings-section">
            <h2 class="section-title">Data Management</h2>
            <div class="settings-group">
                <button class="btn btn-outline" id="exportDataBtn">
                    <i class="fas fa-download"></i> Export Data
                        </button>
                <button class="btn btn-outline" id="importDataBtn">
                    <i class="fas fa-upload"></i> Import Data
                </button>
                <button class="btn btn-outline" id="clearDataBtn">
                    <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
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
            showGoalModal();
        });
    }

    // Create first goal button (empty state)
    const createFirstGoalBtn = document.getElementById('createFirstGoalBtn');
    if (createFirstGoalBtn) {
        createFirstGoalBtn.addEventListener('click', () => {
            showGoalModal();
        });
    }

    // Goal edit/delete buttons
    document.querySelectorAll('.goal-card .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const goalId = parseInt(btn.closest('.goal-card').dataset.id);
            const currentUser = localStorage.getItem('loggedInUser');
            const goals = JSON.parse(localStorage.getItem(`${currentUser}_goals`) || '[]');
            const goal = goals.find(g => g.id === goalId);
            
            if (btn.classList.contains('edit')) {
                if (goal) {
                    showGoalModal(goal);
                }
            } else if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this goal?')) {
                    const updatedGoals = goals.filter(g => g.id !== goalId);
                    localStorage.setItem(`${currentUser}_goals`, JSON.stringify(updatedGoals));
                    loadPage('goals');
                    showToast('Goal deleted successfully', 'success');
                }
            }
        });
    });

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

    // Add search handler
    const searchInput = document.getElementById('searchTransactions');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Add settings events setup
    if (currentPage === 'settings') {
        setupSettingsEvents();
    }

    // Report period select
    const reportPeriodSelect = document.getElementById('reportPeriod');
    if (reportPeriodSelect) {
        reportPeriodSelect.addEventListener('change', () => {
            const selectedRange = reportPeriodSelect.value;
            const currentUser = localStorage.getItem('loggedInUser');
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const transactions = users[currentUser]?.transactions || [];
            
            const filtered = filterByReportPeriod(transactions, selectedRange);
            renderReportsCharts(filtered);
            showToast(`Report period changed to ${selectedRange}`, 'success');
        });
    }

    // Budget tabs
    const budgetTabs = document.querySelectorAll('.budget-tab');
    if (budgetTabs.length > 0) {
        budgetTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and sections
                document.querySelectorAll('.budget-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.budget-section').forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding section
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-section`).classList.add('active');
            });
        });
    }

    // EMI Calculator
    const emiCalculatorForm = document.getElementById('emiCalculatorForm');
    if (emiCalculatorForm) {
        emiCalculatorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const loanAmount = parseFloat(document.getElementById('loanAmount').value);
            const interestRate = parseFloat(document.getElementById('interestRate').value);
            const loanTerm = parseInt(document.getElementById('loanTerm').value);
            
            // Calculate EMI
            const monthlyRate = interestRate / 12 / 100;
            const numberOfPayments = loanTerm * 12;
            const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            const totalPayment = emi * numberOfPayments;
            const totalInterest = totalPayment - loanAmount;
            
            // Display result
            const emiResult = document.getElementById('emiResult');
            emiResult.innerHTML = `
                <h4>EMI Calculation Result</h4>
                <div class="result-item">
                    <span>Monthly EMI:</span>
                    <strong>${formatCurrency(emi)}</strong>
                </div>
                <div class="result-item">
                    <span>Total Payment:</span>
                    <strong>${formatCurrency(totalPayment)}</strong>
                </div>
                <div class="result-item">
                    <span>Total Interest:</span>
                    <strong>${formatCurrency(totalInterest)}</strong>
                </div>
            `;
            emiResult.classList.add('active');
        });
    }

    // Tax Calculator
    const taxCalculatorForm = document.getElementById('taxCalculatorForm');
    if (taxCalculatorForm) {
        taxCalculatorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const annualIncome = parseFloat(document.getElementById('annualIncome').value);
            const taxRate = parseFloat(document.getElementById('taxRate').value);
            
            // Calculate tax using user-provided tax rate
            const tax = annualIncome * (taxRate / 100);
            const takeHomePay = annualIncome - tax;
            
            // Display result
            const taxResult = document.getElementById('taxResult');
            taxResult.innerHTML = `
                <h4>Tax Calculation Result</h4>
                <div class="result-item">
                    <span>Annual Income:</span>
                    <strong>${formatCurrency(annualIncome)}</strong>
                </div>
                <div class="result-item">
                    <span>Tax Rate:</span>
                    <strong>${taxRate}%</strong>
                </div>
                <div class="result-item">
                    <span>Estimated Tax:</span>
                    <strong>${formatCurrency(tax)}</strong>
                </div>
                <div class="result-item">
                    <span>Take Home Pay:</span>
                    <strong>${formatCurrency(takeHomePay)}</strong>
                </div>
            `;
            taxResult.classList.add('active');
        });
    }

    // Savings Goal Calculator
    const savingsCalculatorForm = document.getElementById('savingsCalculatorForm');
    if (savingsCalculatorForm) {
        savingsCalculatorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const targetAmount = parseFloat(document.getElementById('targetAmount').value);
            const timeframe = parseInt(document.getElementById('timeframe').value);
            const interestRate = parseFloat(document.getElementById('interestRateSavings').value);
            
            // Calculate monthly savings needed
            const monthlyRate = interestRate / 12 / 100;
            const months = timeframe;
            
            let monthlySavings;
            if (interestRate > 0) {
                monthlySavings = targetAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            } else {
                monthlySavings = targetAmount / months;
            }
            
            const totalSavings = monthlySavings * months;
            const interestEarned = totalSavings - targetAmount;
            
            // Display result
            const savingsResult = document.getElementById('savingsResult');
            savingsResult.innerHTML = `
                <h4>Savings Goal Calculation Result</h4>
                <div class="result-item">
                    <span>Monthly Savings Needed:</span>
                    <strong>${formatCurrency(monthlySavings)}</strong>
                </div>
                <div class="result-item">
                    <span>Total Amount Saved:</span>
                    <strong>${formatCurrency(totalSavings)}</strong>
                </div>
                <div class="result-item">
                    <span>Interest Earned:</span>
                    <strong>${formatCurrency(interestEarned)}</strong>
                </div>
            `;
            savingsResult.classList.add('active');
        });
    }

    // Budget tab buttons
    if (currentPage === 'budgets') {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Add budget button
        const addBudgetBtn = document.getElementById('addBudgetBtn');
        const createFirstBudgetBtn = document.getElementById('createFirstBudgetBtn');
        
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => {
                showBudgetModal();
            });
        }
        
        if (createFirstBudgetBtn) {
            createFirstBudgetBtn.addEventListener('click', () => {
                showBudgetModal();
            });
        }
        
        // Budget edit/delete buttons
        document.querySelectorAll('.budget-card .action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const budgetId = parseInt(btn.closest('.budget-card').dataset.id);
                const currentUser = localStorage.getItem('loggedInUser');
                const budgets = JSON.parse(localStorage.getItem(`${currentUser}_budgets`) || '[]');
                const budget = budgets.find(b => b.id === budgetId);
                
                if (btn.classList.contains('edit')) {
                    if (budget) {
                        showBudgetModal(budget);
                    }
                } else if (btn.classList.contains('delete')) {
                    if (confirm('Are you sure you want to delete this budget?')) {
                        const updatedBudgets = budgets.filter(b => b.id !== budgetId);
                        localStorage.setItem(`${currentUser}_budgets`, JSON.stringify(updatedBudgets));
                        loadPage('budgets');
                        showToast('Budget deleted successfully', 'success');
                    }
                }
            });
        });
        
        // EMI Calculator
        const emiCalculatorForm = document.getElementById('emiCalculatorForm');
        if (emiCalculatorForm) {
            emiCalculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const loanAmount = parseFloat(document.getElementById('loanAmount').value);
                const interestRate = parseFloat(document.getElementById('interestRate').value);
                const loanTerm = parseInt(document.getElementById('loanTerm').value);
                
                // Calculate EMI
                const monthlyRate = interestRate / 12 / 100;
                const numberOfPayments = loanTerm * 12;
                const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
                const totalPayment = emi * numberOfPayments;
                const totalInterest = totalPayment - loanAmount;
                
                // Display result
                const emiResult = document.getElementById('emiResult');
                emiResult.innerHTML = `
                    <h4>EMI Calculation Result</h4>
                    <div class="result-item">
                        <span>Monthly EMI:</span>
                        <strong>${formatCurrency(emi)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Total Payment:</span>
                        <strong>${formatCurrency(totalPayment)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Total Interest:</span>
                        <strong>${formatCurrency(totalInterest)}</strong>
                    </div>
                `;
                emiResult.classList.add('active');
            });
        }
        
        // Tax Calculator
        const taxCalculatorForm = document.getElementById('taxCalculatorForm');
        if (taxCalculatorForm) {
            taxCalculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const annualIncome = parseFloat(document.getElementById('annualIncome').value);
                const taxRate = parseFloat(document.getElementById('taxRate').value);
                
                // Calculate tax using user-provided tax rate
                const tax = annualIncome * (taxRate / 100);
                const takeHomePay = annualIncome - tax;
                
                // Display result
                const taxResult = document.getElementById('taxResult');
                taxResult.innerHTML = `
                    <h4>Tax Calculation Result</h4>
                    <div class="result-item">
                        <span>Annual Income:</span>
                        <strong>${formatCurrency(annualIncome)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Tax Rate:</span>
                        <strong>${taxRate}%</strong>
                    </div>
                    <div class="result-item">
                        <span>Estimated Tax:</span>
                        <strong>${formatCurrency(tax)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Take Home Pay:</span>
                        <strong>${formatCurrency(takeHomePay)}</strong>
                    </div>
                `;
                taxResult.classList.add('active');
            });
        }
        
        // Savings Goal Calculator
        const savingsCalculatorForm = document.getElementById('savingsCalculatorForm');
        if (savingsCalculatorForm) {
            savingsCalculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const targetAmount = parseFloat(document.getElementById('targetAmount').value);
                const timeframe = parseInt(document.getElementById('timeframe').value);
                const interestRate = parseFloat(document.getElementById('interestRateSavings').value);
                
                // Calculate monthly savings needed
                const monthlyRate = interestRate / 12 / 100;
                const months = timeframe;
                
                let monthlySavings;
                if (interestRate > 0) {
                    monthlySavings = targetAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
                } else {
                    monthlySavings = targetAmount / months;
                }
                
                const totalSavings = monthlySavings * months;
                const interestEarned = totalSavings - targetAmount;
                
                // Display result
                const savingsResult = document.getElementById('savingsResult');
                savingsResult.innerHTML = `
                    <h4>Savings Goal Calculation Result</h4>
                    <div class="result-item">
                        <span>Monthly Savings Needed:</span>
                        <strong>${formatCurrency(monthlySavings)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Total Amount Saved:</span>
                        <strong>${formatCurrency(totalSavings)}</strong>
                    </div>
                    <div class="result-item">
                        <span>Interest Earned:</span>
                        <strong>${formatCurrency(interestEarned)}</strong>
                    </div>
                `;
                savingsResult.classList.add('active');
            });
        }
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
                borderWidth: 2,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
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

    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let balance = 0;
    const dateLabels = [];
    const balanceData = [];
    const categoryTotals = {};

    sorted.forEach(tx => {
        // Update balance
        balance += tx.type === 'income' ? tx.amount : -tx.amount;
        
        // Add date and balance to arrays
        dateLabels.push(formatDate(tx.date));
        balanceData.push(balance);

        // Update category totals for expenses
        if (tx.type === 'expense') {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
    });

    // Balance Trend Chart
    const balanceCtx = document.getElementById('balanceTrendChart')?.getContext('2d');
    if (balanceCtx) {
        window.trendChart = new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Net Balance',
                    data: balanceData,
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
                                return `Balance: ${formatCurrency(context.raw)}`;
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

    // Category Pie Chart
    const categoryCtx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (categoryCtx) {
        window.categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
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
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
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
}

// Search functionality with debounce
let searchTimeout;
function handleSearch(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredTransactions = transactions.filter(t => 
            t.name.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm) ||
            t.notes?.toLowerCase().includes(searchTerm)
        );
        updateCurrentPageContent(filteredTransactions);
    }, 300);
}

// Add the calculateMonthlyStats function
function calculateMonthlyStats(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
    });
    
    const currentMonthExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const lastMonthExpenses = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const currentMonthIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const lastMonthIncome = lastMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const avgDailySpending = currentMonthExpenses / daysInMonth;
    const lastMonthAvgDailySpending = lastMonthExpenses / new Date(currentYear, currentMonth, 0).getDate();
    
    const largestExpense = Math.max(...currentMonthTransactions
        .filter(t => t.type === 'expense')
        .map(t => t.amount));
        
    const largestExpenseTransaction = currentMonthTransactions
        .find(t => t.amount === largestExpense);
    
    return {
        avgDailySpending,
        avgDailySpendingChange: ((avgDailySpending - lastMonthAvgDailySpending) / lastMonthAvgDailySpending * 100) || 0,
        largestExpense,
        largestExpenseCategory: largestExpenseTransaction?.category || 'N/A',
        savingsRate: currentMonthIncome ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome * 100) : 0,
        savingsRateChange: lastMonthIncome ? 
            (((currentMonthIncome - currentMonthExpenses) / currentMonthIncome * 100) - 
            ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome * 100)) : 0,
        incomeGrowth: lastMonthIncome ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0,
        expenseGrowth: lastMonthExpenses ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0
    };
}


// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Show main content
function showMainContent() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <button class="hamburger-btn" id="hamburgerBtn">
            <i class="fas fa-bars"></i>
        </button>
        <div class="mobile-menu" id="mobileMenu">
            <div class="sidebar-header">
                <h2>ExpenseTracker</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active" data-page="dashboard">
                    <i class="fas fa-home"></i> Dashboard
                </a>
                <a href="#" class="nav-item" data-page="transactions">
                    <i class="fas fa-exchange-alt"></i> Transactions
                </a>
                <a href="#" class="nav-item" data-page="budget">
                    <i class="fas fa-wallet"></i> Budget
                </a>
                <a href="#" class="nav-item" data-page="goals">
                    <i class="fas fa-bullseye"></i> Goals
                </a>
                <a href="#" class="nav-item" data-page="reports">
                    <i class="fas fa-chart-bar"></i> Reports
                </a>
                <a href="#" class="nav-item" data-page="settings">
                    <i class="fas fa-cog"></i> Settings
                </a>
            </nav>
            <div class="sidebar-footer">
                <button id="logoutBtn" class="btn btn-outline">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
        <div class="main-content">
            <div class="topbar">
                <div class="user-info">
                    <span>Welcome, ${currentUser}</span>
                </div>
                <div class="theme-toggle">
                    <button id="themeToggle" class="btn btn-icon">
                        <i class="fas fa-moon"></i>
                    </button>
                </div>
            </div>
            <div id="pageContent"></div>
        </div>
    `;

    // Setup navigation events
    setupNavigationEvents();
    setupThemeToggle();
    setupHamburgerMenu();
    loadPage('dashboard');
}

// Setup hamburger menu
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    let menuTimeout;

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            
            // Clear any existing timeout
            if (menuTimeout) {
                clearTimeout(menuTimeout);
            }
            
            // Set new timeout to close menu after 4 seconds
            menuTimeout = setTimeout(() => {
                mobileMenu.classList.remove('active');
            }, 4000);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }
}

// Update the getDashboardContent function to use floating action button
function getDashboardContent(filteredTransactions) {
    const currentUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const allTransactions = users[currentUser]?.transactions || [];

    const totals = calculateTotals(allTransactions);
    const monthlyStats = calculateMonthlyStats(allTransactions);

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
                <div class="card-footer ${totals.balance >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${totals.balance >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(totals.balance / totals.income * 100).toFixed(1)}% of income
                </div>
            </div>

            <div class="card card-income">
                <div class="card-header">
                    <h3 class="card-title">Total Income</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.income)}</div>
                <div class="card-footer positive">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.incomeGrowth}% vs last month
                </div>
            </div>

            <div class="card card-expense">
                <div class="card-header">
                    <h3 class="card-title">Total Expenses</h3>
                    <div class="card-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div class="card-value">${formatCurrency(totals.expenses)}</div>
                <div class="card-footer negative">
                    <i class="fas fa-arrow-up"></i>
                    ${monthlyStats.expenseGrowth}% vs last month
                </div>
            </div>
        </div>

        <div class="transactions-container">
            <div class="transactions-header">
                <h2 class="section-title">Recent Transactions</h2>
            </div>
            ${generateTransactionList(filteredTransactions)}
        </div>

        <button class="floating-action-btn" id="addTransactionBtn">
            <i class="fas fa-plus"></i>
        </button>
    `;
}

function calculateFinancialStats(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense').map(t => t.amount);
    const incomes = transactions.filter(t => t.type === 'income').map(t => t.amount);

    const calculateStats = (values) => {
        if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return {
            mean,
            stdDev,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    };

    return {
        expenses: calculateStats(expenses),
        incomes: calculateStats(incomes)
    };
}

function getReportsContent(transactions = []) {
    const stats = calculateFinancialStats(transactions);
    
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
            <div class="chart-section">
                <h3>Balance Over Time</h3>
                <canvas id="balanceTrendChart" height="100"></canvas>

                <h3 style="margin-top: 2rem;">Expenses by Category</h3>
                <div style="width: 50%; margin: 0 auto;">
                    <canvas id="categoryPieChart" height="100"></canvas>
                </div>
            </div>

            <div class="statistics-section">
                <div class="stat-card">
                    <h3>Income Statistics</h3>
                    <div class="stat-item">
                        <span>Average Income:</span>
                        <span>${formatCurrency(stats.incomes.mean)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Standard Deviation:</span>
                        <span>${formatCurrency(stats.incomes.stdDev)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Range:</span>
                        <span>${formatCurrency(stats.incomes.min)} - ${formatCurrency(stats.incomes.max)}</span>
                    </div>
                </div>

                <div class="stat-card">
                    <h3>Expense Statistics</h3>
                    <div class="stat-item">
                        <span>Average Expense:</span>
                        <span>${formatCurrency(stats.expenses.mean)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Standard Deviation:</span>
                        <span>${formatCurrency(stats.expenses.stdDev)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Range:</span>
                        <span>${formatCurrency(stats.expenses.min)} - ${formatCurrency(stats.expenses.max)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Settings event handlers
function setupSettingsEvents() {
    // Theme radio buttons
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.body.classList.toggle('dark-mode', theme === 'dark');
            localStorage.setItem('theme', theme);
            showToast(`Theme changed to ${theme} mode`, 'success');
        });
    });

    // Currency select
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            const currency = e.target.value;
            localStorage.setItem('currency', currency);
            showToast(`Currency changed to ${currency}`, 'success');
            // Refresh the current page to update currency display
            loadPage(currentPage);
        });
    }

    // Export data button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            const currentUser = localStorage.getItem('loggedInUser');
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const userData = users[currentUser] || {};
            
            const exportData = {
                transactions: userData.transactions || [],
                budgets: JSON.parse(localStorage.getItem(`${currentUser}_budgets`) || '[]'),
                goals: JSON.parse(localStorage.getItem(`${currentUser}_goals`) || '[]'),
                settings: {
                    theme: localStorage.getItem('theme'),
                    currency: localStorage.getItem('currency')
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showToast('Data exported successfully', 'success');
        });
    }

    // Import data button
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        const currentUser = localStorage.getItem('loggedInUser');
                        
                        // Update user data
                        const users = JSON.parse(localStorage.getItem('users') || '{}');
                        users[currentUser] = {
                            ...users[currentUser],
                            transactions: importedData.transactions || []
                        };
                        localStorage.setItem('users', JSON.stringify(users));
                        
                        // Update budgets and goals
                        localStorage.setItem(`${currentUser}_budgets`, JSON.stringify(importedData.budgets || []));
                        localStorage.setItem(`${currentUser}_goals`, JSON.stringify(importedData.goals || []));
                        
                        // Update settings
                        if (importedData.settings) {
                            Object.entries(importedData.settings).forEach(([key, value]) => {
                                localStorage.setItem(key, value);   
                            });
                        }
                        
                        showToast('Data imported successfully', 'success');
                        // Refresh the current page to update displays
                        loadPage(currentPage);
                    } catch (error) {
                        showToast('Error importing data: Invalid file format', 'error');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        });
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                const currentUser = localStorage.getItem('loggedInUser');
                
                // Clear user-specific data
                const users = JSON.parse(localStorage.getItem('users') || '{}');
                users[currentUser] = {
                    ...users[currentUser],
                    transactions: []
                };
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.removeItem(`${currentUser}_budgets`);
                localStorage.removeItem(`${currentUser}_goals`);
                
                showToast('All data cleared successfully', 'success');
                loadPage(currentPage);
            }
        });
    }
}

// Function to show goal modal (updated to handle both create and edit)
function showGoalModal(goal = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${goal ? 'Edit Goal' : 'Create New Goal'}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="goalForm">
                <div class="form-group">
                    <label>Goal Name</label>
                    <input type="text" id="goalName" class="form-control" value="${goal ? goal.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Target Amount</label>
                    <input type="number" id="goalTarget" class="form-control" value="${goal ? goal.target : ''}" required>
                </div>
                <div class="form-group">
                    <label>Current Amount</label>
                    <input type="number" id="goalCurrent" class="form-control" value="${goal ? goal.current : ''}" required>
                </div>
                <div class="form-group">
                    <label>Goal Type</label>
                    <select id="goalType" class="form-control" required>
                        <option value="savings" ${goal && goal.type === 'savings' ? 'selected' : ''}>Savings</option>
                        <option value="debt" ${goal && goal.type === 'debt' ? 'selected' : ''}>Debt Repayment</option>
                        <option value="investment" ${goal && goal.type === 'investment' ? 'selected' : ''}>Investment</option>
                        <option value="purchase" ${goal && goal.type === 'purchase' ? 'selected' : ''}>Major Purchase</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Deadline</label>
                    <input type="date" id="goalDeadline" class="form-control" value="${goal ? goal.deadline : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancelGoal">Cancel</button>
                    <button type="submit" class="btn btn-primary">${goal ? 'Update Goal' : 'Create Goal'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeModal = () => {
        modal.remove();
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('#cancelGoal').addEventListener('click', closeModal);
    
    // Form submission
    const goalForm = modal.querySelector('#goalForm');
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = localStorage.getItem('loggedInUser');
        const goals = JSON.parse(localStorage.getItem(`${currentUser}_goals`) || '[]');
        
        const goalData = {
            id: goal ? goal.id : Date.now(),
            name: document.getElementById('goalName').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            current: parseFloat(document.getElementById('goalCurrent').value),
            type: document.getElementById('goalType').value,
            deadline: document.getElementById('goalDeadline').value
        };
        
        if (goal) {
            // Update existing goal
            const index = goals.findIndex(g => g.id === goal.id);
            if (index !== -1) {
                goals[index] = goalData;
            }
        } else {
            // Add new goal
            goals.push(goalData);
        }
        
        localStorage.setItem(`${currentUser}_goals`, JSON.stringify(goals));
        
        closeModal();
        loadPage('goals');
        showToast(`Goal ${goal ? 'updated' : 'created'} successfully`, 'success');
    });
}

// Function to show transaction modal (updated to handle both create and edit)
function showTransactionModal(transaction = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="transactionForm" class="transaction-form">
                <div class="form-group">
                    <label for="transactionName">Name</label>
                    <input type="text" id="transactionName" class="form-control" value="${transaction ? transaction.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="transactionAmount">Amount</label>
                    <input type="number" id="transactionAmount" class="form-control" value="${transaction ? transaction.amount : ''}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="transactionType" value="income" ${transaction && transaction.type === 'income' ? 'checked' : ''}>
                            <span>Income</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="transactionType" value="expense" ${!transaction || transaction.type === 'expense' ? 'checked' : ''}>
                            <span>Expense</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="transactionCategory">Category</label>
                    <select id="transactionCategory" class="form-control" required>
                        <option value="food" ${transaction && transaction.category === 'food' ? 'selected' : ''}>Food</option>
                        <option value="shopping" ${transaction && transaction.category === 'shopping' ? 'selected' : ''}>Shopping</option>
                        <option value="bills" ${transaction && transaction.category === 'bills' ? 'selected' : ''}>Bills</option>
                        <option value="transport" ${transaction && transaction.category === 'transport' ? 'selected' : ''}>Transport</option>
                        <option value="entertainment" ${transaction && transaction.category === 'entertainment' ? 'selected' : ''}>Entertainment</option>
                        <option value="other" ${transaction && transaction.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="transactionDate">Date</label>
                    <input type="date" id="transactionDate" class="form-control" value="${transaction ? transaction.date : new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="transactionNotes">Notes</label>
                    <textarea id="transactionNotes" class="form-control" rows="3">${transaction ? transaction.notes || '' : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancelTransaction">Cancel</button>
                    <button type="submit" class="btn btn-primary">${transaction ? 'Update Transaction' : 'Add Transaction'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeModal = () => {
        modal.remove();
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('#cancelTransaction').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Form submission
    const transactionForm = modal.querySelector('#transactionForm');
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = localStorage.getItem('loggedInUser');
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        let transactions = users[currentUser]?.transactions || [];
        
        const transactionData = {
            id: transaction ? transaction.id : Date.now(),
            name: document.getElementById('transactionName').value.trim(),
            amount: parseFloat(document.getElementById('transactionAmount').value),
            type: document.querySelector('input[name="transactionType"]:checked').value,
            category: document.getElementById('transactionCategory').value,
            date: document.getElementById('transactionDate').value,
            notes: document.getElementById('transactionNotes').value.trim()
        };
        
        if (transaction) {
            // Delete the original transaction
            transactions = transactions.filter(t => t.id !== transaction.id);
            // Add the new transaction with the same ID
            transactions.unshift(transactionData);
        } else {
            // Add new transaction
            transactions.unshift(transactionData);
        }
        
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));
        
        closeModal();
        loadPage(currentPage);
        showToast(`Transaction ${transaction ? 'updated' : 'added'} successfully`, 'success');
    });

    // Add CSS styles for the modal
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background: var(--bg-color);
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-20px);
            transition: transform 0.3s ease;
        }
        
        .modal.active .modal-content {
            transform: translateY(0);
        }
        
        .modal-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: var(--text-color);
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-color);
            padding: 0.5rem;
        }
        
        .transaction-form {
            padding: 1rem;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-color);
        }
        
        .form-control {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--input-bg);
            color: var(--text-color);
        }
        
        .radio-group {
            display: flex;
            gap: 1rem;
        }
        
        .radio-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: var(--primary-color);
            color: white;
            border: none;
        }
        
        .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        textarea.form-control {
            resize: vertical;
            min-height: 80px;
        }
    `;
    document.head.appendChild(style);
}

// Function to show budget modal
function showBudgetModal(budget = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${budget ? 'Edit Budget' : 'Create New Budget'}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="budgetForm">
                <div class="form-group">
                    <label for="budgetCategory">Category</label>
                    <select id="budgetCategory" class="form-control" required>
                        <option value="food" ${budget && budget.category === 'food' ? 'selected' : ''}>Food</option>
                        <option value="shopping" ${budget && budget.category === 'shopping' ? 'selected' : ''}>Shopping</option>
                        <option value="bills" ${budget && budget.category === 'bills' ? 'selected' : ''}>Bills</option>
                        <option value="transport" ${budget && budget.category === 'transport' ? 'selected' : ''}>Transport</option>
                        <option value="entertainment" ${budget && budget.category === 'entertainment' ? 'selected' : ''}>Entertainment</option>
                        <option value="other" ${budget && budget.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="budgetAmount">Monthly Budget Amount</label>
                    <input type="number" id="budgetAmount" class="form-control" value="${budget ? budget.amount : ''}" required min="0" step="0.01">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancelBudget">Cancel</button>
                    <button type="submit" class="btn btn-primary">${budget ? 'Update Budget' : 'Create Budget'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeModal = () => {
        modal.remove();
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('#cancelBudget').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Form submission
    const budgetForm = modal.querySelector('#budgetForm');
    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = localStorage.getItem('loggedInUser');
        const budgets = JSON.parse(localStorage.getItem(`${currentUser}_budgets`) || '[]');
        
        const budgetData = {
            id: budget ? budget.id : Date.now(),
            category: document.getElementById('budgetCategory').value,
            amount: parseFloat(document.getElementById('budgetAmount').value)
        };
        
        if (budget) {
            // Update existing budget
            const index = budgets.findIndex(b => b.id === budget.id);
            if (index !== -1) {
                budgets[index] = budgetData;
            }
        } else {
            // Add new budget
            budgets.push(budgetData);
        }
        
        localStorage.setItem(`${currentUser}_budgets`, JSON.stringify(budgets));
        
        closeModal();
        loadPage('budgets');
        showToast(`Budget ${budget ? 'updated' : 'created'} successfully`, 'success');
    });
}