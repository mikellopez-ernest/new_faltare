const SCRIPT_PROP_DB = 'db';
const TABLES_SHEET_NAME = 'tables';

const TABLE_NAMES = {
  PROFESSORS_DATA: 'Dades de professors',
  TEACHING_LOAD: 'Càrrega lectiva',
  SCHEDULES: 'Horaris',
};

const TABLE_SHEETS = {
  [TABLE_NAMES.PROFESSORS_DATA]: 'Llista',
  [TABLE_NAMES.TEACHING_LOAD]: 'assignatures',
  [TABLE_NAMES.SCHEDULES]: 'GPU001',
};

function getDatabaseSpreadsheetId_() {
  const dbSpreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty(SCRIPT_PROP_DB);

  if (!dbSpreadsheetId) {
    throw new Error('Missing script property "db" with the database registry spreadsheet ID.');
  }

  return String(dbSpreadsheetId).trim();
}

function loadTableRegistry_() {
  const dbSpreadsheetId = getDatabaseSpreadsheetId_();
  const dbSpreadsheet = SpreadsheetApp.openById(dbSpreadsheetId);
  const sheet = dbSpreadsheet.getSheetByName(TABLES_SHEET_NAME);

  if (!sheet) {
    throw new Error('Database registry spreadsheet is missing sheet "tables".');
  }

  const values = sheet.getDataRange().getDisplayValues();
  const registry = {};

  values.forEach(function(row) {
    const tableName = String(row[0] || '').trim();
    const spreadsheetId = String(row[1] || '').trim();

    if (tableName && spreadsheetId) {
      registry[tableName] = spreadsheetId;
    }
  });

  return registry;
}

function openTableSheet_(tableRegistry, tableName) {
  const spreadsheetId = tableRegistry[tableName];

  if (!spreadsheetId) {
    throw new Error('Table "' + tableName + '" was not found in the table registry.');
  }

  const sheetName = TABLE_SHEETS[tableName];

  if (!sheetName) {
    throw new Error('No sheet name has been configured for table "' + tableName + '".');
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      'Table "' + tableName + '" points to spreadsheet ID "' + spreadsheetId +
      '", but sheet "' + sheetName + '" was not found.'
    );
  }

  return sheet;
}

function loadTableValues_(tableRegistry, tableName) {
  const sheet = openTableSheet_(tableRegistry, tableName);
  return sheet.getDataRange().getDisplayValues();
}

function loadConfiguredTables_() {
  const tableRegistry = loadTableRegistry_();
  const tableData = {};

  Object.keys(TABLE_SHEETS).forEach(function(tableName) {
    tableData[tableName] = loadTableValues_(tableRegistry, tableName);
  });

  return tableData;
}
