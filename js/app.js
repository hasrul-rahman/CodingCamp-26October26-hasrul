/**
 * Expense & Budget Visualizer
 * Single-page application for tracking and visualizing expenses
 */

/* ========================================================================= */
/* 1. CONSTANTS & CONFIG */
/* ========================================================================= */

// Storage keys for Local Storage
const STORAGE_KEYS = {
  TRANSACTIONS: 'expense_transactions',
  THEME: 'expense_theme',
  CUSTOM_CATEGORIES: 'expense_custom_categories'
};

// Predefined categories
const CATEGORIES = ['Food', 'Transport', 'Fun'];

// Error Types
const ErrorTypes = {
  EMPTY_NAME: 'empty_name',
  EMPTY_AMOUNT: 'empty_amount',
  EMPTY_CATEGORY: 'empty_category',
  INVALID_AMOUNT: 'invalid_amount',
  NEGATIVE_AMOUNT: 'negative_amount',
  INVALID_CATEGORY: 'invalid_category'
};

// Error Messages
const ErrorMessages = {
  [ErrorTypes.EMPTY_NAME]: 'Please enter an item name',
  [ErrorTypes.EMPTY_AMOUNT]: 'Please enter an amount',
  [ErrorTypes.EMPTY_CATEGORY]: 'Please select a category',
  [ErrorTypes.INVALID_AMOUNT]: 'Please enter a valid amount',
  [ErrorTypes.NEGATIVE_AMOUNT]: 'Amount must be positive',
  [ErrorTypes.INVALID_CATEGORY]: 'Please select a valid category'
};

// Performance targets (milliseconds)
const PERFORMANCE_TARGETS = {
  ADD_TRANSACTION_MS: 200,
  DELETE_TRANSACTION_MS: 200,
  RENDER_100_TRANSACTIONS_MS: 1000,
  RENDER_1000_TRANSACTIONS_MS: 2000,
  CHART_UPDATE_MS: 200,
  BALANCE_UPDATE_MS: 100
};

/* ========================================================================= */
/* 2. VALIDATION MODULE */
/* ========================================================================= */

const Validator = {
  /**
   * Validate transaction data from form
   * @param {Object} data - Transaction data with itemName, amount, category
   * @returns {Object} Validation result with valid, transaction (if valid), and error (if invalid)
   */
  validateTransaction(data) {
    const { itemName, amount, category } = data;
    
    // Validate item name
    if (!this.isNameValid(itemName)) {
      return {
        valid: false,
        error: {
          field: 'itemName',
          message: ErrorMessages[ErrorTypes.EMPTY_NAME],
          code: ErrorTypes.EMPTY_NAME
        }
      };
    }
    
    // Validate amount
    const amountValidation = this.isAmountValid(amount);
    if (!amountValidation.valid) {
      return {
        valid: false,
        error: {
          field: 'amount',
          message: amountValidation.message,
          code: amountValidation.code
        }
      };
    }
    
    // Validate category
    if (!this.isCategoryValid(category)) {
      return {
        valid: false,
        error: {
          field: 'category',
          message: ErrorMessages[ErrorTypes.EMPTY_CATEGORY],
          code: ErrorTypes.EMPTY_CATEGORY
        }
      };
    }
    
    // All validations passed - create transaction object
    return {
      valid: true,
      transaction: {
        id: this.generateUUID(),
        itemName: itemName.trim(),
        amount: parseFloat(amount),
        category: category,
        timestamp: Date.now()
      }
    };
  },
  
  /**
   * Validate item name
   * @param {string} name - Item name to validate
   * @returns {boolean} True if name is valid (non-empty, max 100 chars)
   */
  isNameValid(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 100;
  },
  
  /**
   * Validate amount string
   * @param {string} amount - Amount string to validate
   * @returns {Object} Validation result with valid boolean, message, and code
   */
  isAmountValid(amount) {
    if (!amount || typeof amount !== 'string') {
      return {
        valid: false,
        message: ErrorMessages[ErrorTypes.EMPTY_AMOUNT],
        code: ErrorTypes.EMPTY_AMOUNT
      };
    }
    
    const trimmed = amount.trim();
    if (trimmed === '') {
      return {
        valid: false,
        message: ErrorMessages[ErrorTypes.EMPTY_AMOUNT],
        code: ErrorTypes.EMPTY_AMOUNT
      };
    }
    
    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      return {
        valid: false,
        message: ErrorMessages[ErrorTypes.INVALID_AMOUNT],
        code: ErrorTypes.INVALID_AMOUNT
      };
    }
    
    // Check for positive amount
    if (!this.isAmountPositive(num)) {
      return {
        valid: false,
        message: ErrorMessages[ErrorTypes.NEGATIVE_AMOUNT],
        code: ErrorTypes.NEGATIVE_AMOUNT
      };
    }
    
    return { valid: true };
  },
  
  /**
   * Check if amount is positive
   * @param {number} amount - Amount to check
   * @returns {boolean} True if amount is positive
   */
  isAmountPositive(amount) {
    return amount > 0;
  },
  
  /**
   * Validate category
   * @param {string} category - Category to validate
   * @returns {boolean} True if category is valid
   */
  isCategoryValid(category) {
    if (!category || typeof category !== 'string') {
      return false;
    }
    return category.trim().length > 0;
  },
  
  /**
   * Generate UUID v4
   * @returns {string} UUID v4 string
   */
  generateUUID() {
    // Simple UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

/* ========================================================================= */
/* 3. MONTHLY FILTERING MODULE */
/* ========================================================================= */

const MonthlyFilter = {
  /**
   * Get current month and year as object
   * @returns {Object} { year: number, month: number (0-11) }
   */
  getCurrentMonth() {
    const date = new Date();
    return {
      year: date.getFullYear(),
      month: date.getMonth()
    };
  },
  
  /**
   * Get the number of days in a specific month/year
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {number} Number of days in the month
   */
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },
  
  /**
   * Check if a timestamp falls within a specific month/year
   * @param {number} timestamp - Unix timestamp
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {boolean} True if timestamp falls within the month
   */
  isWithinMonth(timestamp, year, month) {
    const date = new Date(timestamp);
    return date.getFullYear() === year && date.getMonth() === month;
  },
  
  /**
   * Filter transactions by month and year
   * @param {Array} transactions - Array of transaction objects
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Array} Filtered array of transactions
   */
  filterByMonth(transactions, year, month) {
    return transactions.filter(tx => {
      return this.isWithinMonth(tx.timestamp, year, month);
    });
  },
  
  /**
   * Filter transactions by current month
   * @param {Array} transactions - Array of transaction objects
   * @returns {Array} Filtered array of transactions
   */
  filterByCurrentMonth(transactions) {
    const currentMonth = this.getCurrentMonth();
    return this.filterByMonth(transactions, currentMonth.year, currentMonth.month);
  },
  
  /**
   * Calculate monthly totals by category
   * @param {Array} transactions - Array of transaction objects
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Object} Object mapping category names to totals
   */
  getCategoryTotalsByMonth(transactions, year, month) {
    const filteredTransactions = this.filterByMonth(transactions, year, month);
    return this.calculateCategoryTotals(filteredTransactions);
  },
  
  /**
   * Calculate category totals from transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Object mapping category names to totals
   */
  calculateCategoryTotals(transactions) {
    const totals = {};
    
    transactions.forEach(tx => {
      const category = tx.category;
      
      if (!totals[category]) {
        totals[category] = 0;
      }
      
      totals[category] += tx.amount;
    });
    
    return totals;
  },
  
  /**
   * Get monthly summary data
   * @param {Array} transactions - Array of transaction objects
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Object} Summary object with total, categories, and filtered transactions
   */
  getSummary(transactions, year, month) {
    const filteredTransactions = this.filterByMonth(transactions, year, month);
    const total = this.calculateTotal(filteredTransactions);
    const categories = this.calculateCategoryTotals(filteredTransactions);
    
    return {
      year,
      month,
      total,
      categories,
      transactionCount: filteredTransactions.length
    };
  },
  
  /**
   * Calculate total amount from transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {number} Total amount
   */
  calculateTotal(transactions) {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }
};

/* ========================================================================= */
/* 4. LOCAL STORAGE MODULE */
/* ========================================================================= */

const Storage = {
  /**
   * Save transactions to Local Storage
   * @param {Array} transactions - Array of transaction objects
   */
  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.warn('Failed to save transactions:', error);
      throw error;
    }
  },
  
  /**
   * Load transactions from Local Storage
   * @returns {Array} Array of transaction objects or empty array
   */
  getTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load transactions:', error);
      return [];
    }
  },
  
  /**
   * Clear all transactions from Local Storage
   */
  clearTransactions() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    } catch (error) {
      console.warn('Failed to clear transactions:', error);
    }
  },
  
  /**
   * Save theme preference to Local Storage
   * @param {string} theme - 'light' or 'dark'
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  },
  
  /**
   * Load theme preference from Local Storage
   * @returns {string} 'light', 'dark', or null
   */
  getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME);
    } catch (error) {
      console.warn('Failed to load theme:', error);
      return null;
    }
  },
  
  /**
   * Save custom categories to Local Storage
   * @param {Array} categories - Array of category strings
   */
  saveCustomCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.warn('Failed to save custom categories:', error);
    }
  },
  
  /**
   * Load custom categories from Local Storage
   * @returns {Array} Array of category strings or null
   */
  getCustomCategories() {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    } catch (error) {
      console.warn('Failed to load custom categories:', error);
      return null;
    }
  }
};

/* ========================================================================= */
/* 5. STATE MANAGEMENT MODULE */
/* ========================================================================= */

const AppState = {
  transactions: [],
  theme: 'light',
  customCategories: [],
  
  /**
   * Initialize state from Local Storage
   */
  load() {
    this.transactions = Storage.getTransactions() || [];
    const savedTheme = Storage.getTheme();
    if (savedTheme) {
      this.theme = savedTheme;
    }
    const savedCategories = Storage.getCustomCategories();
    if (savedCategories) {
      this.customCategories = JSON.parse(savedCategories);
    }
  },
  
  /**
   * Save current state to Local Storage
   */
  save() {
    Storage.saveTransactions(this.transactions);
    Storage.saveTheme(this.theme);
    if (this.customCategories.length > 0) {
      Storage.saveCustomCategories(this.customCategories);
    }
  },
  
  /**
   * Add a new transaction
   * @param {Object} transaction - Transaction object
   */
  addTransaction(transaction) {
    this.transactions.push(transaction);
    this.save();
  },
  
  /**
   * Remove a transaction by ID
   * @param {string} id - Transaction ID
   */
  removeTransaction(id) {
    this.transactions = this.transactions.filter(tx => tx.id !== id);
    this.save();
  },
  
  /**
   * Set theme preference
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    this.theme = theme;
    Storage.saveTheme(theme);
  },
  
  /**
   * Get total balance (sum of all transaction amounts)
   * @returns {number} Total balance
   */
  getBalance() {
    return this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  },
  
  /**
   * Get expense totals by category
   * @returns {Object} Object mapping category names to totals
   */
  getCategoryTotals() {
    const totals = {};
    this.transactions.forEach(tx => {
      if (!totals[tx.category]) {
        totals[tx.category] = 0;
      }
      totals[tx.category] += tx.amount;
    });
    return totals;
  },
  
  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|undefined} Transaction object or undefined
   */
  getTransactionById(id) {
    return this.transactions.find(tx => tx.id === id);
  },
  
  /**
   * Get monthly summary data
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Object} Summary object with total, categories, and filtered transactions
   */
  getMonthlySummary(year, month) {
    return MonthlyFilter.getSummary(this.transactions, year, month);
  },
  
  /**
   * Get current month's summary
   * @returns {Object} Summary object for current month
   */
  getCurrentMonthSummary() {
    const currentMonth = MonthlyFilter.getCurrentMonth();
    return this.getMonthlySummary(currentMonth.year, currentMonth.month);
  },
  
  /**
   * Filter transactions by month and year
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Array} Filtered array of transactions
   */
  filterByMonth(year, month) {
    return MonthlyFilter.filterByMonth(this.transactions, year, month);
  },
  
  /**
   * Filter transactions by current month
   * @returns {Array} Filtered array of transactions for current month
   */
  filterByCurrentMonth() {
    return MonthlyFilter.filterByCurrentMonth(this.transactions);
  },
  
  /**
   * Get category totals for a specific month
   * @param {number} year - Target year
   * @param {number} month - Target month (0-11)
   * @returns {Object} Object mapping category names to totals
   */
  getCategoryTotalsByMonth(year, month) {
    return MonthlyFilter.getCategoryTotalsByMonth(this.transactions, year, month);
  }
};

/* ========================================================================= */
/* 5. DOM MANAGEMENT MODULE */
/* ========================================================================= */

const DOM = {
  elements: null,
  
  /**
   * Initialize DOM element references
   */
  init() {
    this.elements = {
      form: document.getElementById('transaction-form'),
      itemName: document.getElementById('item-name'),
      amount: document.getElementById('amount'),
      category: document.getElementById('category'),
      transactionList: document.getElementById('transaction-list'),
      balanceDisplay: document.getElementById('balance-display'),
      modeToggle: document.getElementById('mode-toggle'),
      chartCanvas: document.getElementById('expense-chart'),
      errorMessage: document.getElementById('error-message'),
      // Monthly summary elements
      monthlySummarySection: document.getElementById('monthly-summary-section'),
      prevMonthBtn: document.getElementById('prev-month-btn'),
      nextMonthBtn: document.getElementById('next-month-btn'),
      currentMonthDisplay: document.getElementById('current-month'),
      monthSelector: document.getElementById('month-selector'),
      monthlyTotal: document.getElementById('monthly-total'),
      categoryBreakdownList: document.getElementById('category-breakdown-list')
    };
  },
  
  /**
   * Format date for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date string
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  },
  
  /**
   * Render a single transaction item
   * @param {Object} tx - Transaction object
   * @returns {HTMLElement} DOM element for the transaction
   */
  renderTransaction(tx) {
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.dataset.id = tx.id;
    
    item.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-name">${this.escapeHtml(tx.itemName)}</span>
        <span class="transaction-category">${tx.category}</span>
        <span class="transaction-date">${this.formatDate(tx.timestamp)}</span>
      </div>
      <div class="transaction-amount">$${tx.amount.toFixed(2)}</div>
      <button class="delete-btn" data-id="${tx.id}">Delete</button>
    `;
    
    return item;
  },
  
  /**
   * Render all transactions
   * @param {Array} transactions - Array of transaction objects
   */
  renderTransactionList(transactions) {
    this.elements.transactionList.innerHTML = '';
    transactions.forEach(tx => {
      this.elements.transactionList.appendChild(this.renderTransaction(tx));
    });
  },
  
  /**
   * Update transaction list DOM with current state
   */
  updateTransactionList() {
    this.renderTransactionList(AppState.transactions);
  },
  
  /**
   * Update balance display
   * @param {number} balance - Total balance
   */
  updateBalance(balance) {
    this.elements.balanceDisplay.textContent = `$${balance.toFixed(2)}`;
  },
  
  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.hidden = false;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideError();
    }, 3000);
  },
  
  /**
   * Hide error message
   */
  hideError() {
    this.elements.errorMessage.hidden = true;
  },
  
  /**
   * Clear form fields
   */
  clearForm() {
    this.elements.itemName.value = '';
    this.elements.amount.value = '';
    this.elements.category.value = '';
  },
  
  /**
   * Update theme classes on document element
   * @param {string} theme - 'light' or 'dark'
   */
  updateTheme(theme) {
    document.documentElement.className = theme;
  },
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

/* ========================================================================= */
/* 6. CHART MANAGEMENT MODULE */
/* ========================================================================= */

const ChartManager = {
  chart: null,
  isMobile: false,
  
  /**
   * Check if device is mobile
   * @returns {boolean} True if device is mobile
   */
  checkMobile() {
    this.isMobile = window.innerWidth <= 480;
    return this.isMobile;
  },
  
  /**
   * Initialize Chart.js
   * @param {string} canvasId - ID of canvas element
   */
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('Chart canvas not found:', canvasId);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Failed to get canvas context');
      return;
    }
    
    // Check if mobile for responsive configuration
    this.checkMobile();
    
    // Setup mobile-specific legend configuration
    const legendPosition = this.isMobile ? 'bottom' : 'bottom';
    const legendAlign = this.isMobile ? 'center' : 'start';
    
    // Initialize chart (will be fully configured later)
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 200
        },
        layout: {
          padding: this.isMobile ? 8 : 16
        },
        plugins: {
          legend: {
            position: legendPosition,
            align: legendAlign,
            labels: {
              boxWidth: this.isMobile ? 12 : 20,
              boxHeight: this.isMobile ? 12 : 20,
              fontSize: this.isMobile ? 11 : 14,
              padding: this.isMobile ? 8 : 16,
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: label,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.borderColor,
                      lineWidth: style.borderWidth,
                      hidden: isNaN(data.datasets[0].data[i]),
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                return `${label}: $${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
    
    // Set initial theme colors
    this.setThemeColors(AppState.theme);
  },
  
  /**
   * Update chart data with transactions
   * Groups transactions by category and updates the chart
   * Filters out categories with zero expenses (Requirement 4.6)
   * @param {Array} transactions - Array of transaction objects
   */
  updateData(transactions) {
    if (!this.chart) {
      return;
    }
    
    // Group transactions by category
    const categoryTotals = this.groupByCategory(transactions);
    
    // Filter out categories with zero expenses
    const filteredCategories = Object.entries(categoryTotals)
      .filter(([category, total]) => total > 0);
    
    const labels = filteredCategories.map(([category]) => category);
    const data = filteredCategories.map(([category, total]) => total);
    
    // Generate colors based on theme
    const backgroundColors = this.generateColors(labels.length);
    
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].backgroundColor = backgroundColors;
    this.chart.update();
  },
  
  /**
   * Group transactions by category
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Object mapping category names to totals
   */
  groupByCategory(transactions) {
    const categoryTotals = {};
    
    transactions.forEach(tx => {
      const category = tx.category;
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      
      categoryTotals[category] += tx.amount;
    });
    
    return categoryTotals;
  },
  
  /**
   * Destroy chart instance
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  
  /**
   * Update chart configuration for mobile/desktop
   * Call this on window resize to adapt to screen changes
   */
  updateResponsiveConfig() {
    if (!this.chart) {
      return;
    }
    
    const wasMobile = this.isMobile;
    this.checkMobile();
    
    // Only update if mobile status changed
    if (wasMobile === this.isMobile) {
      return;
    }
    
    // Update layout padding
    this.chart.options.layout.padding = this.isMobile ? 8 : 16;
    
    // Update legend configuration
    this.chart.options.plugins.legend.labels.boxWidth = this.isMobile ? 12 : 20;
    this.chart.options.plugins.legend.labels.boxHeight = this.isMobile ? 12 : 20;
    this.chart.options.plugins.legend.labels.fontSize = this.isMobile ? 11 : 14;
    this.chart.options.plugins.legend.labels.padding = this.isMobile ? 8 : 16;
    
    this.chart.update('none');
  },
  
  /**
   * Set chart theme colors
   * Updates chart colors to adapt to the current theme (light or dark)
   * @param {string} theme - 'light' or 'dark'
   */
  setThemeColors(theme) {
    if (!this.chart) {
      return;
    }
    
    const isDark = theme === 'dark';
    
    // Update legend label colors
    this.chart.options.plugins.legend.labels.color = isDark ? '#e0e0e0' : '#333333';
    this.chart.options.plugins.legend.labels.font = {
      family: 'inherit',
      size: 12,
      style: 'normal'
    };
    
    // Update tooltip colors
    this.chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    this.chart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#333333';
    this.chart.options.plugins.tooltip.bodyColor = isDark ? '#e0e0e0' : '#333333';
    this.chart.options.plugins.tooltip.borderColor = isDark ? '#555555' : '#dddddd';
    this.chart.options.plugins.tooltip.borderWidth = 1;
    
    // Update title color if chart has a title plugin
    if (this.chart.options.plugins.title) {
      this.chart.options.plugins.title.color = isDark ? '#e0e0e0' : '#333333';
    }
    
    // Update chart data colors based on theme
    // For dark mode, use lighter colors for better visibility
    // For light mode, use standard colors
    if (this.chart.data.datasets && this.chart.data.datasets.length > 0) {
      const currentBackgroundColors = this.chart.data.datasets[0].backgroundColor;
      const currentBorderColors = this.chart.data.datasets[0].borderColor || [];
      
      // Generate theme-appropriate background colors
      const updatedBackgroundColors = currentBackgroundColors.map((color) => {
        // If it's a hex color, convert for dark mode
        if (typeof color === 'string' && color.startsWith('#')) {
          return isDark ? this.adjustColorBrightness(color, 0.8) : color;
        }
        return color;
      });
      
      // Generate theme-appropriate border colors
      const updatedBorderColors = currentBorderColors.map((color) => {
        if (typeof color === 'string' && color.startsWith('#')) {
          return isDark ? this.adjustColorBrightness(color, 0.5) : color;
        }
        return color;
      });
      
      this.chart.data.datasets[0].backgroundColor = updatedBackgroundColors;
      this.chart.data.datasets[0].borderColor = updatedBorderColors;
      this.chart.data.datasets[0].borderWidth = isDark ? 2 : 1;
    }
    
    this.chart.update('none');
  },
  
  /**
   * Adjust color brightness for theme adaptation
   * @param {string} hexColor - Hex color string (e.g., '#FF6384')
   * @param {number} factor - Brightness factor (0-1 for dark mode, >1 for light mode)
   * @returns {string} Adjusted hex color
   */
  adjustColorBrightness(hexColor, factor) {
    let color = hexColor.replace('#', '');
    
    // Ensure color is 6 characters (RGB)
    if (color.length === 3) {
      color = color.split('').map(c => c + c).join('');
    }
    
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Adjust brightness
    const newR = Math.min(255, Math.max(0, r * factor));
    const newG = Math.min(255, Math.max(0, g * factor));
    const newB = Math.min(255, Math.max(0, b * factor));
    
    // Convert back to hex
    const toHex = (n) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  },
  
  /**
   * Generate colors for chart segments
   * @param {number} count - Number of colors to generate
   * @returns {Array} Array of color strings
   */
  generateColors(count) {
    const colors = [
      '#FF6384', // Red
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40'  // Orange
    ];
    
    // Generate more colors if needed
    while (colors.length < count) {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      colors.push(randomColor);
    }
    
    return colors.slice(0, count);
  }
};

/* ========================================================================= */
/* 7. MONTHLY SUMMARY MODULE */
/* ========================================================================= */

const MonthlySummary = {
  currentMonth: new Date(),
  
  /**
   * Get current month display text
   * @returns {string} Formatted month year (e.g., "October 2026")
   */
  getMonthDisplay() {
    const options = { month: 'long', year: 'numeric' };
    return this.currentMonth.toLocaleDateString('en-US', options);
  },
  
  /**
   * Filter transactions for the current month
   * @returns {Array} Filtered transactions for the current month
   */
  getCurrentMonthTransactions() {
    const currentYear = this.currentMonth.getFullYear();
    const currentMonth = this.currentMonth.getMonth();
    
    return AppState.transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.getFullYear() === currentYear &&
             txDate.getMonth() === currentMonth;
    });
  },
  
  /**
   * Get monthly expenses by category
   * @returns {Object} Object mapping category names to monthly totals
   */
  getMonthlyCategoryTotals() {
    const monthlyTransactions = this.getCurrentMonthTransactions();
    return this.groupByCategory(monthlyTransactions);
  },
  
  /**
   * Group transactions by category
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Object mapping category names to totals
   */
  groupByCategory(transactions) {
    const categoryTotals = {};
    
    transactions.forEach(tx => {
      const category = tx.category;
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      
      categoryTotals[category] += tx.amount;
    });
    
    return categoryTotals;
  },
  
  /**
   * Get total monthly expenses
   * @returns {number} Total monthly expenses
   */
  getTotalMonthlyExpenses() {
    const monthlyTransactions = this.getCurrentMonthTransactions();
    return monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  },
  
  /**
   * Render category breakdown for the current month
   */
  renderCategoryBreakdown() {
    const categoryTotals = this.getMonthlyCategoryTotals();
    const list = DOM.elements.categoryBreakdownList;
    
    list.innerHTML = '';
    
    // Convert to array and sort by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);
    
    sortedCategories.forEach(([category, total]) => {
      const li = document.createElement('li');
      li.className = 'category-breakdown-item';
      li.innerHTML = `
        <span class="category-name">${category}</span>
        <span class="category-amount">$${total.toFixed(2)}</span>
        <span class="category-percent">${this.calculatePercent(total)}</span>
      `;
      list.appendChild(li);
    });
    
    // Handle case with no expenses
    if (sortedCategories.length === 0) {
      const li = document.createElement('li');
      li.className = 'category-breakdown-item empty';
      li.textContent = 'No expenses for this month';
      list.appendChild(li);
    }
  },
  
  /**
   * Calculate percentage of total
   * @param {number} amount - Category amount
   * @returns {string} Percentage string
   */
  calculatePercent(amount) {
    const total = this.getTotalMonthlyExpenses();
    if (total === 0) return '0%';
    
    const percent = (amount / total) * 100;
    return `${percent.toFixed(1)}%`;
  },
  
  /**
   * Update monthly summary display
   */
  updateDisplay() {
    // Update month display
    DOM.elements.currentMonthDisplay.textContent = this.getMonthDisplay();
    
    // Update monthly total
    const total = this.getTotalMonthlyExpenses();
    DOM.elements.monthlyTotal.textContent = `$${total.toFixed(2)}`;
    
    // Update category breakdown
    this.renderCategoryBreakdown();
  },
  
  /**
   * Change to previous month
   */
  previousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.updateDisplay();
  },
  
  /**
   * Change to next month
   */
  nextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.updateDisplay();
  },
  
  /**
   * Change to a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   */
  setMonth(year, month) {
    this.currentMonth = new Date(year, month, 1);
    this.updateDisplay();
  },
  
  /**
   * Populate month selector dropdown
   */
  populateMonthSelector() {
    const selector = DOM.elements.monthSelector;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate months for current year and previous year
    selector.innerHTML = '';
    
    for (let year = currentYear; year >= currentYear - 1; year--) {
      for (let month = 11; month >= 0; month--) {
        const date = new Date(year, month, 1);
        const option = document.createElement('option');
        option.value = `${year}-${month}`;
        option.textContent = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        // Select current month
        if (year === currentYear && month === currentMonth) {
          option.selected = true;
        }
        
        selector.appendChild(option);
      }
    }
  },
  
  /**
   * Handle month selector change
   * @param {Event} event - Change event
   */
  handleMonthSelectorChange(event) {
    const value = event.target.value;
    const [year, month] = value.split('-').map(Number);
    this.setMonth(year, month);
  }
};

/* ========================================================================= */
/* 7. EVENT HANDLERS MODULE */
/* ========================================================================= */

// Moved to line 1351 with monthly summary integration

/* ========================================================================= */
/* 9. EVENT HANDLERS MODULE */
/* ========================================================================= */

const EventHandlers = {
  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  handleFormSubmit(event) {
    event.preventDefault();
    
    const data = {
      itemName: DOM.elements.itemName.value,
      amount: DOM.elements.amount.value,
      category: DOM.elements.category.value
    };
    
    const validation = Validator.validateTransaction(data);
    
    if (!validation.valid) {
      DOM.showError(validation.error.message);
      return;
    }
    
    // Add transaction to state
    AppState.addTransaction(validation.transaction);
    
    // Update DOM
    DOM.clearForm();
    DOM.hideError();
    DOM.updateBalance(AppState.getBalance());
    DOM.renderTransactionList(AppState.transactions);
    
    // Update chart
    ChartManager.updateData(AppState.transactions);
    
    // Update monthly summary
    MonthlySummary.updateDisplay();
  },
  
  /**
   * Handle delete button click
   * @param {Event} event - Click event
   */
  handleDelete(event) {
    const deleteBtn = event.target.closest('.delete-btn');
    if (!deleteBtn) {
      return;
    }
    
    const id = deleteBtn.dataset.id;
    if (id) {
      AppState.removeTransaction(id);
      DOM.updateBalance(AppState.getBalance());
      DOM.renderTransactionList(AppState.transactions);
      ChartManager.updateData(AppState.transactions);
      MonthlySummary.updateDisplay();
    }
  },
  
  /**
   * Handle mode toggle button click
   */
  handleModeToggle() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    AppState.setTheme(newTheme);
    DOM.updateTheme(newTheme);
    ChartManager.setThemeColors(newTheme);
  },
  
  /**
   * Handle category dropdown change (for custom categories)
   * Adds custom categories to the list when user selects a new category
   * and updates the dropdown to include the new category
   */
  handleCategoryChange() {
    const selectedCategory = DOM.elements.category.value;
    
    if (!selectedCategory || selectedCategory === '') {
      return;
    }
    
    // Check if the selected category is not in predefined categories
    // and not already in custom categories
    const isPredefined = CATEGORIES.includes(selectedCategory);
    const isCustom = AppState.customCategories.includes(selectedCategory);
    
    if (!isPredefined && !isCustom) {
      // This is a new custom category - add it to the list
      AppState.customCategories.push(selectedCategory);
      
      // Save to Local Storage
      Storage.saveCustomCategories(AppState.customCategories);
      
      // Update the category dropdown
      this.updateCategoryDropdown();
    }
  },
  
  /**
   * Update the category dropdown with custom categories
   */
  updateCategoryDropdown() {
    const categorySelect = DOM.elements.category;
    const predefinedCategories = [...CATEGORIES];
    const allCategories = [...predefinedCategories, ...AppState.customCategories];
    
    // Clear existing options (keep the first empty option if present)
    const firstOption = categorySelect.options[0];
    categorySelect.innerHTML = '';
    if (firstOption && firstOption.value === '') {
      categorySelect.add(firstOption);
    }
    
    // Add all categories
    allCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.add(option);
    });
  }
};

/* ========================================================================= */
/* 8. INITIALIZATION LOGIC */
/* ========================================================================= */

// Error handling utility for initialization
const InitError = {
  /**
   * Display user-friendly error message
   * @param {string} message - Error message to display
   */
  displayError(message) {
    try {
      DOM.showError(message);
    } catch (e) {
      // Fallback if DOM is not available
      alert(message);
    }
  },
  
  /**
   * Log error to console with context
   * @param {string} context - Context where error occurred
   * @param {Error} error - Error object
   */
  logError(context, error) {
    console.error(`[${context}]`, error);
  }
};

function init() {
  try {
    // Initialize DOM references
    DOM.init();
  } catch (error) {
    InitError.logError('DOM Initialization', error);
    InitError.displayError('Failed to initialize the application interface. Please refresh the page.');
    return;
  }
  
  // Step 1: Load state from Local Storage with error handling
  try {
    AppState.load();
  } catch (error) {
    InitError.logError('Local Storage Load', error);
    // Fallback: Initialize with empty state
    AppState.transactions = [];
    AppState.theme = 'light';
    AppState.customCategories = [];
    InitError.displayError('Could not load your previous data. Starting with a fresh session.');
  }
  
  // Step 2: Update theme before rendering UI
  try {
    DOM.updateTheme(AppState.theme);
  } catch (error) {
    InitError.logError('Theme Update', error);
    // Fallback: Force light theme
    AppState.theme = 'light';
    try {
      document.documentElement.className = 'light';
    } catch (e) {
      // Ignore if document modification fails
    }
  }
  
  // Step 3: Render initial transaction list
  try {
    DOM.renderTransactionList(AppState.transactions);
  } catch (error) {
    InitError.logError('Transaction List Render', error);
    // Fallback: Clear transaction list
    if (DOM.elements && DOM.elements.transactionList) {
      DOM.elements.transactionList.innerHTML = '';
      DOM.showError('Could not render your transactions. Data may be incomplete.');
    }
  }
  
  // Step 4: Update balance display
  try {
    DOM.updateBalance(AppState.getBalance());
  } catch (error) {
    InitError.logError('Balance Update', error);
    // Fallback: Display zero balance
    if (DOM.elements && DOM.elements.balanceDisplay) {
      DOM.elements.balanceDisplay.textContent = '$0.00';
    }
  }
  
  // Step 5: Initialize Chart.js with error handling
  try {
    ChartManager.init('expense-chart');
  } catch (error) {
    InitError.logError('Chart.js Initialization', error);
    // Fallback: Hide chart section gracefully
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
      chartSection.style.display = 'none';
    }
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
      chartContainer.style.display = 'none';
    }
    InitError.displayError('Chart visualization is temporarily unavailable. You can still track your expenses.');
  }
  
  // Step 6: Update chart with loaded data (if chart is available)
  try {
    if (ChartManager.chart) {
      ChartManager.updateData(AppState.transactions);
    }
  } catch (error) {
    InitError.logError('Chart Data Update', error);
    // Don't block initialization if chart update fails
  }
  
  // Step 8: Populate monthly summary
  try {
    MonthlySummary.populateMonthSelector();
    MonthlySummary.updateDisplay();
  } catch (error) {
    InitError.logError('Monthly Summary Initialization', error);
    // Fallback: Hide monthly summary if it fails
    if (DOM.elements && DOM.elements.monthlySummarySection) {
      DOM.elements.monthlySummarySection.style.display = 'none';
    }
  }
  
  // Step 9: Attach event listeners
  try {
    if (DOM.elements && DOM.elements.form) {
      DOM.elements.form.addEventListener('submit', EventHandlers.handleFormSubmit);
    }
    if (DOM.elements && DOM.elements.transactionList) {
      DOM.elements.transactionList.addEventListener('click', EventHandlers.handleDelete);
    }
    if (DOM.elements && DOM.elements.modeToggle) {
      DOM.elements.modeToggle.addEventListener('click', EventHandlers.handleModeToggle);
    }
    if (DOM.elements && DOM.elements.category) {
      DOM.elements.category.addEventListener('change', EventHandlers.handleCategoryChange);
    }
    if (DOM.elements && DOM.elements.prevMonthBtn) {
      DOM.elements.prevMonthBtn.addEventListener('click', () => MonthlySummary.previousMonth());
    }
    if (DOM.elements && DOM.elements.nextMonthBtn) {
      DOM.elements.nextMonthBtn.addEventListener('click', () => MonthlySummary.nextMonth());
    }
    if (DOM.elements && DOM.elements.monthSelector) {
      DOM.elements.monthSelector.addEventListener('change', (e) => MonthlySummary.handleMonthSelectorChange(e));
    }
    // Add window resize listener for responsive chart adjustment
    window.addEventListener('resize', () => {
      ChartManager.updateResponsiveConfig();
    });
  } catch (error) {
    InitError.logError('Event Listener Attachment', error);
    InitError.displayError('Some interactive features may not work correctly. Please try refreshing.');
  }
  
  // Final success check
  if (!DOM.elements) {
    InitError.displayError('Application failed to initialize. Please refresh the page.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
