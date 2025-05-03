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