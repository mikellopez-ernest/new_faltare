const SCRIPT_PROP_DB = 'db';
const TABLES_SHEET_NAME = 'tables';

const TABLE_NAMES = {
  PROFESSORS_DATA: 'Dades de professors',
  SCHEDULES: 'Horaris',
  TEACHING_LOAD: 'Càrrega lectiva',
  ABSENCE_FORM: 'Faltaré',
};

const TABLE_SHEETS = {
  [TABLE_NAMES.PROFESSORS_DATA]: 'Llista',
  [TABLE_NAMES.SCHEDULES]: 'GPU001',
  [TABLE_NAMES.TEACHING_LOAD]: 'assignatures',
};

const FALTARE_SHEETS = {
  FORM_DATA: 'form_data',
  ABSENCES: 'absences',
  RECOVERY: 'recovery',
  PROFES_GUARDIA: 'profes_guardia',
};

const PROFES_GUARDIA_HEADERS = [
  'assignment_id',
  'assignment_date',
  'weekday',
  'time',
  'absence_id',
  'assignment_type',
  'row_id',
  'teacher_code',
  'created_at',
  'updated_at',
];

const NO_COVER_CODE = '__NO_CAL_COBRIR__';
const NO_COVER_LABEL = 'No cal cobrir';

const SCHEDULE_SLOT_TIMES = {
  '1': '08:00',
  '2': '09:00',
  '3': '10:00',
  '4': '11:30',
  '5': '12:30',
  '6': '13:30',
  '7': '15:00',
  '8': '16:00',
  '9': '17:00',
  '10': '18:30',
  '11': '19:30',
  '12': '20:30',
};

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:30',
  '12:30',
  '13:30',
  '15:00',
  '16:00',
  '17:00',
  '18:30',
  '19:30',
  '20:30',
];

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Control panel')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getControlPanelBootstrapData() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  return {
    user: getCurrentUser_(),
    today: today,
    sources: getConfiguredDataSources_(),
    day: getControlPanelDayData({ date: today }),
  };
}

function getControlPanelDayData(payload) {
  const selectedDate = normalizeDate_(payload && payload.date);

  if (!selectedDate) {
    throw new Error('Cal seleccionar una data.');
  }

  const tableRegistry = loadTableRegistry_();
  const formDataValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.FORM_DATA));
  const absenceValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.ABSENCES));
  const recoveryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.RECOVERY));
  const professorValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.PROFESSORS_DATA));
  const scheduleValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.SCHEDULES));
  const subjectValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.TEACHING_LOAD));

  const teachersByCode = buildTeachersByCode_(professorValues);
  const formDataByRowId = buildFormDataByRowId_(formDataValues);
  const absenceData = buildAbsencesByTime_(absenceValues, formDataByRowId, teachersByCode, selectedDate);
  const absencesByTime = addTimetableFallbackAbsences_(
    absenceData.byTime,
    absenceData.rowIdsWithChildren,
    formDataValues,
    scheduleValues,
    subjectValues,
    teachersByCode,
    selectedDate
  );
  const recoveryByTime = buildRecoveryByTime_(recoveryValues, formDataByRowId, teachersByCode, selectedDate);

  return {
    date: selectedDate,
    slots: TIME_SLOTS.map(function(time) {
      return {
        time: time,
        absences: absencesByTime[time] || [],
        recoveryTeachers: recoveryByTime[time] || [],
      };
    }),
  };
}

function getManagementSlotData(payload) {
  const selectedDate = normalizeDate_(payload && payload.date);
  const selectedTime = normalizeTime_(payload && payload.time);

  if (!selectedDate || !selectedTime) {
    throw new Error('Cal seleccionar una data i una franja horària.');
  }

  const tableRegistry = loadTableRegistry_();
  const formDataValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.FORM_DATA));
  const absenceValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.ABSENCES));
  const recoveryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.RECOVERY));
  const professorValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.PROFESSORS_DATA));
  const scheduleValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.SCHEDULES));
  const subjectValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.TEACHING_LOAD));
  const guardHistoryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.PROFES_GUARDIA));

  const teachersByCode = buildTeachersByCode_(professorValues);
  const formDataByRowId = buildFormDataByRowId_(formDataValues);
  const absenceData = buildAbsencesByTime_(absenceValues, formDataByRowId, teachersByCode, selectedDate);
  const absencesByTime = addTimetableFallbackAbsences_(
    absenceData.byTime,
    absenceData.rowIdsWithChildren,
    formDataValues,
    scheduleValues,
    subjectValues,
    teachersByCode,
    selectedDate
  );
  const absenceRows = (absencesByTime[selectedTime] || []).map(function(row) {
    return {
      id: row.absenceItemId || String(row.rowId || '') + ':' + selectedTime,
      type: 'absence',
      rowId: row.rowId,
      absentTeacher: row.teacherName,
      absentTeacherCode: row.teacherCode,
      subject: row.subject,
      group: row.group,
      classroom: row.classroom,
      studentWork: row.studentWork || '',
      noCoverRequired: Boolean(row.noCoverRequired),
      mergedText: '',
      guardTeacherCode: '',
      guardTeacherName: '',
      priority: getPopupRowPriority_(row.group, 'absence'),
    };
  });
  const rows = orderManagementRows_(absenceRows, selectedDate, selectedTime);
  const candidates = buildGuardTeacherCandidates_(
    scheduleValues,
    subjectValues,
    teachersByCode,
    guardHistoryValues,
    selectedDate,
    selectedTime,
    rows,
    recoveryValues,
    formDataByRowId
  );

  let candidateIndex = 0;

  rows.forEach(function(row) {
    if (row.noCoverRequired) {
      row.guardTeacherCode = NO_COVER_CODE;
      row.guardTeacherName = NO_COVER_LABEL;
      return;
    }

    const candidate = candidates[candidateIndex];
    candidateIndex += 1;

    if (candidate) {
      row.guardTeacherCode = candidate.code;
      row.guardTeacherName = candidate.name;
    }
  });
  applySavedGuardAssignments_(rows, guardHistoryValues, teachersByCode, selectedDate, selectedTime);

  return {
    date: selectedDate,
    time: selectedTime,
    rows: rows,
    candidates: candidates,
    notEnoughTeachers: candidates.length < rows.filter(function(row) {
      return row.guardTeacherCode !== NO_COVER_CODE;
    }).length,
  };
}

function saveManagementSlotData(payload) {
  const selectedDate = normalizeDate_(payload && payload.date);
  const selectedTime = normalizeTime_(payload && payload.time);
  const rows = Array.isArray(payload && payload.rows) ? payload.rows : [];

  if (!selectedDate || !selectedTime) {
    throw new Error('Cal seleccionar una data i una franja horària.');
  }

  validateGuardAssignments_(rows);

  const tableRegistry = loadTableRegistry_();
  const sheet = openFaltareSheet_(tableRegistry, FALTARE_SHEETS.PROFES_GUARDIA);
  ensureSheetHeaders_(sheet, PROFES_GUARDIA_HEADERS);
  deleteGuardAssignmentsForSlot_(sheet, selectedDate, selectedTime);

  const now = new Date();
  const weekday = getIsoWeekday_(selectedDate);
  const values = rows.filter(function(row) {
    return String(row.guardTeacherCode || '').trim();
  }).map(function(row) {
    const assignmentId = [
      selectedDate,
      selectedTime.replace(':', ''),
      row.id || row.absenceItemId || row.type,
      row.guardTeacherCode,
    ].join(':');

    return [
      assignmentId,
      selectedDate,
      weekday,
      selectedTime,
      row.id || '',
      row.type || 'absence',
      row.rowId || '',
      row.guardTeacherCode || '',
      now,
      now,
    ];
  });

  if (values.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, PROFES_GUARDIA_HEADERS.length).setValues(values);
  }

  return {
    ok: true,
    saved: values.length,
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

function openTableSpreadsheet_(tableRegistry, tableName) {
  const spreadsheetId = tableRegistry[tableName];

  if (!spreadsheetId) {
    throw new Error('Table "' + tableName + '" was not found in the table registry.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function openConfiguredTableSheet_(tableRegistry, tableName) {
  const sheetName = TABLE_SHEETS[tableName];

  if (!sheetName) {
    throw new Error('No sheet name has been configured for table "' + tableName + '".');
  }

  return openTableSheetByName_(tableRegistry, tableName, sheetName);
}

function openFaltareSheet_(tableRegistry, sheetName) {
  return openTableSheetByName_(tableRegistry, TABLE_NAMES.ABSENCE_FORM, sheetName);
}

function openTableSheetByName_(tableRegistry, tableName, sheetName) {
  const spreadsheet = openTableSpreadsheet_(tableRegistry, tableName);
  const spreadsheetId = tableRegistry[tableName];
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      'Table "' + tableName + '" points to spreadsheet ID "' + spreadsheetId +
      '", but sheet "' + sheetName + '" was not found.'
    );
  }

  return sheet;
}

function readSheetValues_(sheet) {
  const range = sheet.getDataRange();

  return {
    displayValues: range.getDisplayValues(),
    values: range.getValues(),
  };
}

function buildFormDataByRowId_(sheetData) {
  const rows = rowsToObjects_(sheetData);
  const byRowId = {};

  rows.forEach(function(row) {
    const rowId = normalizeKey_(row.row_id);

    if (rowId) {
      byRowId[rowId] = row;
    }
  });

  return byRowId;
}

function buildAbsencesByTime_(sheetData, formDataByRowId, teachersByCode, selectedDate) {
  const rows = rowsToObjects_(sheetData);
  const byTime = {};
  const rowIdsWithChildren = {};

  rows.forEach(function(row) {
    const parent = formDataByRowId[normalizeKey_(row.row_id)];

    if (!parent || normalizeDate_(parent.absence_date) !== selectedDate) {
      return;
    }

    const time = normalizeTime_(row.time);

    if (!time || TIME_SLOTS.indexOf(time) === -1) {
      return;
    }

    const teacherCode = String(parent.teacher_code || '').trim();
    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    rowIdsWithChildren[normalizeKey_(row.row_id)] = true;

    if (!byTime[time]) {
      byTime[time] = [];
    }

    byTime[time].push({
      rowId: row.row_id,
      absenceItemId: row.absence_item_id,
      time: time,
      teacherCode: teacherCode,
      teacherName: teacher.name || parent.absence_teacher_name || teacherCode,
      subject: row.subject_name || row.subject_code || '',
      group: row.groups || '',
      classroom: row.classrooms || '',
      studentWork: row.student_work || '',
      noCoverRequired: parseBoolean_(row.no_cover_required),
      source: 'absences',
    });
  });

  TIME_SLOTS.forEach(function(time) {
    if (byTime[time]) {
      byTime[time].sort(sortAbsenceRows_);
    }
  });

  return {
    byTime: byTime,
    rowIdsWithChildren: rowIdsWithChildren,
  };
}

function addTimetableFallbackAbsences_(byTime, rowIdsWithChildren, formDataValues, scheduleValues, subjectValues, teachersByCode, selectedDate) {
  const formRows = rowsToObjects_(formDataValues);
  const schedules = buildScheduleRows_(scheduleValues);
  const subjects = buildSubjectMap_(subjectValues);
  const dayNumber = getIsoWeekday_(selectedDate);

  if (!dayNumber || dayNumber > 5) {
    return byTime;
  }

  formRows.forEach(function(parent) {
    const rowId = normalizeKey_(parent.row_id);

    if (!rowId || rowIdsWithChildren[rowId] || normalizeDate_(parent.absence_date) !== selectedDate) {
      return;
    }

    const teacherCode = String(parent.teacher_code || '').trim();
    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    const teacherSchedule = schedules.filter(function(row) {
      return normalizeKey_(row.teacherCode) === normalizeKey_(teacherCode) && Number(row.day) === dayNumber;
    }).map(function(row) {
      return {
        rowId: row.rowId,
        group: row.group,
        teacherCode: row.teacherCode,
        subjectCode: row.subjectCode,
        subjectName: subjects[normalizeKey_(row.subjectCode)] || row.subjectCode,
        classroom: row.classroom,
        day: row.day,
        slot: row.slot,
        time: SCHEDULE_SLOT_TIMES[String(row.slot)] || normalizeTime_(row.slot),
      };
    });

    groupScheduleItems_(teacherSchedule).forEach(function(item, index) {
      const time = normalizeTime_(item.time);

      if (!time || TIME_SLOTS.indexOf(time) === -1) {
        return;
      }

      if (!byTime[time]) {
        byTime[time] = [];
      }

      byTime[time].push({
        rowId: parent.row_id,
        absenceItemId: String(parent.row_id || '') + '-fallback-' + (index + 1),
        time: time,
        teacherCode: teacherCode,
        teacherName: teacher.name || parent.absence_teacher_name || teacherCode,
        subject: item.subjectName || item.subjectCode || '',
        group: item.groupsText || '',
        classroom: item.classrooms.join(', '),
        studentWork: '',
        noCoverRequired: false,
        source: 'timetable-fallback',
      });
    });
  });

  TIME_SLOTS.forEach(function(time) {
    if (byTime[time]) {
      byTime[time].sort(sortAbsenceRows_);
    }
  });

  return byTime;
}

function buildRecoveryByTime_(sheetData, formDataByRowId, teachersByCode, selectedDate) {
  const rows = rowsToObjects_(sheetData);
  const byTime = {};

  rows.forEach(function(row) {
    if (normalizeDate_(row.date) !== selectedDate) {
      return;
    }

    const time = normalizeTime_(row.time);

    if (!time || TIME_SLOTS.indexOf(time) === -1) {
      return;
    }

    const parent = formDataByRowId[normalizeKey_(row.row_id)];

    if (!parent) {
      return;
    }

    const teacherCode = String(parent.teacher_code || '').trim();
    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    const teacherName = teacher.name || parent.absence_teacher_name || teacherCode;

    if (!byTime[time]) {
      byTime[time] = [];
    }

    if (teacherName && byTime[time].indexOf(teacherName) === -1) {
      byTime[time].push(teacherName);
    }
  });

  TIME_SLOTS.forEach(function(time) {
    if (byTime[time]) {
      byTime[time].sort(function(a, b) {
        return String(a).localeCompare(String(b), 'ca');
      });
    }
  });

  return byTime;
}

function buildTeachersByCode_(sheetData) {
  const rows = sheetData.values || [];
  const teachers = {};

  rows.slice(1).forEach(function(row) {
    const nameParts = [
      row[2],
      row[3],
      row[4],
    ].map(function(value) {
      return String(value || '').trim();
    }).filter(Boolean);
    const teacherCode = String(row[5] || '').trim();

    if (teacherCode) {
      teachers[normalizeKey_(teacherCode)] = {
        code: teacherCode,
        name: nameParts.join(' '),
        surname1: String(row[3] || '').trim(),
      };
    }
  });

  return teachers;
}

function orderManagementRows_(absenceRows, selectedDate, selectedTime) {
  const rows = absenceRows.slice();

  rows.push({
    id: 'corridor-lower:' + selectedDate + ':' + selectedTime,
    type: 'corridor_lower',
    rowId: '',
    absentTeacher: '',
    absentTeacherCode: '',
    subject: '',
    group: '',
    classroom: '',
    studentWork: '',
    mergedText: 'Passadissos pis inferior i lavabos',
    guardTeacherCode: '',
    guardTeacherName: '',
    noCoverRequired: false,
    priority: 2,
  });
  rows.push({
    id: 'corridor-upper:' + selectedDate + ':' + selectedTime,
    type: 'corridor_upper',
    rowId: '',
    absentTeacher: '',
    absentTeacherCode: '',
    subject: '',
    group: '',
    classroom: '',
    studentWork: '',
    mergedText: 'Passadissos pis superior i lavabos',
    guardTeacherCode: '',
    guardTeacherName: '',
    noCoverRequired: false,
    priority: 4,
  });

  return rows.sort(function(a, b) {
    return Number(a.priority) - Number(b.priority) ||
      String(a.group || '').localeCompare(String(b.group || ''), 'ca') ||
      String(a.subject || a.mergedText || '').localeCompare(String(b.subject || b.mergedText || ''), 'ca');
  });
}

function getPopupRowPriority_(groupText, type) {
  if (type === 'corridor_lower') {
    return 2;
  }

  if (type === 'corridor_upper') {
    return 4;
  }

  const groups = String(groupText || '').split(',').map(function(group) {
    return group.trim();
  }).filter(Boolean);

  if (groups.some(function(group) { return /^[1-4]/.test(group); })) {
    return 1;
  }

  return 3;
}

function buildGuardTeacherCandidates_(scheduleValues, subjectValues, teachersByCode, guardHistoryValues, selectedDate, selectedTime, managementRows, recoveryValues, formDataByRowId) {
  const dayNumber = getIsoWeekday_(selectedDate);
  const subjects = buildSubjectMap_(subjectValues);
  const absentTeacherCodes = {};
  const candidatesByCode = {};

  managementRows.forEach(function(row) {
    if (row.absentTeacherCode) {
      absentTeacherCodes[normalizeKey_(row.absentTeacherCode)] = true;
    }
  });

  buildRecoveryTeacherCandidates_(recoveryValues, formDataByRowId, teachersByCode, selectedDate, selectedTime, absentTeacherCodes)
    .forEach(function(candidate) {
      candidatesByCode[normalizeKey_(candidate.code)] = candidate;
    });

  buildScheduleRows_(scheduleValues).forEach(function(row) {
    const time = SCHEDULE_SLOT_TIMES[String(row.slot)] || normalizeTime_(row.slot);
    const subjectCode = normalizeKey_(row.subjectCode);
    const subjectName = normalizeKey_(subjects[subjectCode] || row.subjectCode);
    const teacherCodeKey = normalizeKey_(row.teacherCode);

    if (
      Number(row.day) !== dayNumber ||
      normalizeTime_(time) !== selectedTime ||
      (subjectCode !== 'GUARDIA' && subjectName !== 'GUARDIA') ||
      absentTeacherCodes[teacherCodeKey]
    ) {
      return;
    }

    const teacher = teachersByCode[teacherCodeKey];

    if (teacher && !candidatesByCode[teacherCodeKey]) {
      candidatesByCode[teacherCodeKey] = {
        code: teacher.code,
        name: teacher.name,
        surname1: teacher.surname1 || '',
        preferredRecovery: false,
      };
    }
  });

  const history = buildGuardHistoryStats_(guardHistoryValues, dayNumber, selectedTime);

  return Object.keys(candidatesByCode).map(function(codeKey) {
    const candidate = candidatesByCode[codeKey];
    const stats = history[codeKey] || { count: 0, lastSortValue: 0 };

    return {
      code: candidate.code,
      name: candidate.name,
      count: stats.count,
      lastSortValue: stats.lastSortValue,
      surnameInitial: normalizeKey_(candidate.surname1).charAt(0),
      preferredRecovery: Boolean(candidate.preferredRecovery),
    };
  }).sort(function(a, b) {
    return Number(b.preferredRecovery) - Number(a.preferredRecovery) ||
      Number(a.count) - Number(b.count) ||
      Number(a.lastSortValue) - Number(b.lastSortValue) ||
      String(a.surnameInitial || '').localeCompare(String(b.surnameInitial || ''), 'ca') ||
      String(a.name || '').localeCompare(String(b.name || ''), 'ca');
  });
}

function buildRecoveryTeacherCandidates_(sheetData, formDataByRowId, teachersByCode, selectedDate, selectedTime, absentTeacherCodes) {
  const candidatesByCode = {};

  rowsToObjects_(sheetData).forEach(function(row) {
    if (normalizeDate_(row.date) !== selectedDate || normalizeTime_(row.time) !== selectedTime) {
      return;
    }

    const parent = formDataByRowId[normalizeKey_(row.row_id)];

    if (!parent) {
      return;
    }

    const teacherCode = String(parent.teacher_code || '').trim();
    const teacherCodeKey = normalizeKey_(teacherCode);

    if (!teacherCodeKey || absentTeacherCodes[teacherCodeKey]) {
      return;
    }

    const teacher = teachersByCode[teacherCodeKey];

    if (teacher && !candidatesByCode[teacherCodeKey]) {
      candidatesByCode[teacherCodeKey] = {
        code: teacher.code,
        name: teacher.name,
        surname1: teacher.surname1 || '',
        preferredRecovery: true,
      };
    }
  });

  return Object.keys(candidatesByCode).map(function(codeKey) {
    return candidatesByCode[codeKey];
  });
}

function buildGuardHistoryStats_(guardHistoryValues, dayNumber, selectedTime) {
  const statsByTeacher = {};

  rowsToObjects_(guardHistoryValues).forEach(function(row) {
    if (Number(row.weekday) !== dayNumber || normalizeTime_(row.time) !== selectedTime) {
      return;
    }

    const teacherCodeKey = normalizeKey_(row.teacher_code);

    if (!teacherCodeKey || teacherCodeKey === normalizeKey_(NO_COVER_CODE)) {
      return;
    }

    if (!statsByTeacher[teacherCodeKey]) {
      statsByTeacher[teacherCodeKey] = {
        count: 0,
        lastSortValue: 0,
      };
    }

    statsByTeacher[teacherCodeKey].count += 1;
    statsByTeacher[teacherCodeKey].lastSortValue = Math.max(
      statsByTeacher[teacherCodeKey].lastSortValue,
      getHistorySortValue_(row.assignment_date, row.updated_at)
    );
  });

  return statsByTeacher;
}

function applySavedGuardAssignments_(rows, guardHistoryValues, teachersByCode, selectedDate, selectedTime) {
  const savedByAbsenceId = {};

  rowsToObjects_(guardHistoryValues).forEach(function(row) {
    if (normalizeDate_(row.assignment_date) !== selectedDate || normalizeTime_(row.time) !== selectedTime) {
      return;
    }

    const absenceId = String(row.absence_id || '').trim();
    const teacherCode = String(row.teacher_code || '').trim();

    if (absenceId && teacherCode) {
      savedByAbsenceId[absenceId] = teacherCode;
    }
  });

  rows.forEach(function(row) {
    const teacherCode = savedByAbsenceId[row.id];

    if (!teacherCode) {
      return;
    }

    if (teacherCode === NO_COVER_CODE) {
      row.guardTeacherCode = NO_COVER_CODE;
      row.guardTeacherName = NO_COVER_LABEL;
      return;
    }

    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    row.guardTeacherCode = teacherCode;
    row.guardTeacherName = teacher.name || teacherCode;
  });
}

function validateGuardAssignments_(rows) {
  const used = {};

  rows.forEach(function(row) {
    const teacherCode = normalizeKey_(row.guardTeacherCode);

    if (!teacherCode || teacherCode === normalizeKey_(NO_COVER_CODE)) {
      return;
    }

    if (used[teacherCode]) {
      throw new Error('Un mateix professor no pot estar assignat a dues guàrdies.');
    }

    used[teacherCode] = true;
  });
}

function parseBoolean_(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function ensureSheetHeaders_(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return;
  }

  const width = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  const headerRange = sheet.getRange(1, 1, 1, width);
  const headers = headerRange.getDisplayValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  if (headers.filter(Boolean).length === 0 || expectedHeaders.some(function(header, index) {
    return headers[index] !== header;
  })) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  }
}

function deleteGuardAssignmentsForSlot_(sheet, selectedDate, selectedTime) {
  const values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) {
    return;
  }

  const headerMap = {};
  values[0].forEach(function(header, index) {
    headerMap[String(header || '').trim()] = index;
  });
  const dateIndex = headerMap.assignment_date;
  const timeIndex = headerMap.time;

  if (dateIndex === undefined || timeIndex === undefined) {
    return;
  }

  for (let index = values.length - 1; index >= 1; index -= 1) {
    if (
      normalizeDate_(values[index][dateIndex]) === selectedDate &&
      normalizeTime_(values[index][timeIndex]) === selectedTime
    ) {
      sheet.deleteRow(index + 1);
    }
  }
}

function getHistorySortValue_(assignmentDate, updatedAt) {
  const dateText = normalizeDate_(assignmentDate);

  if (dateText) {
    return Number(dateText.replace(/-/g, '')) || 0;
  }

  const updatedText = String(updatedAt || '').trim();
  const match = updatedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (match) {
    return Number([match[3], pad2_(match[2]), pad2_(match[1])].join('')) || 0;
  }

  return 0;
}

function buildScheduleRows_(sheetData) {
  const rows = sheetData.displayValues || sheetData.values || [];

  return rows.slice(1).map(function(row) {
    return {
      rowId: row[0],
      group: row[1],
      teacherCode: row[2],
      subjectCode: row[3],
      classroom: row[4],
      day: row[5],
      slot: row[6],
    };
  });
}

function buildSubjectMap_(sheetData) {
  const rows = sheetData.displayValues || sheetData.values || [];
  const subjects = {};

  rows.slice(1).forEach(function(row) {
    const code = normalizeKey_(row[0]);
    const name = String(row[2] || '').trim();

    if (code && name) {
      subjects[code] = name;
    }
  });

  return subjects;
}

function groupScheduleItems_(items) {
  const groupedByKey = {};
  const groupedItems = [];

  items.forEach(function(item) {
    const key = [String(item.slot), normalizeKey_(item.subjectCode)].join('|');

    if (!groupedByKey[key]) {
      groupedByKey[key] = {
        rowIds: [],
        groups: [],
        classrooms: [],
        teacherCode: item.teacherCode,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        day: item.day,
        slot: item.slot,
        time: item.time,
      };
      groupedItems.push(groupedByKey[key]);
    }

    groupedByKey[key].rowIds.push(item.rowId);
    pushUnique_(groupedByKey[key].groups, item.group);
    pushUnique_(groupedByKey[key].classrooms, item.classroom);
  });

  return groupedItems.map(function(item) {
    return {
      rowIds: item.rowIds,
      groups: item.groups,
      groupsText: item.groups.join(', '),
      classrooms: item.classrooms,
      teacherCode: item.teacherCode,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      day: item.day,
      slot: item.slot,
      time: item.time,
    };
  });
}

function rowsToObjects_(sheetData) {
  const values = sheetData.displayValues || sheetData.values || [];

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header || '').trim();
  });

  return values.slice(1).map(function(row) {
    const object = {};

    headers.forEach(function(header, index) {
      if (header) {
        object[header] = row[index];
      }
    });

    return object;
  });
}

function sortAbsenceRows_(a, b) {
  return String(a.teacherName || '').localeCompare(String(b.teacherName || ''), 'ca') ||
    String(a.subject || '').localeCompare(String(b.subject || ''), 'ca') ||
    String(a.group || '').localeCompare(String(b.group || ''), 'ca');
}

function getConfiguredDataSources_() {
  return {
    registryProperty: SCRIPT_PROP_DB,
    registrySheet: TABLES_SHEET_NAME,
    tables: {
      professorsData: {
        logicalName: TABLE_NAMES.PROFESSORS_DATA,
        sheets: [TABLE_SHEETS[TABLE_NAMES.PROFESSORS_DATA]],
      },
      schedules: {
        logicalName: TABLE_NAMES.SCHEDULES,
        sheets: [TABLE_SHEETS[TABLE_NAMES.SCHEDULES]],
      },
      teachingLoad: {
        logicalName: TABLE_NAMES.TEACHING_LOAD,
        sheets: [TABLE_SHEETS[TABLE_NAMES.TEACHING_LOAD]],
      },
      absenceForm: {
        logicalName: TABLE_NAMES.ABSENCE_FORM,
        sheets: [
          FALTARE_SHEETS.FORM_DATA,
          FALTARE_SHEETS.ABSENCES,
          FALTARE_SHEETS.RECOVERY,
          FALTARE_SHEETS.PROFES_GUARDIA,
        ],
      },
    },
  };
}

function normalizeDate_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    return [
      isoMatch[1],
      pad2_(isoMatch[2]),
      pad2_(isoMatch[3]),
    ].join('-');
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    return [
      slashMatch[3],
      pad2_(slashMatch[2]),
      pad2_(slashMatch[1]),
    ].join('-');
  }

  return text;
}

function normalizeTime_(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return text;
  }

  return pad2_(match[1]) + ':' + match[2];
}

function getIsoWeekday_(isoDate) {
  const parts = String(isoDate || '').split('-').map(Number);

  if (parts.length !== 3 || parts.some(function(part) { return !Number.isFinite(part); })) {
    return 0;
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay();

  return day === 0 ? 7 : day;
}

function normalizeKey_(value) {
  return String(value || '').trim().toUpperCase();
}

function pushUnique_(list, value) {
  const text = String(value || '').trim();

  if (text && list.indexOf(text) === -1) {
    list.push(text);
  }
}

function pad2_(value) {
  return String(value || '').padStart(2, '0');
}

function getCurrentUser_() {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '';

  return {
    email: String(email || '').trim(),
  };
}
