function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Think Trek')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
  
  // Return only the first 5 questions
  return questions.slice(0, 5);
}