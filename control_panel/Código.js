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

const SCHEDULE_CACHE_SHEET_NAME = 'schedule_cache';
const SCHEDULE_CACHE_HEADERS = [
  'row_id',
  'group',
  'source_teacher_code',
  'source_teacher_name',
  'source_teacher_original_code',
  'effective_teacher_code',
  'effective_teacher_name',
  'teacher_was_substituted',
  'subject_code',
  'subject_full_name',
  'classroom',
  'day',
  'slot',
];

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
  'source_teacher_code',
  'source_teacher_name',
  'effective_teacher_code',
  'effective_teacher_name',
  'teacher_was_substituted',
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
    .setTitle('Panell de guàrdies')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function notify_recovery() {
  const timezone = Session.getScriptTimeZone() || 'Europe/Madrid';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = Utilities.formatDate(tomorrow, timezone, 'yyyy-MM-dd');
  return notifyRecoveryForDate_(targetDate);
}

function notifyRecoveryForDate_(targetDate) {
  const selectedDate = normalizeDate_(targetDate);

  if (!selectedDate) {
    throw new Error('Cal indicar una data vàlida per notificar recuperacions.');
  }

  const tableRegistry = loadTableRegistry_();
  const formDataValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.FORM_DATA));
  const recoveryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.RECOVERY));
  const formDataByRowId = buildFormDataByRowId_(formDataValues);
  const notificationsByEmail = {};

  rowsToObjects_(recoveryValues).forEach(function(row) {
    if (normalizeDate_(row.date) !== selectedDate) {
      return;
    }

    const parent = formDataByRowId[normalizeKey_(row.row_id)];

    if (!parent) {
      return;
    }

    const email = String(parent.absence_teacher_email || '').trim();

    if (!email) {
      return;
    }

    if (!notificationsByEmail[email]) {
      notificationsByEmail[email] = {
        email: email,
        teacherName: parent.absence_teacher_name || '',
        items: [],
      };
    }

    notificationsByEmail[email].items.push({
      date: selectedDate,
      time: normalizeTime_(row.time) || String(row.time || '').trim(),
      context: parent.context || '',
    });
  });

  const emails = Object.keys(notificationsByEmail);

  emails.forEach(function(email) {
    const notification = notificationsByEmail[email];
    notification.items.sort(function(a, b) {
      return String(a.time || '').localeCompare(String(b.time || ''), 'ca');
    });
    MailApp.sendEmail({
      to: email,
      subject: 'Recordatori de recuperació de classe',
      body: buildRecoveryNotificationBody_(notification),
    });
  });

  return {
    ok: true,
    date: selectedDate,
    notifiedTeachers: emails.length,
    recoveryItems: emails.reduce(function(total, email) {
      return total + notificationsByEmail[email].items.length;
    }, 0),
  };
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
  const guardHistoryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.PROFES_GUARDIA));
  const professorValues = readSheetValues_(openConfiguredTableSheet_(tableRegistry, TABLE_NAMES.PROFESSORS_DATA));
  const scheduleCacheValues = readSheetValues_(openTableSheetByName_(tableRegistry, TABLE_NAMES.SCHEDULES, SCHEDULE_CACHE_SHEET_NAME));

  const teachersByCode = buildTeachersByCode_(professorValues);
  const formDataByRowId = buildFormDataByRowId_(formDataValues);
  const absenceData = buildAbsencesByTime_(absenceValues, formDataByRowId, teachersByCode, selectedDate);
  const absencesByTime = addTimetableFallbackAbsences_(
    absenceData.byTime,
    absenceData.rowIdsWithChildren,
    formDataValues,
    scheduleCacheValues,
    teachersByCode,
    selectedDate
  );
  const recoveryByTime = buildRecoveryByTime_(recoveryValues, formDataByRowId, teachersByCode, selectedDate);
  const savedAssignmentsByTime = buildSavedAssignmentsByTime_(guardHistoryValues, selectedDate);

  return {
    date: selectedDate,
    slots: TIME_SLOTS.map(function(time) {
      return {
        time: time,
        absences: absencesByTime[time] || [],
        recoveryTeachers: recoveryByTime[time] || [],
        assignmentsSaved: Boolean(savedAssignmentsByTime[time]),
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
  const scheduleCacheValues = readSheetValues_(openTableSheetByName_(tableRegistry, TABLE_NAMES.SCHEDULES, SCHEDULE_CACHE_SHEET_NAME));
  const guardHistoryValues = readSheetValues_(openFaltareSheet_(tableRegistry, FALTARE_SHEETS.PROFES_GUARDIA));

  const teachersByCode = buildTeachersByCode_(professorValues);
  const formDataByRowId = buildFormDataByRowId_(formDataValues);
  const absenceData = buildAbsencesByTime_(absenceValues, formDataByRowId, teachersByCode, selectedDate);
  const absencesByTime = addTimetableFallbackAbsences_(
    absenceData.byTime,
    absenceData.rowIdsWithChildren,
    formDataValues,
    scheduleCacheValues,
    teachersByCode,
    selectedDate
  );
  const slotAbsences = absencesByTime[selectedTime] || [];
  const absenceRows = filterCoverableAbsences_(slotAbsences).map(function(row) {
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
    scheduleCacheValues,
    teachersByCode,
    guardHistoryValues,
    selectedDate,
    selectedTime,
    rows,
    recoveryValues,
    formDataByRowId,
    slotAbsences
  );

  let candidateIndex = 0;

  rows.forEach(function(row) {
    if (row.noCoverRequired) {
      row.guardTeacherCode = NO_COVER_CODE;
      row.guardTeacherName = NO_COVER_LABEL;
      clearGuardIdentity_(row);
      return;
    }

    const candidate = candidates[candidateIndex];
    candidateIndex += 1;

    if (candidate) {
      applyGuardCandidateToRow_(row, candidate);
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
      row.guardSourceTeacherCode || '',
      row.guardSourceTeacherName || '',
      row.guardEffectiveTeacherCode || '',
      row.guardEffectiveTeacherName || '',
      Boolean(row.guardTeacherWasSubstituted),
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

    if (
      !parent ||
      !isAbsenceActiveOnDate_(parent, selectedDate) ||
      isMultiDayAbsence_(parent)
    ) {
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
      subjectCode: row.subject_code || '',
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

function addTimetableFallbackAbsences_(byTime, rowIdsWithChildren, formDataValues, scheduleCacheValues, teachersByCode, selectedDate) {
  const formRows = rowsToObjects_(formDataValues);
  const schedules = buildScheduleCacheRows_(scheduleCacheValues);
  const dayNumber = getIsoWeekday_(selectedDate);

  if (!dayNumber || dayNumber > 5) {
    return byTime;
  }

  formRows.forEach(function(parent) {
    const rowId = normalizeKey_(parent.row_id);

    if (!rowId || rowIdsWithChildren[rowId] || !isAbsenceActiveOnDate_(parent, selectedDate)) {
      return;
    }

    const teacherCode = String(parent.teacher_code || '').trim();
    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    const teacherSchedule = schedules.filter(function(row) {
      return normalizeKey_(row.effectiveTeacherCode) === normalizeKey_(teacherCode) && Number(row.day) === dayNumber;
    }).map(function(row) {
      return {
        rowId: row.rowId,
        group: row.group,
        teacherCode: row.effectiveTeacherCode,
        subjectCode: row.subjectCode,
        subjectName: row.subjectFullName || row.subjectCode,
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
        subjectCode: item.subjectCode || '',
        group: item.groupsText || '',
        classroom: item.classrooms.join(', '),
        studentWork: isMultiDayAbsence_(parent) ? String(parent.multi_day_student_work || '').trim() : '',
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

function buildSavedAssignmentsByTime_(sheetData, selectedDate) {
  const byTime = {};

  rowsToObjects_(sheetData).forEach(function(row) {
    if (normalizeDate_(row.assignment_date) !== selectedDate) {
      return;
    }

    const time = normalizeTime_(row.time);

    if (time && TIME_SLOTS.indexOf(time) !== -1) {
      byTime[time] = true;
    }
  });

  return byTime;
}

function filterCoverableAbsences_(rows) {
  return rows.filter(function(row) {
    return !isGuardDutyAbsence_(row);
  });
}

function isGuardDutyAbsence_(row) {
  return normalizeKey_(row.subjectCode) === 'GUARDIA' || normalizeKey_(row.subject) === 'GUARDIA';
}

function buildTeachersByCode_(sheetData) {
  const rows = sheetData.values || [];
  const teachers = {};

  rows.slice(1).forEach(function(row) {
    if (!parseBoolean_(row[13])) {
      return;
    }

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
        espCode: String(row[0] || '').trim(),
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

function buildGuardTeacherCandidates_(scheduleCacheValues, teachersByCode, guardHistoryValues, selectedDate, selectedTime, managementRows, recoveryValues, formDataByRowId, slotAbsences) {
  const dayNumber = getIsoWeekday_(selectedDate);
  const absentTeacherCodes = {};
  const candidatesByCode = {};

  managementRows.forEach(function(row) {
    if (row.absentTeacherCode) {
      absentTeacherCodes[normalizeKey_(row.absentTeacherCode)] = true;
    }
  });

  (slotAbsences || []).forEach(function(row) {
    if (row.teacherCode) {
      absentTeacherCodes[normalizeKey_(row.teacherCode)] = true;
    }
  });

  buildRecoveryTeacherCandidates_(recoveryValues, formDataByRowId, teachersByCode, selectedDate, selectedTime, absentTeacherCodes)
    .forEach(function(candidate) {
      candidatesByCode[normalizeKey_(candidate.code)] = candidate;
    });

  buildScheduleCacheRows_(scheduleCacheValues).forEach(function(row) {
    const time = SCHEDULE_SLOT_TIMES[String(row.slot)] || normalizeTime_(row.slot);
    const subjectCode = normalizeKey_(row.subjectCode);
    const subjectName = normalizeKey_(row.subjectFullName || row.subjectCode);
    const teacherCodeKey = normalizeKey_(row.effectiveTeacherCode);
    const teacher = teachersByCode[teacherCodeKey];
    const candidateCodeKey = teacher ? normalizeKey_(teacher.code) : '';

    if (
      Number(row.day) !== dayNumber ||
      normalizeTime_(time) !== selectedTime ||
      (subjectCode !== 'GUARDIA' && subjectName !== 'GUARDIA') ||
      !teacher ||
      absentTeacherCodes[teacherCodeKey] ||
      absentTeacherCodes[candidateCodeKey]
    ) {
      return;
    }

    if (teacher && !candidatesByCode[candidateCodeKey]) {
      candidatesByCode[candidateCodeKey] = {
        code: teacher.code,
        name: teacher.name,
        surname1: teacher.surname1 || '',
        preferredRecovery: false,
        sourceTeacherCode: String(row.sourceTeacherCode || row.effectiveTeacherCode || teacher.code || '').trim(),
        sourceTeacherName: String(row.sourceTeacherName || row.effectiveTeacherName || teacher.name || '').trim(),
        effectiveTeacherCode: String(row.effectiveTeacherCode || teacher.code || '').trim(),
        effectiveTeacherName: String(row.effectiveTeacherName || teacher.name || '').trim(),
        teacherWasSubstituted: parseBoolean_(row.teacherWasSubstituted),
      };
    }
  });

  const historyRows = rowsToObjects_(guardHistoryValues);

  return Object.keys(candidatesByCode).map(function(codeKey) {
    const candidate = candidatesByCode[codeKey];
    const stats = buildGuardHistoryStatsForCandidate_(historyRows, dayNumber, selectedTime, candidate);

    return {
      code: candidate.code,
      name: candidate.name,
      count: stats.count,
      lastSortValue: stats.lastSortValue,
      surnameInitial: normalizeKey_(candidate.surname1).charAt(0),
      preferredRecovery: Boolean(candidate.preferredRecovery),
      sourceTeacherCode: candidate.sourceTeacherCode || candidate.code,
      sourceTeacherName: candidate.sourceTeacherName || candidate.name,
      effectiveTeacherCode: candidate.effectiveTeacherCode || candidate.code,
      effectiveTeacherName: candidate.effectiveTeacherName || candidate.name,
      teacherWasSubstituted: Boolean(candidate.teacherWasSubstituted),
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
        sourceTeacherCode: teacher.code,
        sourceTeacherName: teacher.name,
        effectiveTeacherCode: teacher.code,
        effectiveTeacherName: teacher.name,
        teacherWasSubstituted: false,
      };
    }
  });

  return Object.keys(candidatesByCode).map(function(codeKey) {
    return candidatesByCode[codeKey];
  });
}

function buildGuardHistoryStatsForCandidate_(historyRows, dayNumber, selectedTime, candidate) {
  const candidateKeys = buildGuardCandidateHistoryKeys_(candidate);
  const stats = {
    count: 0,
    lastSortValue: 0,
  };

  historyRows.forEach(function(row) {
    if (Number(row.weekday) !== dayNumber || normalizeTime_(row.time) !== selectedTime) {
      return;
    }

    const rowKeys = [
      row.teacher_code,
      row.source_teacher_code,
      row.effective_teacher_code,
    ].map(normalizeKey_).filter(Boolean);

    if (!rowKeys.length || rowKeys.indexOf(normalizeKey_(NO_COVER_CODE)) !== -1) {
      return;
    }

    const matchesCandidate = rowKeys.some(function(rowKey) {
      return Boolean(candidateKeys[rowKey]);
    });

    if (!matchesCandidate) {
      return;
    }

    stats.count += 1;
    stats.lastSortValue = Math.max(
      stats.lastSortValue,
      getHistorySortValue_(row.assignment_date, row.updated_at)
    );
  });

  return stats;
}

function buildGuardCandidateHistoryKeys_(candidate) {
  return [
    candidate && candidate.code,
    candidate && candidate.sourceTeacherCode,
    candidate && candidate.effectiveTeacherCode,
  ].reduce(function(keys, value) {
    const key = normalizeKey_(value);

    if (key && key !== normalizeKey_(NO_COVER_CODE)) {
      keys[key] = true;
    }

    return keys;
  }, {});
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
      savedByAbsenceId[absenceId] = row;
    }
  });

  rows.forEach(function(row) {
    const saved = savedByAbsenceId[row.id];
    const teacherCode = saved ? String(saved.teacher_code || '').trim() : '';

    if (!teacherCode) {
      return;
    }

    if (teacherCode === NO_COVER_CODE) {
      row.guardTeacherCode = NO_COVER_CODE;
      row.guardTeacherName = NO_COVER_LABEL;
      clearGuardIdentity_(row);
      return;
    }

    const teacher = teachersByCode[normalizeKey_(teacherCode)] || {};
    row.guardTeacherCode = teacherCode;
    row.guardTeacherName = teacher.name || teacherCode;
    row.guardAssignmentSaved = true;
    row.guardSourceTeacherCode = saved.source_teacher_code || teacherCode;
    row.guardSourceTeacherName = saved.source_teacher_name || row.guardTeacherName;
    row.guardEffectiveTeacherCode = saved.effective_teacher_code || teacherCode;
    row.guardEffectiveTeacherName = saved.effective_teacher_name || row.guardTeacherName;
    row.guardTeacherWasSubstituted = parseBoolean_(saved.teacher_was_substituted);
  });
}

function applyGuardCandidateToRow_(row, candidate) {
  row.guardTeacherCode = candidate.code;
  row.guardTeacherName = candidate.name;
  row.guardAssignmentSaved = false;
  row.guardSourceTeacherCode = candidate.sourceTeacherCode || candidate.code;
  row.guardSourceTeacherName = candidate.sourceTeacherName || candidate.name;
  row.guardEffectiveTeacherCode = candidate.effectiveTeacherCode || candidate.code;
  row.guardEffectiveTeacherName = candidate.effectiveTeacherName || candidate.name;
  row.guardTeacherWasSubstituted = Boolean(candidate.teacherWasSubstituted);
}

function clearGuardIdentity_(row) {
  row.guardSourceTeacherCode = '';
  row.guardSourceTeacherName = '';
  row.guardEffectiveTeacherCode = '';
  row.guardEffectiveTeacherName = '';
  row.guardTeacherWasSubstituted = false;
  row.guardAssignmentSaved = false;
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
  if (value === true) {
    return true;
  }

  return String(value || '').trim().toLowerCase() === 'true';
}

function isMultiDayAbsence_(parent) {
  const value = normalizeKey_(parent && parent.multi_day);
  return value === 'SÍ' || value === 'SI' || value === 'TRUE';
}

function isAbsenceActiveOnDate_(parent, selectedDate) {
  const targetDate = normalizeDate_(selectedDate);
  const startDate = normalizeDate_(parent && parent.absence_date);

  if (!targetDate || !startDate) {
    return false;
  }

  if (!isMultiDayAbsence_(parent)) {
    return targetDate === startDate;
  }

  const endDate = normalizeDate_(parent && parent.reincorporation_date);

  if (!endDate) {
    return targetDate === startDate;
  }

  return targetDate >= startDate && targetDate < endDate;
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

function buildScheduleCacheRows_(sheetData) {
  const rows = sheetData.displayValues || sheetData.values || [];
  const headerMap = buildHeaderMap_(rows[0] || []);

  SCHEDULE_CACHE_HEADERS.forEach(function(header) {
    if (headerMap[header] === undefined) {
      throw new Error('Horaris/schedule_cache is missing required column "' + header + '".');
    }
  });

  return rows.slice(1).map(function(row) {
    return {
      rowId: row[headerMap.row_id],
      group: row[headerMap.group],
      sourceTeacherCode: row[headerMap.source_teacher_code],
      sourceTeacherName: row[headerMap.source_teacher_name],
      sourceTeacherOriginalCode: row[headerMap.source_teacher_original_code],
      effectiveTeacherCode: row[headerMap.effective_teacher_code],
      effectiveTeacherName: row[headerMap.effective_teacher_name],
      teacherWasSubstituted: row[headerMap.teacher_was_substituted],
      subjectCode: row[headerMap.subject_code],
      subjectFullName: row[headerMap.subject_full_name],
      classroom: row[headerMap.classroom],
      day: row[headerMap.day],
      slot: row[headerMap.slot],
    };
  });
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

function buildHeaderMap_(headers) {
  return headers.reduce(function(map, header, index) {
    const key = String(header || '').trim();

    if (key) {
      map[key] = index;
    }

    return map;
  }, {});
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

function buildRecoveryNotificationBody_(notification) {
  const teacherName = String(notification.teacherName || '').trim();
  const lines = [
    'Bon dia' + (teacherName ? ', ' + teacherName : '') + ',',
    '',
    'Et recordem que demà tens programada una recuperació de classe:',
    '',
  ];

  notification.items.forEach(function(item) {
    lines.push('- Dia ' + formatDisplayDate_(item.date) + ' a les ' + item.time + '.');
  });

  lines.push(
    '',
    'Aquest missatge és un recordatori automàtic del Panell de guàrdies.',
    '',
    'Gràcies.'
  );

  return lines.join('\n');
}

function formatDisplayDate_(dateString) {
  const parts = String(dateString || '').split('-');

  if (parts.length !== 3) {
    return String(dateString || '');
  }

  return [parts[2], parts[1], parts[0]].join('/');
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
        sheets: [SCHEDULE_CACHE_SHEET_NAME],
      },
      teachingLoad: {
        logicalName: TABLE_NAMES.TEACHING_LOAD,
        sheets: [TABLE_SHEETS[TABLE_NAMES.TEACHING_LOAD]],
        note: 'No longer read for schedule display; subject names come from Horaris/schedule_cache.',
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
