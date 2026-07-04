const SCRIPT_PROP_DB = 'db';
const TABLES_SHEET_NAME = 'tables';

const TABLE_NAMES = {
  PROFESSORS_DATA: 'Dades de professors',
  TEACHING_LOAD: 'Càrrega lectiva',
  SCHEDULES: 'Horaris',
  ABSENCE_FORM: 'Faltaré',
};

const TABLE_SHEETS = {
  [TABLE_NAMES.PROFESSORS_DATA]: 'Llista',
  [TABLE_NAMES.TEACHING_LOAD]: 'assignatures',
  [TABLE_NAMES.SCHEDULES]: 'GPU001',
  [TABLE_NAMES.ABSENCE_FORM]: 'form_data',
};

const FORM_DATA_COLUMNS = [
  'row_id',
  'created_at',
  'updated_at',
  'adreca_electronica',
  'absence_teacher_name',
  'absence_teacher_email',
  'teacher_code',
  'que_vols_fer',
  'professor_acompanyant',
  'absence_date',
  'multi_day',
  'selected_schedule_items_json',
  'reincorporation_date',
  'multi_day_student_work',
  'motiu',
  'motiu_route',
  'context',
  'hores',
  'hores_a_recuperar',
  'recovery_items_json',
  'permis_llicencia_absencia',
  'document_file_id',
  'document_file_url',
  'document_file_name',
  'confirmation_ok',
  'status',
  'managed',
];

const REASON_ROUTES = {
  HOURS: 'J-a',
  RECOVERY: 'J-b',
};

const MANAGED_COLUMN_NAME = 'managed';

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Gestió de Faltaré')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminPageData() {
  const tableRegistry = loadTableRegistry_();
  const formSheet = openTableSheet_(tableRegistry, TABLE_NAMES.ABSENCE_FORM);
  const professorsSheet = openTableSheet_(tableRegistry, TABLE_NAMES.PROFESSORS_DATA);
  const teacherByCode = buildTeacherByCode_(readSheetDisplayValues_(professorsSheet, 11));
  const rows = readFormDataRows_(readSheetDisplayValues_(formSheet, FORM_DATA_COLUMNS.length), teacherByCode);

  return {
    rows: rows,
    counts: {
      total: rows.length,
      managed: rows.filter(function(row) { return row.managed; }).length,
      pending: rows.filter(function(row) { return !row.managed; }).length,
    },
  };
}

function markRowsManaged(rowNumbers) {
  if (!Array.isArray(rowNumbers) || !rowNumbers.length) {
    throw new Error('Cal seleccionar com a mínim un registre.');
  }

  const cleanRowNumbers = rowNumbers.map(function(rowNumber) {
    return Number(rowNumber);
  }).filter(function(rowNumber, index, list) {
    return Number.isFinite(rowNumber) && rowNumber >= 2 && list.indexOf(rowNumber) === index;
  });

  if (!cleanRowNumbers.length) {
    throw new Error('No hi ha cap registre seleccionat vàlid.');
  }

  const tableRegistry = loadTableRegistry_();
  const formSheet = openTableSheet_(tableRegistry, TABLE_NAMES.ABSENCE_FORM);
  const managedColumn = getManagedColumn_(formSheet);

  cleanRowNumbers.forEach(function(rowNumber) {
    if (rowNumber > formSheet.getLastRow()) {
      throw new Error('El registre de la fila ' + rowNumber + ' no existeix.');
    }

    formSheet.getRange(rowNumber, managedColumn).setValue(true);
  });

  return {
    ok: true,
    updated: cleanRowNumbers.length,
  };
}

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

function readFormDataRows_(values, teacherByCode) {
  if (values.length < 2) {
    return [];
  }

  const headerMap = buildHeaderMap_(values[0]);

  return values.slice(1).map(function(row, index) {
    const rowObject = rowToObjectByHeader_(row, headerMap);
    const rowNumber = Number(rowObject.row_id || index + 2);
    const route = String(rowObject.motiu_route || '').trim();
    const teacherCode = String(rowObject.teacher_code || '').trim();
    const teacher = teacherByCode[normalizeKey_(teacherCode)] || {};
    const licenseValue = String(rowObject.permis_llicencia_absencia || '').trim();

    return {
      rowNumber: rowNumber,
      selected: false,
      absenceDate: rowObject.absence_date,
      teacherCode: teacherCode,
      teacherName: teacher.name || rowObject.absence_teacher_name || teacherCode,
      context: rowObject.context,
      multiDay: rowObject.multi_day,
      route: route,
      recoverable: route === REASON_ROUTES.RECOVERY,
      recoverableLabel: route === REASON_ROUTES.RECOVERY ? 'Sí' : 'No',
      hours: route === REASON_ROUTES.RECOVERY ? rowObject.hores_a_recuperar : rowObject.hores,
      license: normalizeKey_(licenseValue) === normalizeKey_('Absència ordinària') ? 'No' : 'Sí',
      licenseValue: licenseValue,
      documentUrl: rowObject.document_file_url,
      managed: parseBoolean_(rowObject.managed),
      dbOrder: index,
    };
  });
}

function readSheetDisplayValues_(sheet, columnCount) {
  const lastRow = sheet.getLastRow();

  if (!lastRow) {
    return [];
  }

  return sheet.getRange(1, 1, lastRow, columnCount).getDisplayValues();
}

function getManagedColumn_(sheet) {
  const headerValues = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), FORM_DATA_COLUMNS.length)).getDisplayValues()[0];
  const managedIndex = headerValues.map(normalizeHeader_).indexOf(normalizeHeader_(MANAGED_COLUMN_NAME));

  if (managedIndex === -1) {
    throw new Error('La taula Faltaré/form_data no té la columna "' + MANAGED_COLUMN_NAME + '".');
  }

  return managedIndex + 1;
}

function buildHeaderMap_(headers) {
  const headerMap = {};

  headers.forEach(function(header, index) {
    const key = normalizeHeader_(header);

    if (key) {
      headerMap[key] = index;
    }
  });

  FORM_DATA_COLUMNS.forEach(function(header, index) {
    const key = normalizeHeader_(header);

    if (headerMap[key] === undefined && index < headers.length) {
      headerMap[key] = index;
    }
  });

  return headerMap;
}

function rowToObjectByHeader_(row, headerMap) {
  return FORM_DATA_COLUMNS.reduce(function(object, header) {
    const index = headerMap[normalizeHeader_(header)];
    object[header] = index === undefined ? '' : String(row[index] || '').trim();
    return object;
  }, {});
}

function buildTeacherByCode_(values) {
  return values.slice(1).reduce(function(map, row) {
    const code = String(row[5] || '').trim();

    if (!code) {
      return map;
    }

    map[normalizeKey_(code)] = {
      code: code,
      name: joinName_(row[2], row[3], row[4]),
      email: String(row[10] || '').trim(),
    };

    return map;
  }, {});
}

function normalizeHeader_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeKey_(value) {
  return String(value || '').trim().toLowerCase();
}

function parseBoolean_(value) {
  const normalized = normalizeKey_(value);
  return normalized === 'true' || normalized === 'sí' || normalized === 'si' || normalized === '1' || normalized === 'yes';
}

function joinName_(name, surname1, surname2) {
  return [name, surname1, surname2].map(function(part) {
    return String(part || '').trim();
  }).filter(Boolean).join(' ');
}
