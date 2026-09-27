const SCRIPT_PROP_DB = 'db';
const TABLES_SHEET_NAME = 'tables';
const ACCESS_GRANTED_PROPERTY_NAME = 'access_granted';

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

const FALTARE_SHEETS = {
  FORM_DATA: 'form_data',
  RECOVERY: 'recovery',
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
  'reincorporation_date',
  'multi_day_student_work',
  'motiu',
  'motiu_route',
  'context',
  'hores',
  'hores_a_recuperar',
  'permis_llicencia_absencia',
  'document_file_id',
  'document_file_url',
  'document_file_name',
  'confirmation_ok',
  'status',
  'managed',
];

const RECOVERY_COLUMNS = [
  'row_id',
  'recovery_item_id',
  'item_index',
  'date',
  'time',
  'created_at',
  'updated_at',
];

const PROTECTED_FORM_DATA_COLUMNS = {
  row_id: true,
  created_at: true,
  updated_at: true,
};

const REASON_ROUTES = {
  HOURS: 'J-a',
  RECOVERY: 'J-b',
};

const REASONS = [
  { value: 'Estic de baixa (cal adjuntar document baixa per justificació)', route: REASON_ROUTES.HOURS },
  { value: 'Absència per motius de salut de màxim 15 hores (cal adjuntar declaració responsable)', route: REASON_ROUTES.HOURS },
  { value: 'Absència per visita mèdica (cal adjuntar justificant visita)', route: REASON_ROUTES.HOURS },
  { value: 'Absència per encàrrec de servei o formació de centre', route: REASON_ROUTES.HOURS },
  { value: 'Absència per realització de prova mèdica invasiva (cal adjuntar justificant visita)', route: REASON_ROUTES.HOURS },
  { value: 'Absència per menstruació o climateri (recuperable)', route: REASON_ROUTES.RECOVERY },
  { value: "Absència per visita mèdica d'un familiar (Cal recuperar les hores)", route: REASON_ROUTES.RECOVERY },
  { value: 'ATRI - Absència per reunió de tutoria dels fills (Cal omplir ATRI i recuperar les hores)', route: REASON_ROUTES.RECOVERY },
  { value: 'ATRI - Llicència per assumptes propis no remunerats (Cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Llicència per estudis no retribuïts (Cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís de maternitat/paternitat (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: "ATRI - Permís per accident d'un familiar (cal omplir ATRI)", route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per adopció internacional (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per atendre fill discapacitat (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per deure inexcusable (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per deures de conciliació de la vida familiar i laboral (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per dol gestacional (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'Permís per examen prenatal / preparació part / reproducció assistida (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per exàmens finals en centres oficials (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: "ATRI - Permís per força major per motiu d'emergència ambientals (cal omplir ATRI)", route: REASON_ROUTES.HOURS },
  { value: "ATRI - Permís per hospitalització d'un familiar (cal omplir ATRI)", route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per lactància (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per malaltia greu d\'un familiar (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per matrimoni (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: "ATRI - Permís per matrimoni d'un fill o familiar de fins 2n grau de consanguinitat (cal omplir ATRI)", route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per defunció d\'un familiar (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per situació de violència de gènere (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per tràmits adopció/acolliment (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'ATRI - Permís per trasllat de domilici (cal omplir ATRI)', route: REASON_ROUTES.HOURS },
  { value: 'Absència no justificable aprovada per direcció (Cal recuperar les hores)', route: REASON_ROUTES.RECOVERY },
];

const MANAGED_COLUMN_NAME = 'managed';
const WORKLOAD_PROFESSORS_SHEET_NAME = 'professors';
const WORKLOAD_CARRECS_SHEET_NAME = 'carrecs';

const WORKLOAD_PROFESSORS_COLUMNS = {
  correuInstit: 12,
  teacherKey: 17,
};

const CARRECS_COLUMNS = {
  carrec: 1,
  asignado: 4,
};

function doGet() {
  const access = getAccessDecision_();

  if (!access.allowed) {
    return createAccessDeniedOutput_(access);
  }

  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Gestió de Faltaré')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminPageData() {
  assertUserAccess_();

  const tableRegistry = loadTableRegistry_();
  const formSheet = openTableSheet_(tableRegistry, TABLE_NAMES.ABSENCE_FORM);
  const professorsSheet = openTableSheet_(tableRegistry, TABLE_NAMES.PROFESSORS_DATA);
  const teacherByCode = buildTeacherByCode_(readSheetDisplayValues_(professorsSheet, 11));
  const rows = readFormDataRows_(readSheetDisplayValues_(formSheet), teacherByCode);

  return {
    rows: rows,
    reasons: REASONS.map(function(reason) { return reason.value; }),
    counts: {
      total: rows.length,
      managed: rows.filter(function(row) { return row.managed; }).length,
      pending: rows.filter(function(row) { return !row.managed; }).length,
    },
  };
}

function getAdminRecord(rowId) {
  assertUserAccess_();

  const tableRegistry = loadTableRegistry_();
  const formSheet = openFaltareSheet_(tableRegistry, FALTARE_SHEETS.FORM_DATA);
  const recoverySheet = openFaltareSheet_(tableRegistry, FALTARE_SHEETS.RECOVERY);
  const record = getFormRecordByRowId_(formSheet, rowId);

  return buildAdminRecordResponse_(record.rowObject, recoverySheet);
}

function saveAdminRecord(payload) {
  assertUserAccess_();

  if (!payload || !payload.rowId || !payload.formData || !Array.isArray(payload.recoveryRows)) {
    throw new Error('No s\'han rebut les dades del registre.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    validateRecoveryRows_(payload.recoveryRows);

    const selectedReason = String(payload.formData.motiu || '').trim();
    const selectedReasonRoute = getReasonRoute_(selectedReason);

    const tableRegistry = loadTableRegistry_();
    const formSheet = openFaltareSheet_(tableRegistry, FALTARE_SHEETS.FORM_DATA);
    const recoverySheet = openFaltareSheet_(tableRegistry, FALTARE_SHEETS.RECOVERY);
    const record = getFormRecordByRowId_(formSheet, payload.rowId);
    const headerValues = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getDisplayValues()[0];
    const headerMap = buildHeaderMap_(headerValues);
    const rowValues = formSheet.getRange(record.physicalRowNumber, 1, 1, formSheet.getLastColumn()).getValues()[0];

    FORM_DATA_COLUMNS.forEach(function(column) {
      if (PROTECTED_FORM_DATA_COLUMNS[column]) {
        return;
      }

      const columnIndex = headerMap[normalizeHeader_(column)];

      if (columnIndex === undefined || !Object.prototype.hasOwnProperty.call(payload.formData, column)) {
        return;
      }

      rowValues[columnIndex] = normalizeAdminFormValue_(column, payload.formData[column]);
    });

    const reasonRouteIndex = headerMap[normalizeHeader_('motiu_route')];

    if (reasonRouteIndex !== undefined) {
      rowValues[reasonRouteIndex] = selectedReasonRoute;
    }

    const updatedAtIndex = headerMap[normalizeHeader_('updated_at')];

    if (updatedAtIndex !== undefined) {
      rowValues[updatedAtIndex] = new Date();
    }

    formSheet.getRange(record.physicalRowNumber, 1, 1, rowValues.length).setValues([rowValues]);
    replaceAdminRecoveryRows_(recoverySheet, record.rowId, payload.recoveryRows);

    const updatedRecord = getFormRecordByRowId_(formSheet, record.rowId);

    return {
      ok: true,
      record: buildAdminRecordResponse_(updatedRecord.rowObject, recoverySheet),
    };
  } finally {
    lock.releaseLock();
  }
}

function markRowsManaged(rowIds) {
  assertUserAccess_();

  if (!Array.isArray(rowIds) || !rowIds.length) {
    throw new Error('Cal seleccionar com a mínim un registre.');
  }

  const cleanRowIds = rowIds.map(function(rowId) {
    return String(rowId || '').trim();
  }).filter(function(rowId, index, list) {
    return rowId && list.indexOf(rowId) === index;
  });

  if (!cleanRowIds.length) {
    throw new Error('No hi ha cap registre seleccionat vàlid.');
  }

  const tableRegistry = loadTableRegistry_();
  const formSheet = openTableSheet_(tableRegistry, TABLE_NAMES.ABSENCE_FORM);
  const managedColumn = getManagedColumn_(formSheet);

  cleanRowIds.forEach(function(rowId) {
    const record = getFormRecordByRowId_(formSheet, rowId);
    formSheet.getRange(record.physicalRowNumber, managedColumn).setValue(true);
  });

  return {
    ok: true,
    updated: cleanRowIds.length,
  };
}

function grantRequiredPermissions() {
  const properties = PropertiesService.getScriptProperties();
  properties.getProperty(SCRIPT_PROP_DB);
  properties.getProperty(ACCESS_GRANTED_PROPERTY_NAME);
  Session.getActiveUser().getEmail();

  getWorkloadCarrecsSheet_().getRange(1, 1).getValue();
  getWorkloadProfessorsSheet_().getRange(1, 1).getValue();

  return {
    ok: true,
    message: 'Permisos concedits correctament.',
  };
}

function assertUserAccess_() {
  const access = getAccessDecision_();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  return access;
}

function getAccessDecision_() {
  try {
    const userEmail = normalizeEmail_(Session.getActiveUser().getEmail());

    if (!userEmail) {
      return {
        allowed: false,
        email: '',
        message: 'No s\'ha pogut identificar el correu de l\'usuari actiu.',
      };
    }

    const accessEntries = getAccessGrantedRoles_();

    if (!accessEntries.length) {
      return {
        allowed: false,
        email: userEmail,
        message: 'Falta configurar la propietat de script "' + ACCESS_GRANTED_PROPERTY_NAME + '".',
      };
    }

    const directEmails = accessEntries.map(normalizeEmail_).filter(function(entry) {
      return entry.indexOf('@') !== -1;
    });
    const roles = accessEntries.filter(function(entry) {
      return normalizeEmail_(entry).indexOf('@') === -1;
    });
    const peopleByRole = getPeopleByAccessRole_();
    const people = [];

    roles.forEach(function(role) {
      const assignedPeople = peopleByRole[normalizeText_(role)] || [];
      assignedPeople.forEach(function(person) {
        people.push(person);
      });
    });

    const authorizedEmails = getEmailsForPeople_(people);

    directEmails.forEach(function(email) {
      authorizedEmails[email] = true;
    });

    const allowed = Boolean(authorizedEmails[userEmail]);

    return {
      allowed: allowed,
      email: userEmail,
      accessEntries: accessEntries,
      roles: roles,
      directEmails: directEmails,
      people: people,
      message: allowed
        ? 'Accés autoritzat.'
        : 'No tens permisos per accedir a aquesta aplicació.',
    };
  } catch (error) {
    return {
      allowed: false,
      email: normalizeEmail_(Session.getActiveUser().getEmail()),
      message: error && error.message ? error.message : String(error),
    };
  }
}

function getAccessGrantedRoles_() {
  return splitCommaList_(
    PropertiesService.getScriptProperties().getProperty(ACCESS_GRANTED_PROPERTY_NAME)
  );
}

function getPeopleByAccessRole_() {
  const sheet = getWorkloadCarrecsSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {};
  }

  const values = sheet.getRange(2, 1, lastRow - 1, CARRECS_COLUMNS.asignado).getValues();
  const peopleByRole = {};

  values.forEach(function(row) {
    const roleName = toDisplayString_(row[CARRECS_COLUMNS.carrec - 1]);

    if (!roleName) {
      return;
    }

    peopleByRole[normalizeText_(roleName)] = splitCommaList_(row[CARRECS_COLUMNS.asignado - 1]);
  });

  return peopleByRole;
}

function getEmailsForPeople_(people) {
  const sheet = getWorkloadProfessorsSheet_();
  const lastRow = sheet.getLastRow();
  const emails = {};

  if (lastRow < 2 || !people.length) {
    return emails;
  }

  const peopleSet = people.reduce(function(map, person) {
    map[normalizeText_(person)] = true;
    return map;
  }, {});
  const values = sheet.getRange(2, 1, lastRow - 1, WORKLOAD_PROFESSORS_COLUMNS.teacherKey).getValues();

  values.forEach(function(row) {
    const teacherKey = normalizeText_(row[WORKLOAD_PROFESSORS_COLUMNS.teacherKey - 1]);

    if (!peopleSet[teacherKey]) {
      return;
    }

    const email = normalizeEmail_(row[WORKLOAD_PROFESSORS_COLUMNS.correuInstit - 1]);

    if (email) {
      emails[email] = true;
    }
  });

  people.forEach(function(person) {
    const directEmail = normalizeEmail_(person);

    if (directEmail.indexOf('@') !== -1) {
      emails[directEmail] = true;
    }
  });

  return emails;
}

function createAccessDeniedOutput_(access) {
  const email = access && access.email ? access.email : 'usuari no identificat';
  const message = access && access.message
    ? access.message
    : 'No tens permisos per accedir a aquesta aplicació.';

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html lang="ca">' +
        '<head>' +
          '<base target="_top">' +
          '<meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>Accés no autoritzat</title>' +
          '<style>' +
            'body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Arial,sans-serif;background:#f5f7fb;color:#17202a;}' +
            'main{width:min(520px,calc(100vw - 32px));border:1px solid #d8dee9;background:#fff;padding:28px;box-shadow:0 18px 45px rgba(20,31,47,.12);}' +
            'h1{margin:0 0 12px;font-size:24px;}' +
            'p{margin:8px 0;line-height:1.5;}' +
            '.email{font-family:monospace;color:#465466;}' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<main>' +
            '<h1>Accés no autoritzat</h1>' +
            '<p>' + escapeHtml_(message) + '</p>' +
            '<p class="email">' + escapeHtml_(email) + '</p>' +
          '</main>' +
        '</body>' +
      '</html>'
    )
    .setTitle('Accés no autoritzat')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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

function openFaltareSheet_(tableRegistry, sheetName) {
  const spreadsheetId = tableRegistry[TABLE_NAMES.ABSENCE_FORM];

  if (!spreadsheetId) {
    throw new Error('Table "' + TABLE_NAMES.ABSENCE_FORM + '" was not found in the table registry.');
  }

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('No s\'ha trobat el full "' + sheetName + '" a Faltaré.');
  }

  return sheet;
}

function openTableSpreadsheet_(tableRegistry, tableName) {
  const spreadsheetId = tableRegistry[tableName];

  if (!spreadsheetId) {
    throw new Error('Table "' + tableName + '" was not found in the table registry.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function getWorkloadSpreadsheet_() {
  return openTableSpreadsheet_(loadTableRegistry_(), TABLE_NAMES.TEACHING_LOAD);
}

function getWorkloadProfessorsSheet_() {
  const sheet = getWorkloadSpreadsheet_().getSheetByName(WORKLOAD_PROFESSORS_SHEET_NAME);

  if (!sheet) {
    throw new Error('No s\'ha trobat el full "' + WORKLOAD_PROFESSORS_SHEET_NAME + '" a Càrrega lectiva.');
  }

  return sheet;
}

function getWorkloadCarrecsSheet_() {
  const sheet = getWorkloadSpreadsheet_().getSheetByName(WORKLOAD_CARRECS_SHEET_NAME);

  if (!sheet) {
    throw new Error('No s\'ha trobat el full "' + WORKLOAD_CARRECS_SHEET_NAME + '" a Càrrega lectiva.');
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
      rowId: String(rowObject.row_id || rowNumber),
      rowNumber: rowNumber,
      selected: false,
      absenceDate: rowObject.absence_date,
      teacherCode: teacherCode,
      teacherName: teacher.name || rowObject.absence_teacher_name || teacherCode,
      reason: rowObject.motiu,
      context: rowObject.context,
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

function getFormRecordByRowId_(sheet, rowId) {
  const cleanRowId = String(rowId || '').trim();
  const lastRow = sheet.getLastRow();

  if (!cleanRowId || lastRow < 2) {
    throw new Error('No s\'ha trobat el registre seleccionat.');
  }

  const values = readSheetDisplayValues_(sheet);
  const headerMap = buildHeaderMap_(values[0] || []);

  for (let index = 1; index < values.length; index += 1) {
    const rowObject = rowToObjectByHeader_(values[index], headerMap);

    if (String(rowObject.row_id || '').trim() === cleanRowId) {
      return {
        rowId: cleanRowId,
        physicalRowNumber: index + 1,
        rowObject: rowObject,
      };
    }
  }

  throw new Error('No s\'ha trobat el registre seleccionat.');
}

function buildAdminRecordResponse_(formData, recoverySheet) {
  return {
    rowId: String(formData.row_id || '').trim(),
    formData: formData,
    recoveryRows: readRecoveryRows_(recoverySheet, formData.row_id),
  };
}

function readRecoveryRows_(sheet, rowId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getDisplayValues();
  const headerMap = buildColumnHeaderMap_(values[0]);

  return values.slice(1).map(function(row) {
    return columnsToObject_(row, headerMap, RECOVERY_COLUMNS);
  }).filter(function(row) {
    return String(row.row_id || '').trim() === String(rowId || '').trim();
  }).sort(function(a, b) {
    return Number(a.item_index || 0) - Number(b.item_index || 0);
  });
}

function replaceAdminRecoveryRows_(sheet, rowId, recoveryRows) {
  deleteRowsByParentId_(sheet, rowId);

  if (!recoveryRows.length) {
    return;
  }

  const now = new Date();
  const values = recoveryRows.map(function(row, index) {
    return [
      rowId,
      rowId + '-' + (index + 1),
      index + 1,
      String(row.date || '').trim(),
      normalizeRecoveryTime_(row.time),
      now,
      now,
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, RECOVERY_COLUMNS.length).setValues(values);
}

function validateRecoveryRows_(rows) {
  rows.forEach(function(row, index) {
    const date = String(row.date || '').trim();
    const time = normalizeRecoveryTime_(row.time);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('La data de recuperació ' + (index + 1) + ' no és vàlida.');
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error('L\'hora de recuperació ' + (index + 1) + ' no és vàlida.');
    }
  });
}

function deleteRowsByParentId_(sheet, rowId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (String(values[index][0] || '').trim() === String(rowId || '').trim()) {
      sheet.deleteRow(index + 2);
    }
  }
}

function normalizeAdminFormValue_(column, value) {
  if (column === 'confirmation_ok' || column === 'managed') {
    return parseBoolean_(value);
  }

  return value === null || value === undefined ? '' : String(value).trim();
}

function getReasonRoute_(reason) {
  const match = REASONS.filter(function(item) {
    return item.value === reason;
  })[0];

  if (!match) {
    throw new Error('El motiu seleccionat no és vàlid.');
  }

  return match.route;
}

function normalizeRecoveryTime_(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return raw;
  }

  return String(Number(match[1])).padStart(2, '0') + ':' + match[2];
}

function buildColumnHeaderMap_(headers) {
  return headers.reduce(function(map, header, index) {
    const key = normalizeHeader_(header);

    if (key) {
      map[key] = index;
    }

    return map;
  }, {});
}

function columnsToObject_(row, headerMap, columns) {
  return columns.reduce(function(object, column) {
    const index = headerMap[normalizeHeader_(column)];
    object[column] = index === undefined ? '' : String(row[index] || '').trim();
    return object;
  }, {});
}

function readSheetDisplayValues_(sheet, columnCount) {
  const lastRow = sheet.getLastRow();

  if (!lastRow) {
    return [];
  }

  return sheet.getRange(1, 1, lastRow, columnCount || sheet.getLastColumn()).getDisplayValues();
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
      email: String(row[11] || '').trim(),
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

function toDisplayString_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeText_(value) {
  return toDisplayString_(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ca');
}

function normalizeEmail_(value) {
  return toDisplayString_(value).toLocaleLowerCase('ca');
}

function splitCommaList_(value) {
  return toDisplayString_(value)
    .split(',')
    .map(function(item) {
      return toDisplayString_(item);
    })
    .filter(Boolean);
}

function escapeHtml_(value) {
  return toDisplayString_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
