# Design Document

## Overview

This document outlines the architecture, components, data models, and implementation details for the Expense & Budget Visualizer application.

### Purpose

The Expense & Budget Visualizer is a single-page web application that helps users track their expenses by category and visualize spending patterns. The application provides real-time balance updates, transaction management, and interactive charts. Data persists across sessions using the browser's Local Storage API.

### Key Features

- **Input Form**: Enter expense transactions with item name, amount, and category
- **Transaction List**: View and manage transactions with delete functionality
- **Balance Display**: Real-time calculation of total expenses
- **Visual Chart**: Pie chart showing expenses by category using Chart.js
- **Data Persistence**: Local Storage for saving transactions across sessions
- **Dark/Light Mode**: Theme toggle with preference persistence
- **Responsive Design**: Mobile-friendly layout

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Header    │  │   Form      │  │  Transaction│ │
│  │   (Balance  │  │  (Input)    │  │   List      │ │
│  │   + Mode)   │  │             │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │             Chart Section                   │   │
│  │             (Pie Chart)                     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│                  Business Logic                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   AppState  │  │   DOM       │  │   Chart     │ │
│  │   Manager   │  │   Manager   │  │   Manager   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │  Validator  │  │Event Handler│                  │
│  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│                  Data Layer                         │
│  ┌─────────────────────────────────────────────┐   │
│  │           Local Storage                     │   │
│  │  - Transactions                             │   │
│  │  - Theme Preference                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. Application Init
   └─> AppState.load() → Load from Local Storage
   └─> DOM.render() → Render UI with loaded data

2. User Add Transaction
   └─> Form Submit
   └─> EventHandlers.handleFormSubmit()
   └─> Validator.validateTransaction()
   └─> AppState.addTransaction()
   └─> Storage.saveTransactions()
   └─> DOM.renderTransaction()
   └─> DOM.updateBalance()
   └─> ChartManager.updateData()

3. User Delete Transaction
   └─> Delete Button Click
   └─> EventHandlers.handleDelete()
   └─> AppState.removeTransaction()
   └─> Storage.saveTransactions()
   └─> DOM.renderTransactionList()
   └─> DOM.updateBalance()
   └─> ChartManager.updateData()

4. User Toggle Theme
   └─> Mode Toggle Click
   └─> EventHandlers.handleModeToggle()
   └─> AppState.setTheme()
   └─> Storage.saveTheme()
   └─> DOM.updateTheme()
```

---

## Components and Interfaces

### UI Components

#### 1. Header Component

**Element**: `#app-header` (`<header>`)

**Purpose**: Displays application title, balance, and mode toggle

**Children**:
- `#app-title` (`<h1>`): Application title
- `#balance-display` (`<div>`): Current balance display
- `#mode-toggle` (`<button>`): Dark/light mode toggle

**Methods**:
```javascript
DOM.updateBalance(balance: number): void
DOM.updateTheme(theme: string): void
```

**Events**:
- Mode toggle click → `EventHandlers.handleModeToggle()`

#### 2. Form Component

**Element**: `#transaction-form` (`<form>`)

**Purpose**: Allows users to add new transactions

**Children**:
- `#item-name` (`<input type="text">`): Item name input
- `#amount` (`<input type="number">`): Amount input
- `#category` (`<select>`): Category dropdown
- `#add-btn` (`<button type="submit">`): Submit button
- `#error-message` (`<div class="error">`): Error display

**Methods**:
```javascript
DOM.clearForm(): void
DOM.showError(message: string): void
DOM.hideError(): void
```

**Events**:
- Form submit → `EventHandlers.handleFormSubmit()`

#### 3. Transaction List Component

**Element**: `#transaction-list` (`<div class="scroll-container">`)

**Purpose**: Displays all transactions with delete functionality

**Transaction Item Structure**:
```javascript
interface TransactionItem {
  id: string;
  itemName: string;
  amount: number;
  category: string;
}
```

**Methods**:
```javascript
DOM.renderTransaction(tx: TransactionItem): HTMLElement
DOM.renderTransactionList(transactions: TransactionItem[]): void
DOM.updateTransactionList(): void
```

**Events**:
- Delete button click → `EventHandlers.handleDelete(event)`

#### 4. Chart Component

**Element**: `#expense-chart` (`<canvas>`)

**Purpose**: Visual representation of expenses by category

**Methods**:
```javascript
ChartManager.init(canvasId: string): void
ChartManager.updateData(transactions: TransactionItem[]): void
ChartManager.destroy(): void
ChartManager.setThemeColors(theme: string): void
```

**Chart Configuration**:
- Type: Pie chart
- Responsive: true
- Maintain aspect ratio: false
- Animation duration: 200ms

### Interface Contracts

#### AppState Interface

```typescript
interface AppState {
  transactions: TransactionItem[];
  theme: 'light' | 'dark';
  
  // Methods
  load(): void;
  save(): void;
  addTransaction(transaction: TransactionItem): void;
  removeTransaction(id: string): void;
  setTheme(theme: 'light' | 'dark'): void;
  getBalance(): number;
  getCategoryTotals(): Record<string, number>;
  getTransactionById(id: string): TransactionItem | undefined;
}
```

#### DOM Interface

```typescript
interface DOM {
  elements: {
    form: HTMLFormElement;
    itemName: HTMLInputElement;
    amount: HTMLInputElement;
    category: HTMLSelectElement;
    transactionList: HTMLElement;
    balanceDisplay: HTMLElement;
    modeToggle: HTMLButtonElement;
    chartCanvas: HTMLCanvasElement;
    errorMessage: HTMLElement;
  };
  
  // Methods
  renderTransaction(tx: TransactionItem): HTMLElement;
  renderTransactionList(transactions: TransactionItem[]): void;
  updateBalance(balance: number): void;
  showError(message: string): void;
  hideError(): void;
  clearForm(): void;
  updateTheme(theme: string): void;
}
```

#### Validator Interface

```typescript
interface Validator {
  validateTransaction(data: {
    itemName: string;
    amount: string;
    category: string;
  }): {
    valid: boolean;
    transaction?: TransactionItem;
    error?: string;
  };
  
  isNameValid(name: string): boolean;
  isAmountValid(amount: string): boolean;
  isAmountPositive(amount: number): boolean;
  isCategoryValid(category: string): boolean;
}
```

#### ChartManager Interface

```typescript
interface ChartManager {
  chart: Chart | null;
  
  init(canvasId: string): void;
  updateData(transactions: TransactionItem[]): void;
  destroy(): void;
  setThemeColors(theme: string): void;
}
```

#### Storage Interface

```typescript
interface Storage {
  // Transaction methods
  saveTransactions(transactions: TransactionItem[]): void;
  getTransactions(): TransactionItem[] | null;
  clearTransactions(): void;
  
  // Theme methods
  saveTheme(theme: 'light' | 'dark'): void;
  getTheme(): 'light' | 'dark' | null;
  
  // Custom categories (optional challenge)
  saveCustomCategories(categories: string[]): void;
  getCustomCategories(): string[] | null;
}
```

#### EventHandlers Interface

```typescript
interface EventHandlers {
  handleFormSubmit(event: Event): void;
  handleDelete(event: Event): void;
  handleModeToggle(): void;
  handleCategoryChange(): void; // For custom categories
}
```

### File Interfaces

#### CSS Module Structure

```css
/* Main CSS file: css/styles.css */
/* Organized into sections: */
/* 1. CSS Variables & Theme Configuration */
/* 2. Reset & Base Styles */
/* 3. Layout Components */
/* 4. Header Styles */
/* 5. Form Styles */
/* 6. Transaction List Styles */
/* 7. Chart Section Styles */
/* 8. Responsive Media Queries */
```

#### JavaScript Module Structure

```javascript
// Main JS file: js/app.js
/* Organized into modules: */
/* 1. Constants & Config */
/* 2. Utility Functions */
/* 3. State Management Module */
/* 4. Local Storage Module */
/* 5. Validation Module */
/* 6. DOM Management Module */
/* 7. Chart Management Module */
/* 8. Event Handlers Module */
/* 9. Initialization Logic */
```

---

## Data Models

### Transaction Data Model

```typescript
interface TransactionItem {
  id: string;           // Unique identifier (UUID v4)
  itemName: string;     // User-provided item name (max 100 chars)
  amount: number;       // Positive number (max 2 decimal places)
  category: string;     // Category (predefined or custom)
  timestamp: number;    // Creation timestamp (for monthly filtering)
}
```

**Validation Rules**:
- `id`: UUID v4 format, auto-generated
- `itemName`: Non-empty string, max 100 characters
- `amount`: Positive number, max 2 decimal places
- `category`: String matching predefined or custom categories
- `timestamp`: Unix timestamp (auto-generated)

### Local Storage Schema

```javascript
// Storage Keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'expense_transactions',
  THEME: 'expense_theme',
  CUSTOM_CATEGORIES: 'expense_custom_categories'
};
```

**Transactions Schema**:
```javascript
// Key: 'expense_transactions'
[
  {
    "id": "uuid-v4-string",
    "itemName": "Lunch",
    "amount": 15.50,
    "category": "Food",
    "timestamp": 1698765432100
  }
]
```

**Theme Schema**:
```javascript
// Key: 'expense_theme'
"light"  // or "dark"
```

**Custom Categories Schema**:
```javascript
// Key: 'expense_custom_categories'
["Category1", "Category2"]
```

### Data Transformation Functions

```javascript
// Convert transaction to display format
function formatTransactionDisplay(tx: TransactionItem): {
  amount: string;      // Formatted as currency
  category: string;    // Display category
  date: string;        // Formatted date (optional)
}

// Calculate balance from transactions
function calculateBalance(transactions: TransactionItem[]): number

// Group transactions by category
function groupByCategory(transactions: TransactionItem[]): Record<string, number>

// Validate transaction data
function validateTransaction(data: Object): ValidationResult
```

### Error Handling Data Model

```typescript
interface ValidationError {
  field: string;        // 'itemName' | 'amount' | 'category'
  message: string;      // Human-readable error message
  code: string;         // Machine-readable error code
}

interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
  transaction?: TransactionItem;
}
```

### State Persistence Model

```javascript
// State snapshot for persistence
interface AppStateSnapshot {
  transactions: TransactionItem[];
  theme: 'light' | 'dark';
  customCategories?: string[];  // Optional challenge
}

// Local storage format
{
  [STORAGE_KEYS.TRANSACTIONS]: TransactionItem[];
  [STORAGE_KEYS.THEME]: 'light' | 'dark';
  [STORAGE_KEYS.CUSTOM_CATEGORIES]?: string[];
}
```

### Chart Data Model

```javascript
// Chart.js data structure
interface ChartData {
  labels: string[];        // Category names
  datasets: [
    {
      data: number[];      // Category totals
      backgroundColor: string[];
      borderWidth: number;
    }
  ];
}

// Chart options
interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'bottom' | 'top' | 'left' | 'right';
    };
    tooltip: {
      callbacks: {
        label: (context: object) => string;
      };
    };
  };
}
```

### Performance Metrics

```javascript
// Performance targets
const PERFORMANCE_TARGETS = {
  ADD_TRANSACTION_MS: 200,
  DELETE_TRANSACTION_MS: 200,
  RENDER_100_TRANSACTIONS_MS: 1000,
  RENDER_1000_TRANSACTIONS_MS: 2000,
  CHART_UPDATE_MS: 200,
  BALANCE_UPDATE_MS: 100
};
```

### Custom Categories Extension (Optional Challenge)

```typescript
interface CustomCategoryManager {
  predefinedCategories: string[];
  customCategories: string[];
  
  // Methods
  addCustomCategory(category: string): boolean;
  removeCustomCategory(category: string): boolean;
  getAllCategories(): string[];
  isCustomCategory(category: string): boolean;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction Persistence

*For any* transaction added to the system, it SHALL be persisted to Local Storage and remain accessible across browser sessions until explicitly deleted

**Validates: Requirements 5.1, 5.3**

### Property 2: Balance Accuracy

*For any* set of transactions, the Balance Display SHALL always equal the sum of all transaction amounts

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Transaction List Consistency

*For any* transaction added or deleted, the Transaction List SHALL immediately reflect the current state without data loss or duplication

**Validates: Requirements 2.5, 5.2**

### Property 4: Chart Update Correctness

*For any* set of transactions, the pie chart SHALL accurately represent the expense distribution by category, excluding categories with zero expenses

**Validates: Requirements 4.1, 4.3, 4.4, 4.6**

### Property 5: Form Validation

*For any* input to the form, if validation fails, the system SHALL display an error message and not add the transaction; if validation passes, the system SHALL add the transaction

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 6: Theme Persistence

*For any* user who changes the theme preference, the preference SHALL be saved to Local Storage and restored on page reload

**Validates: Requirements 8.5, 8.6**

### Property 7: Performance Bounds

*For any* transaction operation (add/delete), the system SHALL complete within the specified time bounds regardless of the number of existing transactions

**Validates: Requirements 10.1, 10.2**

---

## Error Handling

### Validation Errors

```javascript
// Error types
const ErrorTypes = {
  EMPTY_NAME: 'empty_name',
  EMPTY_AMOUNT: 'empty_amount',
  EMPTY_CATEGORY: 'empty_category',
  INVALID_AMOUNT: 'invalid_amount',
  NEGATIVE_AMOUNT: 'negative_amount',
  INVALID_CATEGORY: 'invalid_category'
};

// Error messages
const ErrorMessages = {
  [ErrorTypes.EMPTY_NAME]: 'Please enter an item name',
  [ErrorTypes.EMPTY_AMOUNT]: 'Please enter an amount',
  [ErrorTypes.EMPTY_CATEGORY]: 'Please select a category',
  [ErrorTypes.INVALID_AMOUNT]: 'Please enter a valid amount',
  [ErrorTypes.NEGATIVE_AMOUNT]: 'Amount must be positive',
  [ErrorTypes.INVALID_CATEGORY]: 'Please select a valid category'
};
```

### Local Storage Errors

```javascript
// Error handling for Local Storage
try {
  const transactions = Storage.getTransactions();
} catch (error) {
  console.warn('Failed to load from Local Storage:', error);
  // Fallback to empty state
  AppState.transactions = [];
}
```

### Chart.js Errors

```javascript
// Chart initialization error handling
try {
  ChartManager.init('expense-chart');
} catch (error) {
  console.warn('Failed to initialize Chart.js:', error);
  // Hide chart section
  document.getElementById('chart-section').style.display = 'none';
}
```

### Form Error Display

```javascript
// Error display pattern
DOM.showError(message: string): void {
  const errorEl = document.getElementById('error-message');
  errorEl.textContent = message;
  errorEl.hidden = false;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    DOM.hideError();
  }, 3000);
}
```

### Accessibility Considerations

1. **Error Messages**: Announced via ARIA live regions
2. **Focus Management**: Error focus returns to invalid field
3. **Color Contrast**: Error text meets WCAG AA standards

---

## Summary

This design document provides a complete architecture for the Expense & Budget Visualizer, covering:

### Overview
- Purpose, key features, and application flow

### Architecture
- System architecture diagram
- Component interaction flow
- Layer separation (UI, Business Logic, Data)

### Components and Interfaces
- UI components (Header, Form, Transaction List, Chart)
- Interface contracts (AppState, DOM, Validator, ChartManager, Storage, EventHandlers)
- File organization structure

### Data Models
- Transaction data model with validation rules
- Local Storage schema
- Data transformation functions
- Chart data structures
- Error handling data models

### Correctness Properties
- 7 properties covering persistence, accuracy, consistency, and performance

The implementation follows vanilla JavaScript principles with no build tools required, using Chart.js from CDN as specified in the requirements.
### Property 7: Performance Bounds

*For any* transaction operation (add/delete), the system SHALL complete within the specified time bounds regardless of the number of existing transactions

**Validates: Requirements 10.1, 10.2**

---

## Testing Strategy

### Unit Testing

#### Validation Module Tests
```javascript
// Test validation with various inputs
test('validateTransaction with valid input', () => {
  const result = Validator.validateTransaction({
    itemName: 'Lunch',
    amount: '15.50',
    category: 'Food'
  });
  expect(result.valid).toBe(true);
  expect(result.transaction).toBeDefined();
});

test('validateTransaction with empty name', () => {
  const result = Validator.validateTransaction({
    itemName: '',
    amount: '15.50',
    category: 'Food'
  });
  expect(result.valid).toBe(false);
  expect(result.error).toBeDefined();
});

test('validateTransaction with negative amount', () => {
  const result = Validator.validateTransaction({
    itemName: 'Lunch',
    amount: '-10.00',
    category: 'Food'
  });
  expect(result.valid).toBe(false);
});
```

#### Balance Calculation Tests
```javascript
test('calculateBalance with empty array', () => {
  expect(calculateBalance([])).toBe(0);
});

test('calculateBalance with multiple transactions', () => {
  const transactions = [
    { amount: 10, category: 'Food' },
    { amount: 5, category: 'Transport' },
    { amount: 15, category: 'Fun' }
  ];
  expect(calculateBalance(transactions)).toBe(30);
});
```

#### Local Storage Module Tests
```javascript
test('saveTransactions preserves data', () => {
  const transactions = [{ id: '1', itemName: 'Test', amount: 10, category: 'Food', timestamp: Date.now() }];
  Storage.saveTransactions(transactions);
  const stored = Storage.getTransactions();
  expect(stored).toEqual(transactions);
});
```

### Integration Testing

#### Transaction Add/Delete Flow
```javascript
test('full add transaction flow', () => {
  // Simulate form submission
  DOM.elements.itemName.value = 'Test Item';
  DOM.elements.amount.value = '25.00';
  DOM.elements.category.value = 'Food';
  
  // Trigger submit
  EventHandlers.handleFormSubmit({ preventDefault: () => {} });
  
  // Verify state
  expect(AppState.transactions.length).toBe(1);
  expect(AppState.getBalance()).toBe(25);
  expect(DOM.elements.transactionList.children.length).toBe(1);
});

test('full delete transaction flow', () => {
  // Add transaction first
  const tx = { id: '1', itemName: 'Test', amount: 10, category: 'Food', timestamp: Date.now() };
  AppState.addTransaction(tx);
  
  // Delete transaction
  EventHandlers.handleDelete({ target: { dataset: { id: '1' } } });
  
  // Verify state
  expect(AppState.transactions.length).toBe(0);
  expect(AppState.getBalance()).toBe(0);
  expect(DOM.elements.transactionList.children.length).toBe(0);
});
```

#### Form Submission with Validation
```javascript
test('form submission with invalid data shows error', () => {
  DOM.elements.itemName.value = '';
  DOM.elements.amount.value = '10';
  
  EventHandlers.handleFormSubmit({ preventDefault: () => {} });
  
  expect(DOM.elements.errorMessage.hidden).toBe(false);
  expect(AppState.transactions.length).toBe(0);
});
```

#### Chart Updates with Transaction Changes
```javascript
test('chart updates when transaction is added', () => {
  // Initial state
  const initialData = ChartManager.chart.data.datasets[0].data;
  
  // Add transaction
  AppState.addTransaction({
    id: '1', itemName: 'Test', amount: 10, category: 'Food', timestamp: Date.now()
  });
  
  // Verify chart updated
  const updatedData = ChartManager.chart.data.datasets[0].data;
  expect(updatedData).not.toEqual(initialData);
});
```

### Property-Based Testing (See Correctness Properties)

#### Transaction Persistence
- Generate random transaction data
- Add to system
- Reload page
- Verify transaction persists
- Test with multiple transactions of varying sizes

#### Balance Accuracy
- Generate arbitrary transaction sets
- Verify balance equals sum of amounts
- Test with edge cases (empty list, single transaction, large numbers)

#### Chart Update Correctness
- Generate random transaction sets
- Verify chart data matches category totals
- Verify zero categories are excluded
- Test with many categories and varying amounts

#### Theme Persistence
- Toggle theme
- Reload page
- Verify theme preference restored
- Test with multiple theme switches

### Performance Testing

#### Add Transaction Timing
```javascript
// Test should complete within 200ms
const startTime = performance.now();
AppState.addTransaction(transaction);
const duration = performance.now() - startTime;
expect(duration).toBeLessThan(200);
```

#### Chart Update Timing
```javascript
// Test should complete within 200ms
const startTime = performance.now();
ChartManager.updateData(transactions);
const duration = performance.now() - startTime;
expect(duration).toBeLessThan(200);
```

---

## Summary

This design document provides a complete architecture for the Expense & Budget Visualizer, covering:

### Overview
- Purpose, key features, and application flow

### Architecture
- System architecture diagram
- Component interaction flow
- Layer separation (UI, Business Logic, Data)

### Components and Interfaces
- UI components (Header, Form, Transaction List, Chart)
- Interface contracts (AppState, DOM, Validator, ChartManager, Storage, EventHandlers)
- File organization structure

### Data Models
- Transaction data model with validation rules
- Local Storage schema
- Data transformation functions
- Chart data structures
- Error handling data models

### Correctness Properties
- 7 properties covering persistence, accuracy, consistency, and performance

### Error Handling
- Validation errors
- Local Storage errors
- Chart.js errors
- Form error display

### Testing Strategy
- Unit tests for validation, balance calculation, and storage
- Integration tests for full transaction flows
- Property-based tests for correctness properties
- Performance tests for timing requirements

The implementation follows vanilla JavaScript principles with no build tools required, using Chart.js from CDN as specified in the requirements.