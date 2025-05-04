function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Think Trek')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Function to include HTML files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getUniqueCategories() {
  // Open the spreadsheet and get the 'datastore' sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('datastore');
  
  // Get all data from the sheet
  const data = sheet.getDataRange().getValues();
  
  // Find the index of the 'Category' column
  const headers = data[0];
  const categoryIndex = headers.indexOf('Category');
  
  if (categoryIndex === -1) {
    return ["Category column not found"];
  }
  
  // Extract all categories (skip the header row)
  const allCategories = data.slice(1).map(row => row[categoryIndex]);
  
  // Filter out duplicates and empty values
  const uniqueCategories = [...new Set(allCategories.filter(category => category !== ""))];
  
  return uniqueCategories;
}

function getQuestionsByCategory(category) {
  // Open the spreadsheet and get the 'datastore' sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('datastore');
  
  // Get all data from the sheet
  const data = sheet.getDataRange().getValues();
  
  // Get header row and find column indices
  const headers = data[0];
  const slIndex = headers.indexOf('SL#');
  const categoryIndex = headers.indexOf('Category');
  const questionIndex = headers.indexOf('Questions');
  
  // Check if required columns exist
  if (slIndex === -1 || categoryIndex === -1 || questionIndex === -1) {
    return {error: "Required columns not found"};
  }
  
  // Filter data for the selected category (skip header row)
  const filteredData = data.slice(1).filter(row => row[categoryIndex] === category);
  
  // Extract sl#, category, and questions for the matching rows
  const questions = filteredData.map(row => ({
    sl: row[slIndex],
    category: row[categoryIndex],
    question: row[questionIndex]
  }));
  
  // Randomly select 5 questions (or all if there are fewer than 5)
  const randomlySelectedQuestions = getRandomItems(questions, 5);
  
  return randomlySelectedQuestions;
}

// Helper function to get random items from an array
function getRandomItems(array, count) {
  // Create a copy of the array to avoid modifying the original
  const arrayCopy = [...array];
  const result = [];
  const maxItems = Math.min(count, arrayCopy.length);
  
  // Randomly select items
  for (let i = 0; i < maxItems; i++) {
    // Generate a random index between 0 and the current array length
    const randomIndex = Math.floor(Math.random() * arrayCopy.length);
    
    // Move the selected item to the result array
    result.push(arrayCopy.splice(randomIndex, 1)[0]);
  }
  
  return result;
}

function getAnswerForQuestion(slNumber) {
  // Open the spreadsheet and get the 'datastore' sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('datastore');
  
  // Get all data from the sheet
  const data = sheet.getDataRange().getValues();
  
  // Get header row and find column indices
  const headers = data[0];
  const slIndex = headers.indexOf('SL#');
  const answerIndex = headers.indexOf('Answers');
  
  // Check if required columns exist
  if (slIndex === -1 || answerIndex === -1) {
    return "Required columns not found";
  }
  
  // Find the row with the matching SL# (skip header row)
  const matchingRow = data.slice(1).find(row => row[slIndex] == slNumber);
  
  if (!matchingRow) {
    return "Answer not found";
  }
  
  return matchingRow[answerIndex];
}

// Function to record incorrect answers
function recordIncorrectAnswer(slNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if the wrong_answers sheet exists, if not create it
  let wrongAnswersSheet = ss.getSheetByName('wrong_answers');
  if (!wrongAnswersSheet) {
    // Create the sheet and set up headers
    wrongAnswersSheet = ss.insertSheet('wrong_answers');
    wrongAnswersSheet.appendRow(['SL#', 'Category', 'Question', 'Answer', 'Wrong Count']);
    wrongAnswersSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  
  // Get the datastore sheet to look up question details
  const datastoreSheet = ss.getSheetByName('datastore');
  const datastoreData = datastoreSheet.getDataRange().getValues();
  
  // Find headers in datastore
  const datastoreHeaders = datastoreData[0];
  const slIndex = datastoreHeaders.indexOf('SL#');
  const categoryIndex = datastoreHeaders.indexOf('Category');
  const questionIndex = datastoreHeaders.indexOf('Questions');
  const answerIndex = datastoreHeaders.indexOf('Answers');
  
  // Find the question details in datastore
  const questionRow = datastoreData.slice(1).find(row => row[slIndex] == slNumber);
  if (!questionRow) {
    return false; // Question not found
  }
  
  // Get the data from wrong_answers sheet
  const wrongAnswersData = wrongAnswersSheet.getDataRange().getValues();
  
  // Find if this question is already in wrong_answers
  let existingRowIndex = -1;
  for (let i = 1; i < wrongAnswersData.length; i++) {
    if (wrongAnswersData[i][0] == slNumber) {
      existingRowIndex = i;
      break;
    }
  }
  
  if (existingRowIndex !== -1) {
    // Update existing record
    const currentCount = wrongAnswersData[existingRowIndex][4];
    wrongAnswersSheet.getRange(existingRowIndex + 1, 5).setValue(currentCount + 1);
  } else {
    // Add new record
    wrongAnswersSheet.appendRow([
      questionRow[slIndex],
      questionRow[categoryIndex],
      questionRow[questionIndex],
      questionRow[answerIndex],
      1
    ]);
  }
  
  // Reset correct streak for this question in mastery_tracking
  resetCorrectStreak(slNumber);
  
  return true;
}

// Function to get top incorrect answers
function getTopIncorrectAnswers(limit = 10) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if the wrong_answers sheet exists
  let wrongAnswersSheet = ss.getSheetByName('wrong_answers');
  if (!wrongAnswersSheet) {
    return []; // No wrong answers recorded yet
  }
  
  // Get all data from wrong_answers sheet
  const data = wrongAnswersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return []; // Only header row exists
  }
  
  // Skip header row, sort by wrong count in descending order
  const sortedData = data.slice(1)
    .sort((a, b) => b[4] - a[4])
    .slice(0, limit) // Take only the top entries based on limit
    .map(row => ({
      sl: row[0],
      category: row[1],
      question: row[2],
      answer: row[3],
      wrongCount: row[4]
    }));
  
  return sortedData;
}

// Function to record a correct answer and reduce wrong count if applicable
function recordCorrectAnswer(slNumber, isRetryMode = false) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Always track correct streak for mastery purposes, regardless of retry mode
  trackCorrectStreak(slNumber);
  
  // If in retry mode, don't reduce the wrong count
  if (isRetryMode) {
    return true;
  }
  
  // Check if the wrong_answers sheet exists
  let wrongAnswersSheet = ss.getSheetByName('wrong_answers');
  if (!wrongAnswersSheet) {
    return true; // No wrong answers sheet exists
  }
  
  // Get all data from wrong_answers sheet
  const data = wrongAnswersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return true; // Only header row exists, no questions to update
  }
  
  // Find if this question exists in wrong_answers
  let existingRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == slNumber) {
      existingRowIndex = i;
      break;
    }
  }
  
  // If question is not in wrong_answers sheet, no action needed
  if (existingRowIndex === -1) {
    return true;
  }
  
  // Get current wrong count
  const currentCount = data[existingRowIndex][4];
  
  if (currentCount <= 1) {
    // If count is 1 or less, remove the row entirely
    wrongAnswersSheet.deleteRow(existingRowIndex + 1);
  } else {
    // Otherwise, reduce the count by 1
    wrongAnswersSheet.getRange(existingRowIndex + 1, 5).setValue(currentCount - 1);
  }
  
  return true;
}

// Function to track correct answer streaks
function trackCorrectStreak(slNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if the mastery_tracking sheet exists, if not create it
  let masterySheet = ss.getSheetByName('mastery_tracking');
  if (!masterySheet) {
    // Create the sheet and set up headers
    masterySheet = ss.insertSheet('mastery_tracking');
    masterySheet.appendRow(['SL#', 'Correct Streak']);
    masterySheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  
  // Get all data from mastery_tracking sheet
  const masteryData = masterySheet.getDataRange().getValues();
  
  // Find if this question is already being tracked
  let existingRowIndex = -1;
  for (let i = 1; i < masteryData.length; i++) {
    if (masteryData[i][0] == slNumber) {
      existingRowIndex = i;
      break;
    }
  }
  
  if (existingRowIndex !== -1) {
    // Update existing record - increment streak
    const currentStreak = masteryData[existingRowIndex][1];
    const newStreak = currentStreak + 1;
    masterySheet.getRange(existingRowIndex + 1, 2).setValue(newStreak);
    
    // Check if streak is now 3
    if (newStreak >= 3) {
      // Move question to expert sheet
      moveToExpertSheet(slNumber);
    }
  } else {
    // Add new record with streak of 1
    masterySheet.appendRow([slNumber, 1]);
  }
  
  return true;
}

// Function to reset correct streak when question is answered incorrectly
function resetCorrectStreak(slNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if the mastery_tracking sheet exists
  let masterySheet = ss.getSheetByName('mastery_tracking');
  if (!masterySheet) {
    return false; // No mastery tracking sheet exists
  }
  
  // Get all data from mastery_tracking sheet
  const masteryData = masterySheet.getDataRange().getValues();
  
  // Find if this question is being tracked
  let existingRowIndex = -1;
  for (let i = 1; i < masteryData.length; i++) {
    if (masteryData[i][0] == slNumber) {
      existingRowIndex = i;
      break;
    }
  }
  
  // If question is being tracked, reset streak to 0
  if (existingRowIndex !== -1) {
    masterySheet.getRange(existingRowIndex + 1, 2).setValue(0);
  }
  
  return true;
}

// Function to move question to expert sheet
function moveToExpertSheet(slNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const datastoreSheet = ss.getSheetByName('datastore');
  
  // Check if the expert sheet exists, if not create it
  let expertSheet = ss.getSheetByName('expert');
  if (!expertSheet) {
    // Create the sheet and copy headers from datastore
    expertSheet = ss.insertSheet('expert');
    const datastoreHeaders = datastoreSheet.getRange(1, 1, 1, datastoreSheet.getLastColumn()).getValues();
    expertSheet.getRange(1, 1, 1, datastoreHeaders[0].length).setValues(datastoreHeaders);
    expertSheet.getRange(1, 1, 1, datastoreHeaders[0].length).setFontWeight('bold');
  }
  
  // Get all data from datastore sheet
  const datastoreData = datastoreSheet.getDataRange().getValues();
  const headers = datastoreData[0];
  const slIndex = headers.indexOf('SL#');
  
  // Find the row with the matching SL#
  let datastoreRowIndex = -1;
  for (let i = 1; i < datastoreData.length; i++) {
    if (datastoreData[i][slIndex] == slNumber) {
      datastoreRowIndex = i;
      break;
    }
  }
  
  // If question is found, move it to expert sheet
  if (datastoreRowIndex !== -1) {
    // Copy the question data to expert sheet
    expertSheet.appendRow(datastoreData[datastoreRowIndex]);
    
    // Delete the question from datastore
    datastoreSheet.deleteRow(datastoreRowIndex + 1);
    
    // Also remove from mastery_tracking sheet
    const masterySheet = ss.getSheetByName('mastery_tracking');
    if (masterySheet) {
      const masteryData = masterySheet.getDataRange().getValues();
      for (let i = 1; i < masteryData.length; i++) {
        if (masteryData[i][0] == slNumber) {
          masterySheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    return true;
  }
  
  return false;
}