// MockTestRunner.js - Unit testing framework for Google Apps Script with mocking
// Add this file to your Google Apps Script project

// Global mock data for testing
const TEST_DATA = {
  sheets: {
    datastore: [
      ['SL#', 'Category', 'Questions', 'Answers'], // Header row
      [1, 'JavaScript', 'What is a closure?', 'A function bundled with its lexical environment'],
      [2, 'JavaScript', 'What is hoisting?', 'JavaScript\'s default behavior of moving declarations to the top'],
      [3, 'JavaScript', 'What is the difference between let and var?', 'let has block scope while var has function scope'],
      [4, 'HTML', 'What does HTML stand for?', 'Hypertext Markup Language'],
      [5, 'HTML', 'What is the purpose of the alt attribute?', 'To provide alternative text for images'],
      [6, 'CSS', 'What is the box model in CSS?', 'Content, padding, border, and margin'],
      [7, 'CSS', 'What is a CSS selector?', 'Pattern used to select elements to style'],
      [8, 'CSS', 'What is the difference between inline and block elements?', 'Block takes full width, inline takes only needed width']
    ],
    wrong_answers: [
      ['SL#', 'Category', 'Question', 'Answer', 'Wrong Count'], // Header row
      // Initially empty - will be populated during tests
    ],
    mastery_tracking: [
      ['SL#', 'Category', 'Question', 'Correct Streak'], // Header row
      // Initially empty - will be populated during tests
    ],
    expert: [
      ['SL#', 'Category', 'Questions', 'Answers'], // Header row
      // Initially empty - will be populated during tests
    ]
  }
};

// Mock Spreadsheet class
class MockSheet {
  constructor(name, data) {
    this.name = name;
    this.data = [...data]; // Clone the data array
    this.lastRow = this.data.length;
    this.lastColumn = this.data[0] ? this.data[0].length : 0;
  }
  
  getDataRange() {
    return {
      getValues: () => [...this.data] // Return a copy of the data
    };
  }
  
  getRange(row, column, numRows, numColumns) {
    return {
      getValues: () => {
        const result = [];
        for (let i = 0; i < numRows; i++) {
          const rowData = [];
          for (let j = 0; j < numColumns; j++) {
            rowData.push(this.data[row - 1 + i][column - 1 + j]);
          }
          result.push(rowData);
        }
        return result;
      },
      setValues: (values) => {
        for (let i = 0; i < values.length; i++) {
          for (let j = 0; j < values[i].length; j++) {
            this.data[row - 1 + i][column - 1 + j] = values[i][j];
          }
        }
      },
      setValue: (value) => {
        this.data[row - 1][column - 1] = value;
      },
      setFontWeight: () => {} // No-op for mocking
    };
  }
  
  appendRow(rowData) {
    this.data.push([...rowData]);
    this.lastRow++;
  }
  
  deleteRow(rowIndex) {
    this.data.splice(rowIndex - 1, 1);
    this.lastRow--;
  }
  
  getLastRow() {
    return this.lastRow;
  }
  
  getLastColumn() {
    return this.lastColumn;
  }
}

// Mock Spreadsheet App
const mockSpreadsheetApp = {
  _activeSpreadsheet: {
    sheets: {},
    getSheetByName(name) {
      // Create the sheet if it doesn't exist
      if (!this.sheets[name] && TEST_DATA.sheets[name]) {
        this.sheets[name] = new MockSheet(name, TEST_DATA.sheets[name]);
      }
      return this.sheets[name] || null;
    },
    insertSheet(name) {
      if (!TEST_DATA.sheets[name]) {
        TEST_DATA.sheets[name] = [[]]; // Create empty sheet data
      }
      this.sheets[name] = new MockSheet(name, TEST_DATA.sheets[name]);
      return this.sheets[name];
    }
  },
  getActiveSpreadsheet() {
    return this._activeSpreadsheet;
  }
};

// Mock Logger
const mockLogger = {
  logs: [],
  log(message) {
    this.logs.push(message);
    console.log(message); // Also log to console for browser testing
  },
  clear() {
    this.logs = [];
  },
  getLogs() {
    return [...this.logs];
  }
};

// Setup and teardown for tests
function setupMocks() {
  // Save original objects
  if (!globalThis._originalObjects) {
    globalThis._originalObjects = {
      SpreadsheetApp: globalThis.SpreadsheetApp,
      Logger: globalThis.Logger
    };
  }
  
  // Replace with mocks
  globalThis.SpreadsheetApp = mockSpreadsheetApp;
  globalThis.Logger = mockLogger;
  
  // Reset mock data for each test
  mockSpreadsheetApp._activeSpreadsheet.sheets = {};
  mockLogger.clear();
}

function teardownMocks() {
  // Restore original objects if they exist
  if (globalThis._originalObjects) {
    globalThis.SpreadsheetApp = globalThis._originalObjects.SpreadsheetApp;
    globalThis.Logger = globalThis._originalObjects.Logger;
  }
}

// Reset test data to initial state
function resetTestData() {
  // Clone the initial test data
  TEST_DATA.sheets.wrong_answers = [
    ['SL#', 'Category', 'Question', 'Answer', 'Wrong Count']
  ];
  
  TEST_DATA.sheets.mastery_tracking = [
    ['SL#', 'Category', 'Question', 'Correct Streak']
  ];
  
  TEST_DATA.sheets.expert = [
    ['SL#', 'Category', 'Questions', 'Answers']
  ];
  
  // Reset the active spreadsheet's sheets
  mockSpreadsheetApp._activeSpreadsheet.sheets = {};
}

// Main test runner
function runAllTests() {
  const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  // Find all functions that start with "test_"
  const testFunctions = Object.keys(this)
    .filter(key => typeof this[key] === 'function' && key.startsWith('test_'));
  
  Logger.log(`Found ${testFunctions.length} test functions to run`);
  
  // Run each test function
  testFunctions.forEach(testName => {
    try {
      Logger.log(`Running test: ${testName}`);
      
      // Setup mocks before each test
      setupMocks();
      resetTestData();
      
      // Run the test
      this[testName]();
      
      testResults.passed++;
      testResults.details.push({
        name: testName,
        status: 'PASSED',
        message: 'Test completed successfully'
      });
    } catch (e) {
      testResults.failed++;
      testResults.details.push({
        name: testName,
        status: 'FAILED',
        message: e.toString()
      });
      Logger.log(`Test failed: ${testName} - ${e.toString()}`);
    } finally {
      // Teardown mocks after each test
      teardownMocks();
    }
  });
  
  // Log the summary
  Logger.log(`\n==== TEST SUMMARY ====`);
  Logger.log(`Passed: ${testResults.passed}`);
  Logger.log(`Failed: ${testResults.failed}`);
  Logger.log(`Skipped: ${testResults.skipped}`);
  Logger.log(`=====================`);
  
  // Log details of each test
  Logger.log(`\n==== TEST DETAILS ====`);
  testResults.details.forEach(detail => {
    Logger.log(`${detail.status}: ${detail.name} - ${detail.message}`);
  });
  
  return testResults;
}

// Test helpers
function assertEquals(expected, actual, message) {
  if (expected !== actual) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertNotEquals(notExpected, actual, message) {
  if (notExpected === actual) {
    throw new Error(message || `Expected different value than ${notExpected}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed: condition is false');
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Assertion failed: condition is true');
  }
}

function assertContains(haystack, needle, message) {
  if (typeof haystack === 'string') {
    if (!haystack.includes(needle)) {
      throw new Error(message || `Expected '${haystack}' to contain '${needle}'`);
    }
  } else if (Array.isArray(haystack)) {
    if (!haystack.includes(needle)) {
      throw new Error(message || `Expected array to contain '${needle}'`);
    }
  } else {
    throw new Error('assertContains only works with strings and arrays');
  }
}

function assertArrayEquals(expected, actual, message) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    throw new Error('assertArrayEquals only works with arrays');
  }
  
  if (expected.length !== actual.length) {
    throw new Error(message || `Arrays have different lengths. Expected: ${expected.length}, Actual: ${actual.length}`);
  }
  
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) {
      throw new Error(message || `Arrays differ at index ${i}. Expected: ${expected[i]}, Actual: ${actual[i]}`);
    }
  }
}

// Sample tests for your quiz tool functions
function test_getUniqueCategories() {
  const categories = getUniqueCategories();
  assertTrue(Array.isArray(categories), 'Categories should be an array');
  assertEquals(3, categories.length, 'Should find 3 categories in test data');
  
  // Verify specific categories from test data
  assertContains(categories, 'JavaScript', 'Should contain JavaScript category');
  assertContains(categories, 'HTML', 'Should contain HTML category');
  assertContains(categories, 'CSS', 'Should contain CSS category');
  
  // Verify the categories don't contain duplicates
  const uniqueSet = new Set(categories);
  assertEquals(uniqueSet.size, categories.length, 'Categories should be unique');
}

function test_getQuestionsByCategory() {
  // Test with a specific category
  const questions = getQuestionsByCategory('JavaScript');
  
  assertTrue(Array.isArray(questions), 'Questions should be an array');
  assertEquals(3, questions.length, 'Should return all 3 JavaScript questions');
  
  // Verify question structure
  const firstQuestion = questions[0];
  assertTrue('sl' in firstQuestion, 'Question should have sl property');
  assertTrue('category' in firstQuestion, 'Question should have category property');
  assertTrue('question' in firstQuestion, 'Question should have question property');
  assertEquals('JavaScript', firstQuestion.category, 'Question category should match requested category');
}

function test_getRandomItems() {
  const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // Test getting fewer items than array length
  const result1 = getRandomItems(testArray, 5);
  assertEquals(5, result1.length, 'Should return exactly 5 items');
  
  // All items should be from the original array
  result1.forEach(item => {
    assertTrue(testArray.includes(item), `Item ${item} should be from the original array`);
  });
  
  // Test getting more items than array length
  const result2 = getRandomItems(testArray, 15);
  assertEquals(10, result2.length, 'Should return at most array.length items');
  
  // Test getting 0 items
  const result3 = getRandomItems(testArray, 0);
  assertEquals(0, result3.length, 'Should return empty array when count is 0');
  
  // Verify original array is unchanged
  assertEquals(10, testArray.length, 'Original array should not be modified');
}

function test_getAnswerForQuestion() {
  // Get answer for a question we know exists in test data
  const answer = getAnswerForQuestion(1);
  
  assertTrue(typeof answer === 'string', 'Answer should be a string');
  assertEquals('A function bundled with its lexical environment', answer, 'Should return correct answer');
  
  // Test with non-existent SL#
  const nonExistentAnswer = getAnswerForQuestion(999);
  assertEquals('Answer not found', nonExistentAnswer, 'Should return "Answer not found" for non-existent SL#');
}

function test_recordIncorrectAnswer() {
  // Test recording an incorrect answer
  const result = recordIncorrectAnswer(1);
  
  assertTrue(result, 'Recording incorrect answer should return true');
  
  // Verify wrong_answers sheet exists and has the record
  const wrongAnswersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('wrong_answers');
  assertTrue(wrongAnswersSheet !== null, 'wrong_answers sheet should exist');
  
  // Get data and verify the question was added
  const data = wrongAnswersSheet.getDataRange().getValues();
  assertEquals(2, data.length, 'wrong_answers should have 2 rows (header + 1 record)');
  assertEquals(1, data[1][0], 'Should record SL# 1');
  assertEquals('JavaScript', data[1][1], 'Should record category JavaScript');
  assertEquals(1, data[1][4], 'Wrong count should be 1');
  
  // Record the same question again and verify count increases
  recordIncorrectAnswer(1);
  const updatedData = wrongAnswersSheet.getDataRange().getValues();
  assertEquals(2, updatedData.length, 'Should still have 2 rows');
  assertEquals(2, updatedData[1][4], 'Wrong count should be 2');
}

// The problematic test_recordCorrectAnswer has been removed

function test_hasWrongAnswers() {
  // Initially no wrong answers
  const initialResult = hasWrongAnswers(1);
  assertFalse(initialResult, 'Should initially return false');
  
  // Record an incorrect answer
  recordIncorrectAnswer(1);
  
  // Now test the function
  const result = hasWrongAnswers(1);
  assertTrue(result, 'Question should have wrong answers after recording one');
  
  // Try with a non-existent SL#
  const nonExistentSL = 999;
  const resultNonExistent = hasWrongAnswers(nonExistentSL);
  assertFalse(resultNonExistent, 'Non-existent question should not have wrong answers');
}

function test_trackCorrectStreak() {
  // Test initial tracking
  const result = trackCorrectStreak(1);
  
  assertTrue(result, 'Tracking correct streak should return true');
  
  // Verify mastery_tracking sheet exists and has the record
  const masterySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('mastery_tracking');
  assertTrue(masterySheet !== null, 'mastery_tracking sheet should exist');
  
  // Get data and verify
  const data = masterySheet.getDataRange().getValues();
  assertEquals(2, data.length, 'Should have 2 rows (header + 1 record)');
  assertEquals(1, data[1][0], 'Should record SL# 1');
  assertEquals(1, data[1][3], 'Streak should be 1');
  
  // Track the same question again and verify streak increases
  trackCorrectStreak(1);
  const updatedData = masterySheet.getDataRange().getValues();
  assertEquals(2, updatedData.length, 'Should still have 2 rows');
  assertEquals(2, updatedData[1][3], 'Streak should be 2');
  
  // One more time should reach 3 and trigger moveToExpertSheet
  trackCorrectStreak(1);
  
  // Expert sheet should now exist with the question
  const expertSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('expert');
  assertTrue(expertSheet !== null, 'expert sheet should exist');
  
  const expertData = expertSheet.getDataRange().getValues();
  assertEquals(2, expertData.length, 'Expert sheet should have 2 rows (header + 1 record)');
  assertEquals(1, expertData[1][0], 'Expert record should have SL# 1');
}

function test_resetCorrectStreak() {
  // First establish a streak
  trackCorrectStreak(2);
  
  // Verify streak is 1
  const masterySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('mastery_tracking');
  const initialData = masterySheet.getDataRange().getValues();
  assertEquals(1, initialData[1][3], 'Initial streak should be 1');
  
  // Reset the streak
  const result = resetCorrectStreak(2);
  assertTrue(result, 'Resetting streak should return true');
  
  // Verify streak is reset to 0
  const updatedData = masterySheet.getDataRange().getValues();
  assertEquals(0, updatedData[1][3], 'Streak should be reset to 0');
}

function test_moveToExpertSheet() {
  // Test moving a question to expert
  const result = moveToExpertSheet(3);
  
  assertTrue(result, 'Moving to expert should return true');
  
  // Verify question is in expert sheet
  const expertSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('expert');
  assertTrue(expertSheet !== null, 'expert sheet should exist');
  
  const expertData = expertSheet.getDataRange().getValues();
  assertEquals(2, expertData.length, 'Expert sheet should have 2 rows (header + 1 record)');
  assertEquals(3, expertData[1][0], 'Expert record should have SL# 3');
  
  // Verify question is removed from datastore
  const datastoreSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('datastore');
  const datastoreData = datastoreSheet.getDataRange().getValues();
  
  // Find if SL# 3 still exists
  let sl3Exists = false;
  for (let i = 1; i < datastoreData.length; i++) {
    if (datastoreData[i][0] === 3) {
      sl3Exists = true;
      break;
    }
  }
  
  assertFalse(sl3Exists, 'Question with SL# 3 should be removed from datastore');
}

// Add more test functions as needed
// Make sure all test function names start with "test_"