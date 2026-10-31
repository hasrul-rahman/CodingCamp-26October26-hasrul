/**
 * Expense & Budget Visualizer - Test Suite
 * Comprehensive verification of all functionality
 */

// Test framework
const TestFramework = {
  tests: [],
  results: {
    passed: 0,
    failed: 0,
    errors: []
  },
  
  test(name, fn) {
    this.tests.push({ name, fn, passed: false, error: null });
  },
  
  async run() {
    console.log('\n=== Expense & Budget Visualizer Test Suite ===\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        test.passed = true;
        this.results.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        test.passed = false;
        this.results.failed++;
        this.results.errors.push({ name: test.name, error: error.message });
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }
    
    this.printSummary();
  },
  
  printSummary() {
    console.log('\n=== Test Summary ===');
    console.log(`Total: ${this.tests.length}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\nFailed Tests:');
      this.results.errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
      });
    }
  },
  
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  },
  
  assertEquals(actual, expected, message = 'Values not equal') {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  },
  
  assertCloseTo(actual, expected, tolerance = 0.01, message = 'Values not close enough') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }
};

// Test cases
const Tests = {
  // Local Storage Module Tests
  testLocalStoragePersistence() {
    TestFramework.test('LocalStorage: Save and load transactions', async () => {
      const transactions = [
        { id: 'test-1', itemName: 'Test Item 1', amount: 10.50, category: 'Food', timestamp: Date.now() },
        { id: 'test-2', itemName: 'Test Item 2', amount: 20.00, category: 'Transport', timestamp: Date.now() }
      ];
      
      // Save transactions
      await Storage.saveTransactions(transactions);
      
      // Load transactions
      const loaded = await Storage.getTransactions();
      
      TestFramework.assertEquals(loaded.length, 2, 'Should have 2 transactions');
      TestFramework.assertEquals(loaded[0].itemName, 'Test Item 1');
      TestFramework.assertEquals(loaded[0].amount, 10.50);
    });
    
    TestFramework.test('LocalStorage: Save and load theme', async () => {
      // Save theme
      await Storage.saveTheme('dark');
      
      // Load theme
      const loaded = await Storage.getTheme();
      
      TestFramework.assertEquals(loaded, 'dark', 'Theme should be dark');
    });
  },
  
  // Validation Module Tests
  testValidationModule() {
    TestFramework.test('Validator: Valid transaction', async () => {
      const result = Validator.validateTransaction({
        itemName: 'Test Item',
        amount: '25.50',
        category: 'Food'
      });
      
      TestFramework.assert(result.valid, 'Transaction should be valid');
      TestFramework.assertEquals(result.transaction.itemName, 'Test Item');
      TestFramework.assertEquals(result.transaction.amount, 25.50);
    });
    
    TestFramework.test('Validator: Empty name should fail', async () => {
      const result = Validator.validateTransaction({
        itemName: '',
        amount: '25.50',
        category: 'Food'
      });
      
      TestFramework.assert(!result.valid, 'Transaction should be invalid');
    });
    
    TestFramework.test('Validator: Negative amount should fail', async () => {
      const result = Validator.validateTransaction({
        itemName: 'Test',
        amount: '-10.00',
        category: 'Food'
      });
      
      TestFramework.assert(!result.valid, 'Negative amount should be invalid');
    });
    
    TestFramework.test('Validator: Empty category should fail', async () => {
      const result = Validator.validateTransaction({
        itemName: 'Test',
        amount: '10.00',
        category: ''
      });
      
      TestFramework.assert(!result.valid, 'Empty category should be invalid');
    });
  },
  
  // State Management Tests
  testStateManagement() {
    TestFramework.test('AppState: Calculate balance correctly', async () => {
      const transactions = [
        { id: '1', itemName: 'A', amount: 10, category: 'Food', timestamp: Date.now() },
        { id: '2', itemName: 'B', amount: 20, category: 'Transport', timestamp: Date.now() },
        { id: '3', itemName: 'C', amount: 15, category: 'Fun', timestamp: Date.now() }
      ];
      
      // Manually set transactions for testing
      AppState.transactions = [...transactions];
      
      const balance = AppState.getBalance();
      TestFramework.assertEquals(balance, 45, 'Balance should be 45');
    });
    
    TestFramework.test('AppState: Add and remove transactions', async () => {
      const initialCount = AppState.transactions.length;
      
      // Add transaction
      AppState.addTransaction({
        id: 'temp-1',
        itemName: 'Temp Item',
        amount: 5,
        category: 'Food',
        timestamp: Date.now()
      });
      
      TestFramework.assertEquals(AppState.transactions.length, initialCount + 1);
      
      // Remove transaction
      AppState.removeTransaction('temp-1');
      
      TestFramework.assertEquals(AppState.transactions.length, initialCount);
    });
  },
  
  // Balance Accuracy Tests
  testBalanceAccuracy() {
    TestFramework.test('Balance: Empty list should be zero', async () => {
      AppState.transactions = [];
      const balance = AppState.getBalance();
      TestFramework.assertEquals(balance, 0, 'Empty list balance should be 0');
    });
    
    TestFramework.test('Balance: Multiple transactions sum correctly', async () => {
      AppState.transactions = [
        { id: '1', itemName: 'A', amount: 10.50, category: 'Food', timestamp: Date.now() },
        { id: '2', itemName: 'B', amount: 20.25, category: 'Transport', timestamp: Date.now() },
        { id: '3', itemName: 'C', amount: 15.25, category: 'Fun', timestamp: Date.now() }
      ];
      
      const balance = AppState.getBalance();
      TestFramework.assertCloseTo(balance, 46, 0.01, 'Balance should be 46');
    });
    
    TestFramework.test('Balance: Updates after transaction addition', async () => {
      const initialBalance = AppState.getBalance();
      
      AppState.addTransaction({
        id: 'balance-test-1',
        itemName: 'Test',
        amount: 100,
        category: 'Food',
        timestamp: Date.now()
      });
      
      const newBalance = AppState.getBalance();
      TestFramework.assertEquals(newBalance, initialBalance + 100, 'Balance should increase by 100');
      
      AppState.removeTransaction('balance-test-1');
    });
    
    TestFramework.test('Balance: Updates after transaction deletion', async () => {
      // First add a transaction
      AppState.addTransaction({
        id: 'balance-test-2',
        itemName: 'Test',
        amount: 50,
        category: 'Transport',
        timestamp: Date.now()
      });
      
      const beforeDelete = AppState.getBalance();
      
      AppState.removeTransaction('balance-test-2');
      
      const afterDelete = AppState.getBalance();
      TestFramework.assertEquals(afterDelete, beforeDelete - 50, 'Balance should decrease by 50');
    });
  },
  
  // Transaction List Consistency Tests
  testTransactionListConsistency() {
    TestFramework.test('Transaction List: No duplicates', async () => {
      const transaction = {
        id: 'unique-test',
        itemName: 'Unique',
        amount: 10,
        category: 'Food',
        timestamp: Date.now()
      };
      
      AppState.addTransaction(transaction);
      
      // Check for duplicates
      const duplicates = AppState.transactions.filter(tx => tx.id === transaction.id);
      TestFramework.assertEquals(duplicates.length, 1, 'Should have exactly 1 transaction');
      
      AppState.removeTransaction('unique-test');
    });
    
    TestFramework.test('Transaction List: Maintains order', async () => {
      AppState.transactions = [];
      
      AppState.addTransaction({ id: '1', itemName: 'First', amount: 1, category: 'Food', timestamp: Date.now() });
      AppState.addTransaction({ id: '2', itemName: 'Second', amount: 2, category: 'Transport', timestamp: Date.now() });
      AppState.addTransaction({ id: '3', itemName: 'Third', amount: 3, category: 'Fun', timestamp: Date.now() });
      
      TestFramework.assertEquals(AppState.transactions[0].itemName, 'First');
      TestFramework.assertEquals(AppState.transactions[1].itemName, 'Second');
      TestFramework.assertEquals(AppState.transactions[2].itemName, 'Third');
      
      AppState.transactions = [];
    });
  },
  
  // Chart Update Tests
  testChartUpdates() {
    TestFramework.test('Chart: Category totals are correct', async () => {
      AppState.transactions = [
        { id: '1', itemName: 'A', amount: 10, category: 'Food', timestamp: Date.now() },
        { id: '2', itemName: 'B', amount: 20, category: 'Food', timestamp: Date.now() },
        { id: '3', itemName: 'C', amount: 15, category: 'Transport', timestamp: Date.now() },
        { id: '4', itemName: 'D', amount: 5, category: 'Transport', timestamp: Date.now() }
      ];
      
      const totals = AppState.getCategoryTotals();
      TestFramework.assertEquals(totals.Food, 30, 'Food category should total 30');
      TestFramework.assertEquals(totals.Transport, 20, 'Transport category should total 20');
    });
    
    TestFramework.test('Chart: Zero categories excluded', async () => {
      AppState.transactions = [
        { id: '1', itemName: 'A', amount: 10, category: 'Food', timestamp: Date.now() }
      ];
      
      const totals = AppState.getCategoryTotals();
      // Transport and Fun should not have entries if they have 0 amount
      TestFramework.assertEquals(totals.Food, 10, 'Food should have amount');
      TestFramework.assert(!totals.Transport, 'Transport should not have 0 entry');
      TestFramework.assert(!totals.Fun, 'Fun should not have 0 entry');
    });
  },
  
  // Theme Switching Tests
  testThemeSwitching() {
    TestFramework.test('Theme: Toggle between light and dark', async () => {
      const initialTheme = AppState.theme;
      
      AppState.setTheme('dark');
      TestFramework.assertEquals(AppState.theme, 'dark', 'Theme should be dark');
      
      AppState.setTheme('light');
      TestFramework.assertEquals(AppState.theme, 'light', 'Theme should be light');
      
      // Restore original theme
      AppState.setTheme(initialTheme);
    });
    
    TestFramework.test('Theme: Preference persists', async () => {
      AppState.setTheme('dark');
      
      // Simulate reload by loading from storage
      const loadedTheme = Storage.getTheme();
      TestFramework.assertEquals(loadedTheme, 'dark', 'Dark theme should persist');
      
      AppState.setTheme('light'); // Restore
    });
  },
  
  // Responsive Layout Tests
  testResponsiveLayout() {
    TestFramework.test('Responsive: CSS variables defined', async () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Check for CSS variables (these should exist in styles.css)
      TestFramework.assert(rootStyles.getPropertyValue('--bg-primary').length > 0, 'CSS variables should be defined');
      TestFramework.assert(rootStyles.getPropertyValue('--accent-color').length > 0, 'Accent color should be defined');
    });
  },
  
  // Integration Tests
  testIntegration() {
    TestFramework.test('Integration: Full transaction flow', async () => {
      // Clear state
      AppState.transactions = [];
      
      // Add transaction
      const tx1 = {
        id: 'int-1',
        itemName: 'Test Integration',
        amount: 25.50,
        category: 'Food',
        timestamp: Date.now()
      };
      
      AppState.addTransaction(tx1);
      TestFramework.assertEquals(AppState.transactions.length, 1, 'Should have 1 transaction');
      TestFramework.assertEquals(AppState.getBalance(), 25.50, 'Balance should be 25.50');
      
      // Add another transaction
      const tx2 = {
        id: 'int-2',
        itemName: 'Another Test',
        amount: 15.00,
        category: 'Transport',
        timestamp: Date.now()
      };
      
      AppState.addTransaction(tx2);
      TestFramework.assertEquals(AppState.transactions.length, 2, 'Should have 2 transactions');
      TestFramework.assertEquals(AppState.getBalance(), 40.50, 'Balance should be 40.50');
      
      // Delete first transaction
      AppState.removeTransaction('int-1');
      TestFramework.assertEquals(AppState.transactions.length, 1, 'Should have 1 transaction');
      TestFramework.assertEquals(AppState.getBalance(), 15.00, 'Balance should be 15.00');
    });
  }
};

// Run tests
async function runTests() {
  // Initialize AppState
  AppState.load();
  
  // Run all tests
  await Tests.testLocalStoragePersistence();
  await Tests.testValidationModule();
  await Tests.testStateManagement();
  await Tests.testBalanceAccuracy();
  await Tests.testTransactionListConsistency();
  await Tests.testChartUpdates();
  await Tests.testThemeSwitching();
  await Tests.testResponsiveLayout();
  await Tests.testIntegration();
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.TestFramework = TestFramework;
  window.runTests = runTests;
}