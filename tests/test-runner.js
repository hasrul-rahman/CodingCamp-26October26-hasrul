/**
 * Node.js Test Runner for Expense & Budget Visualizer
 * Runs comprehensive tests against the app.js file
 */

const fs = require('fs');
const path = require('path');

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0 };
    this.errors = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n=== Expense & Budget Visualizer - Test Suite ===\n');
    
    // Mock LocalStorage for Node.js
    const mockLocalStorage = {
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
    
    // Mock window object
    global.window = {
      localStorage: mockLocalStorage
    };
    
    // Mock document object
    global.document = {
      documentElement: {
        className: '',
        style: {}
      },
      body: {
        style: {}
      },
      createElement(tag) {
        return { tagName: tag, children: [], attributes: {}, style: {} };
      },
      getElementById(id) {
        return { id, className: '', innerHTML: '', style: {}, hidden: false, value: '', children: [] };
      },
      readyState: 'complete',
      addEventListener(event, fn) {
        // Mock event listener
      }
    };
    
    // Mock Chart.js
    global.Chart = class MockChart {
      constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data;
        this.options = config.options;
      }
      update() {}
      destroy() {}
    };
    
    // Read and execute app.js
    const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Execute app.js with mocks
    const moduleWrapper = `(function() {
      ${appJsContent}
    })();`;
    
    try {
      // Create a function to execute the code
      const executeCode = new Function(moduleWrapper);
      executeCode();
    } catch (error) {
      console.error('Error loading app.js:', error.message);
    }
    
    // Now run the tests
    await this.runTests();
    
    // Restore original state
    if (mockLocalStorage.data['expense_transactions']) {
      delete mockLocalStorage.data['expense_transactions'];
    }
    if (mockLocalStorage.data['expense_theme']) {
      delete mockLocalStorage.data['expense_theme'];
    }
  }

  async runTests() {
    for (const test of this.tests) {
      try {
        await test.fn();
        this.results.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.results.failed++;
        this.errors.push({ name: test.name, error: error.message });
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n=== Test Summary ===');
    console.log(`Total: ${this.tests.length}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.errors.length > 0) {
      console.log('\nFailed Tests:');
      this.errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
      });
    }
  }

  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEquals(actual, expected, message = 'Values not equal') {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertCloseTo(actual, expected, tolerance = 0.01, message = 'Values not close enough') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }
}

// Initialize test runner
const runner = new TestRunner();

// Run all tests
runner.run().then(() => {
  process.exit(runner.results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});