/**
 * Node.js Performance Test Runner for Expense & Budget Visualizer
 * Uses jsdom for browser-like environment
 */

const path = require('path');

// Check if jsdom is available
let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  console.error('jsdom not installed. Install with: npm install jsdom');
  process.exit(1);
}

const { JSDOM } = jsdom;

// Setup JSDOM with Chart.js from CDN
const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Tests</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <canvas id="expense-chart"></canvas>
</body>
</html>`, {
  url: 'http://localhost',
  resources: 'usable',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  beforeParse(window) {
    // Mock performance.now
    const performance = {
      now() {
        return Date.now();
      }
    };
    window.performance = performance;
  }
});

const window = dom.window;
const document = window.document;
const Chart = window.Chart;

// Mock localStorage
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = String(value);
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};
window.localStorage = localStorage;

// Load app.js
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const fs = require('fs');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Execute app.js in the window context
const scriptContent = `
  ${appJsContent}
  
  // Store references to app objects for testing
  module.exports.AppState = AppState;
  module.exports.Storage = Storage;
  module.exports.ChartManager = ChartManager;
  module.exports.Validator = Validator;
  module.exports.DOM = DOM;
`;

try {
  // Create a new vm context
  const vm = require('vm');
  const context = vm.createContext({
    window: window,
    document: document,
    Chart: Chart,
    localStorage: localStorage,
    performance: window.performance,
    module: { exports: {} },
    require: require,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  });
  
  vm.runInContext(scriptContent, context);
  
  // Get the app objects
  const AppState = context.module.exports.AppState;
  const Storage = context.module.exports.Storage;
  const ChartManager = context.module.exports.ChartManager;
  const Validator = context.module.exports.Validator;
  const DOM = context.module.exports.DOM;
  
  // Now run performance tests
  runPerformanceTests();
  
} catch (error) {
  console.error('Error loading app.js:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Performance test framework
const PerformanceTestFramework = {
  tests: [],
  results: {
    passed: 0,
    failed: 0,
    metrics: []
  },
  
  test(name, fn) {
    this.tests.push({ name, fn, passed: false, error: null, duration: null });
  },
  
  async run() {
    console.log('\n=== Expense & Budget Visualizer - Performance Test Suite ===\n');
    console.log('Performance Targets:');
    console.log('- Add transaction: < 200ms');
    console.log('- Delete transaction: < 200ms');
    console.log('- Chart update: < 200ms');
    console.log('- Balance update: < 100ms');
    console.log('');
    
    for (const test of this.tests) {
      try {
        const result = await test.fn();
        test.passed = true;
        test.duration = result.duration;
        this.results.passed++;
        this.results.metrics.push({
          name: test.name,
          duration: result.duration,
          target: result.target
        });
        this.logSuccess(test.name, result.duration, result.target);
      } catch (error) {
        test.passed = false;
        test.duration = null;
        this.results.failed++;
        this.logFailure(test.name, error.message);
      }
    }
    
    this.printSummary();
  },
  
  logSuccess(name, duration, target) {
    const ms = duration.toFixed(2);
    const status = duration < target ? '✓' : '✗';
    const statusText = duration < target ? 'PASS' : 'FAIL';
    console.log(`${status} ${name}: ${ms}ms (target: ${target}ms) - ${statusText}`);
  },
  
  logFailure(name, error) {
    console.log(`✗ ${name}: ${error}`);
  },
  
  printSummary() {
    console.log('\n=== Performance Test Summary ===');
    console.log(`Total: ${this.tests.length}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.results.metrics.length > 0) {
      console.log('\nPerformance Metrics:');
      this.results.metrics.forEach(({ name, duration, target }) => {
        const percentageOfTarget = ((duration / target) * 100).toFixed(1);
        console.log(`  ${name}: ${duration.toFixed(2)}ms (${percentageOfTarget}% of target)`);
      });
    }
    
    if (this.results.failed > 0) {
      console.log('\n⚠ Performance targets not met. Optimization may be needed.');
    }
  }
};

// Performance test cases
const PerformanceTests = {
  // Add Transaction Performance
  testAddTransactionPerformance() {
    PerformanceTestFramework.test('Add transaction completes within 200ms', async () => {
      // Reset state
      AppState.transactions = [];
      
      // Warm up
      for (let i = 0; i < 10; i++) {
        AppState.addTransaction({
          id: `warmup-${i}`,
          itemName: `Warmup Item ${i}`,
          amount: 10,
          category: 'Food',
          timestamp: Date.now()
        });
      }
      
      // Clear warmup transactions
      AppState.transactions = [];
      
      // Measure add transaction time
      const startTime = performance.now();
      AppState.addTransaction({
        id: 'perf-test-add',
        itemName: 'Performance Test Item',
        amount: 25.50,
        category: 'Food',
        timestamp: Date.now()
      });
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      AppState.removeTransaction('perf-test-add');
      
      return {
        duration,
        target: 200
      };
    });
    
    PerformanceTestFramework.test('Add transaction with 100 transactions completes within 200ms', async () => {
      // Create 100 transactions
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          id: `bulk-${i}`,
          itemName: `Bulk Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      // Add all transactions to state
      AppState.transactions = [...transactions];
      
      // Measure add transaction time with existing data
      const startTime = performance.now();
      AppState.addTransaction({
        id: 'perf-test-add-bulk',
        itemName: 'Bulk Test Item',
        amount: 50,
        category: 'Food',
        timestamp: Date.now()
      });
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      AppState.transactions = [];
      
      return {
        duration,
        target: 200
      };
    });
    
    PerformanceTestFramework.test('Add transaction with 1000 transactions completes within 200ms', async () => {
      // Create 1000 transactions
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          id: `bulk1000-${i}`,
          itemName: `Bulk 1000 Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      // Add all transactions to state
      AppState.transactions = [...transactions];
      
      // Measure add transaction time with large dataset
      const startTime = performance.now();
      AppState.addTransaction({
        id: 'perf-test-add-1000',
        itemName: 'Bulk 1000 Test Item',
        amount: 50,
        category: 'Food',
        timestamp: Date.now()
      });
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      AppState.transactions = [];
      
      return {
        duration,
        target: 200
      };
    });
  },
  
  // Delete Transaction Performance
  testDeleteTransactionPerformance() {
    PerformanceTestFramework.test('Delete transaction completes within 200ms', async () => {
      // Reset state and add test transaction
      AppState.transactions = [];
      AppState.addTransaction({
        id: 'perf-test-delete',
        itemName: 'Delete Test Item',
        amount: 25.50,
        category: 'Food',
        timestamp: Date.now()
      });
      
      // Measure delete transaction time
      const startTime = performance.now();
      AppState.removeTransaction('perf-test-delete');
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        target: 200
      };
    });
    
    PerformanceTestFramework.test('Delete transaction with 100 transactions completes within 200ms', async () => {
      // Create 100 transactions with the delete target
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          id: `delete-bulk-${i}`,
          itemName: `Delete Bulk Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      // Add all transactions
      AppState.transactions = [...transactions];
      
      // Measure delete transaction time with existing data
      const startTime = performance.now();
      AppState.removeTransaction('delete-bulk-50');
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      AppState.transactions = [];
      
      return {
        duration,
        target: 200
      };
    });
  },
  
  // Chart Update Performance
  testChartUpdatePerformance() {
    PerformanceTestFramework.test('Chart update completes within 200ms', async () => {
      // Reset state
      AppState.transactions = [];
      
      // Add some transactions
      for (let i = 0; i < 10; i++) {
        AppState.transactions.push({
          id: `chart-${i}`,
          itemName: `Chart Test Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      // Mock ChartManager.updateData if needed
      const startTime = performance.now();
      ChartManager.updateData(AppState.transactions);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        target: 200
      };
    });
    
    PerformanceTestFramework.test('Chart update with 100 transactions completes within 200ms', async () => {
      // Create 100 transactions
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          id: `chart-bulk-${i}`,
          itemName: `Chart Bulk Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      AppState.transactions = [...transactions];
      
      const startTime = performance.now();
      ChartManager.updateData(AppState.transactions);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        target: 200
      };
    });
    
    PerformanceTestFramework.test('Chart update with 1000 transactions completes within 200ms', async () => {
      // Create 1000 transactions
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          id: `chart-1000-${i}`,
          itemName: `Chart 1000 Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      AppState.transactions = [...transactions];
      
      const startTime = performance.now();
      ChartManager.updateData(AppState.transactions);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        target: 200
      };
    });
  },
  
  // Balance Update Performance
  testBalanceUpdatePerformance() {
    PerformanceTestFramework.test('Balance update completes within 100ms', async () => {
      // Reset state
      AppState.transactions = [];
      
      // Add test transaction
      AppState.addTransaction({
        id: 'balance-perf',
        itemName: 'Balance Test',
        amount: 50,
        category: 'Food',
        timestamp: Date.now()
      });
      
      // Measure balance update time
      const startTime = performance.now();
      const balance = AppState.getBalance();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Verify balance is correct
      if (balance !== 50) {
        throw new Error(`Expected balance 50, got ${balance}`);
      }
      
      // Clean up
      AppState.removeTransaction('balance-perf');
      
      return {
        duration,
        target: 100
      };
    });
    
    PerformanceTestFramework.test('Balance update with 1000 transactions completes within 100ms', async () => {
      // Create 1000 transactions
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          id: `balance-1000-${i}`,
          itemName: `Balance 1000 Item ${i}`,
          amount: 10 + i,
          category: i % 3 === 0 ? 'Food' : (i % 3 === 1 ? 'Transport' : 'Fun'),
          timestamp: Date.now()
        });
      }
      
      AppState.transactions = [...transactions];
      
      // Measure balance update time with large dataset
      const startTime = performance.now();
      const balance = AppState.getBalance();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Verify balance is correct
      const expectedBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      if (balance !== expectedBalance) {
        throw new Error(`Expected balance ${expectedBalance}, got ${balance}`);
      }
      
      // Clean up
      AppState.transactions = [];
      
      return {
        duration,
        target: 100
      };
    });
  },
  
  // Full Transaction Flow Performance
  testFullTransactionFlow() {
    PerformanceTestFramework.test('Full transaction flow (add, update balance, update chart) completes within 200ms', async () => {
      // Reset state
      AppState.transactions = [];
      
      // Warm up
      for (let i = 0; i < 5; i++) {
        AppState.addTransaction({
          id: `flow-warmup-${i}`,
          itemName: `Flow Warmup ${i}`,
          amount: 10,
          category: 'Food',
          timestamp: Date.now()
        });
      }
      AppState.transactions = [];
      
      // Measure full transaction flow
      const startTime = performance.now();
      
      // Add transaction
      AppState.addTransaction({
        id: 'flow-test',
        itemName: 'Full Flow Test',
        amount: 25.50,
        category: 'Food',
        timestamp: Date.now()
      });
      
      // Update balance
      const balance = AppState.getBalance();
      
      // Update chart
      ChartManager.updateData(AppState.transactions);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      AppState.removeTransaction('flow-test');
      
      return {
        duration,
        target: 200
      };
    });
  }
};

// Run performance tests
async function runPerformanceTests() {
  // Initialize AppState
  AppState.load();
  
  // Initialize ChartManager
  ChartManager.init('expense-chart');
  
  // Run all performance tests
  await PerformanceTests.testAddTransactionPerformance();
  await PerformanceTests.testDeleteTransactionPerformance();
  await PerformanceTests.testChartUpdatePerformance();
  await PerformanceTests.testBalanceUpdatePerformance();
  await PerformanceTests.testFullTransactionFlow();
  
  // Cleanup ChartManager
  ChartManager.destroy();
}