const SCRIPT_PROP_DB = 'db';
const TABLES_SHEET_NAME = 'tables';
const ALLOWED_EMAIL_DOMAIN = '@iernestlluch.cat';
const DOCUMENT_UPLOAD_FOLDER_ID = '12CHcrUW8mgeeotIi5ltzNeoWiy9toqjI';

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
  [TABLE_NAMES.ABSENCE_FORM]: 'form_data',
};

const ACTIONS = {
  CREATE_GUARD_NOTICE: 'Avisar que genero guàrdia',
  UPDATE_GUARD_NOTICE: 'Actualitzar una guàrdia ja generada',
};

const REASON_ROUTES = {
  HOURS: 'J-a',
  RECOVERY: 'J-b',
};

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

const FORM_DATA_HEADERS = [
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
];

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

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Avís de guàrdies')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getClientBootstrapData() {
  return getBootstrapData_(getCurrentUser_());
}

function getBootstrapData_(user) {
  assertAllowedUserIfKnown_(user.email);

  return {
    user: user,
    userEmailAvailable: Boolean(user.email),
    teachers: loadActiveTeachers_(),
    actions: ACTIONS,
    reasons: REASONS,
    scheduleSlotTimes: SCHEDULE_SLOT_TIMES,
    today: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
  };
}

function getScheduleForTeacher(payload) {
  const user = getCurrentUser_();
  assertAllowedUserIfKnown_(user.email);

  const teacherEmail = String(payload.teacherEmail || '').trim();
  const absenceDate = String(payload.absenceDate || '').trim();

  if (!teacherEmail) {
    throw new Error('Cal seleccionar el professor o professora.');
  }

  if (!absenceDate) {
    throw new Error('Cal indicar la data prevista de l\'absència.');
  }

  const dayNumber = getIsoWeekday_(absenceDate);

  if (!dayNumber || dayNumber > 5) {
    return {
      teacherEmail: teacherEmail,
      absenceDate: absenceDate,
      dayNumber: dayNumber,
      items: [],
      message: 'La data seleccionada no és lectiva o no té horari assignat.',
    };
  }

  const teacher = findTeacherByEmail_(teacherEmail);

  if (!teacher) {
    throw new Error('No s\'ha trobat el professor o professora seleccionat.');
  }

  const schedules = loadScheduleRows_();
  const subjects = loadSubjectMap_();
  const teacherCode = normalizeKey_(teacher.teacherCode);

  const rawItems = schedules
    .filter(function(row) {
      return normalizeKey_(row.teacherCode) === teacherCode && Number(row.day) === dayNumber;
    })
    .sort(function(a, b) {
      return Number(a.slot) - Number(b.slot);
    })
    .map(function(row) {
      return {
        rowId: row.rowId,
        group: row.group,
        teacherCode: row.teacherCode,
        subjectCode: row.subjectCode,
        subjectName: subjects[normalizeKey_(row.subjectCode)] || row.subjectCode,
        classroom: row.classroom,
        day: row.day,
        slot: row.slot,
        time: SCHEDULE_SLOT_TIMES[String(row.slot)] || String(row.slot),
      };
    });
  const items = groupScheduleItems_(rawItems);

  return {
    teacherEmail: teacher.email,
    teacherCode: teacher.teacherCode,
    teacherName: teacher.name,
    absenceDate: absenceDate,
    dayNumber: dayNumber,
    items: items,
    message: items.length ? '' : 'No hi ha cap classe programada per aquest professor/a en aquesta data.',
  };
}

function submitAttendanceForm(payload) {
  const user = getCurrentUser_();
  assertAllowedUserIfKnown_(user.email);

  validateSubmission_(payload);

  const teacher = findTeacherByEmail_(payload.teacherEmail);

  if (!teacher) {
    throw new Error('No s\'ha trobat el professor o professora seleccionat.');
  }

  const formSheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.ABSENCE_FORM);
  ensureFormDataHeaders_(formSheet);

  const isUpdate = Boolean(payload.editRowId);
  const rowNumber = isUpdate ? Number(payload.editRowId) : Math.max(formSheet.getLastRow() + 1, 2);

  if (isUpdate && (!Number.isFinite(rowNumber) || rowNumber < 2)) {
    throw new Error('El registre que es vol actualitzar no és vàlid.');
  }

  const existingValues = isUpdate ? getFormRowObject_(formSheet, rowNumber) : {};

  const fileInfo = payload.documentFile
    ? uploadDocument_(payload.documentFile, rowNumber)
    : {
      id: existingValues.document_file_id || '',
      url: existingValues.document_file_url || '',
      name: existingValues.document_file_name || '',
    };

  const valuesByHeader = {
    row_id: rowNumber,
    created_at: existingValues.created_at || new Date(),
    updated_at: new Date(),
    adreca_electronica: user.email,
    absence_teacher_name: teacher.name,
    absence_teacher_email: teacher.email,
    teacher_code: teacher.teacherCode,
    que_vols_fer: payload.action,
    professor_acompanyant: payload.professorAcompanyant,
    absence_date: payload.absenceDate,
    multi_day: payload.multiDay,
    selected_schedule_items_json: JSON.stringify(payload.selectedScheduleItems || []),
    reincorporation_date: payload.reincorporationDate || '',
    multi_day_student_work: payload.multiDayStudentWork || '',
    motiu: payload.motiu,
    motiu_route: getReasonRoute_(payload.motiu),
    context: payload.context || '',
    hores: payload.hores || '',
    hores_a_recuperar: payload.horesARecuperar || '',
    recovery_items_json: JSON.stringify(payload.recoveryItems || []),
    permis_llicencia_absencia: payload.permisLlicenciaAbsencia || '',
    document_file_id: fileInfo.id,
    document_file_url: fileInfo.url,
    document_file_name: fileInfo.name,
    confirmation_ok: payload.confirmationOk ? 'TRUE' : 'FALSE',
    status: isUpdate ? 'updated' : 'submitted',
  };

  const row = FORM_DATA_HEADERS.map(function(header) {
    return valuesByHeader[header];
  });

  formSheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);

  const confirmationEmailTemplate = buildConfirmationEmailTemplate_(valuesByHeader, fileInfo, isUpdate);
  sendConfirmationEmail_(confirmationEmailTemplate);

  return {
    ok: true,
    rowNumber: rowNumber,
    documentFile: fileInfo,
    confirmationEmailTemplate: confirmationEmailTemplate,
    message: isUpdate ? 'El formulari s\'ha actualitzat correctament.' : 'El formulari s\'ha enviat correctament.',
  };
}

function sendConfirmationEmail_(template) {
  required_(template.to, 'No s\'ha pogut enviar el correu perquè falta el destinatari.');
  required_(template.subject, 'No s\'ha pogut enviar el correu perquè falta l\'assumpte.');
  required_(template.body, 'No s\'ha pogut enviar el correu perquè falta el cos del missatge.');

  MailApp.sendEmail({
    to: template.to,
    subject: template.subject,
    body: template.body,
    htmlBody: template.htmlBody || template.body,
  });
}

function buildConfirmationEmailTemplate_(submission, fileInfo, isUpdate) {
  const tags = buildConfirmationEmailTags_(submission, fileInfo, isUpdate);

  return {
    to: submission.adreca_electronica,
    subject: renderTemplate_(CONFIRMATION_EMAIL_TEMPLATE.subject, tags),
    body: cleanupBlankTemplateLines_(renderTemplate_(CONFIRMATION_EMAIL_TEMPLATE.textBody, tags)),
    htmlBody: renderTemplate_(CONFIRMATION_EMAIL_TEMPLATE.htmlBody, tags),
  };
}

function buildConfirmationEmailTags_(submission, fileInfo, isUpdate) {
  const route = getReasonRoute_(submission.motiu);
  const selectedScheduleItems = parseJson_(submission.selected_schedule_items_json, []);
  const recoveryItems = parseJson_(submission.recovery_items_json, []);
  const title = isUpdate ? 'Actualització del Faltaré' : 'Confirmació del Faltaré';
  const scheduleText = selectedScheduleItems.length
    ? selectedScheduleItems.map(formatScheduleItemText_).join('\n')
    : 'No s\'han indicat classes concretes.';
  const recoveryText = recoveryItems.length
    ? recoveryItems.map(function(item, index) {
      return (index + 1) + '. ' + formatDisplayDate_(item.date) + ' - ' + item.time;
    }).join('\n')
    : 'No correspon.';
  const documentText = fileInfo && fileInfo.url ? fileInfo.url : 'No s\'ha adjuntat cap document.';
  const summaryRowsHtml =
    emailRow_('Número de registre', submission.row_id) +
    emailRow_('Data de registre', formatDisplayDateTime_(submission.updated_at)) +
    emailRow_('Adreça electrònica', submission.adreca_electronica) +
    emailRow_('Absència de', submission.absence_teacher_name) +
    emailRow_('Data prevista de l\'absència', formatDisplayDate_(submission.absence_date)) +
    emailRow_('Absència de més d\'un dia?', submission.multi_day) +
    (submission.reincorporation_date ? emailRow_('Data de reincorporació', formatDisplayDate_(submission.reincorporation_date)) : '') +
    emailRow_('Professor acompanyant?', submission.professor_acompanyant) +
    emailRow_('Motiu', submission.motiu) +
    emailRow_('Context', submission.context) +
    (route === REASON_ROUTES.HOURS ? emailRow_('Hores', submission.hores) : '') +
    (route === REASON_ROUTES.RECOVERY ? emailRow_('Hores a recuperar', submission.hores_a_recuperar) : '') +
    emailRow_('Permís, llicència o absència ordinària', submission.permis_llicencia_absencia);

  return {
    EMAIL_TITLE: title,
    ACTION_TEXT: isUpdate ? 'l\'actualització' : 'la creació',
    ACTION_TEXT_HTML: escapeHtml_(isUpdate ? 'l\'actualització' : 'la creació'),
    REGISTER_NUMBER: submission.row_id,
    REGISTER_DATE: formatDisplayDateTime_(submission.updated_at),
    CREATOR_EMAIL: submission.adreca_electronica,
    ABSENCE_TEACHER_NAME: submission.absence_teacher_name,
    ABSENCE_DATE: formatDisplayDate_(submission.absence_date),
    MULTI_DAY: submission.multi_day,
    REINCORPORATION_TEXT: submission.reincorporation_date ? 'Data de reincorporació: ' + formatDisplayDate_(submission.reincorporation_date) : '',
    ACCOMPANYING_TEACHER: submission.professor_acompanyant,
    REASON: submission.motiu,
    CONTEXT: submission.context,
    HOURS_TEXT: route === REASON_ROUTES.HOURS ? 'Hores: ' + submission.hores : '',
    RECOVERY_HOURS_TEXT: route === REASON_ROUTES.RECOVERY ? 'Hores a recuperar: ' + submission.hores_a_recuperar : '',
    PERMIT_LICENSE_ABSENCE: submission.permis_llicencia_absencia,
    SCHEDULE_TEXT: scheduleText,
    SCHEDULE_HTML: formatScheduleItemsHtml_(selectedScheduleItems),
    MULTI_DAY_STUDENT_WORK_TEXT: submission.multi_day_student_work ? 'Feina per l\'alumnat: ' + submission.multi_day_student_work : '',
    MULTI_DAY_STUDENT_WORK_HTML: submission.multi_day_student_work ? '<h3>Feina per l\'alumnat</h3><p>' + nl2br_(submission.multi_day_student_work) + '</p>' : '',
    RECOVERY_TEXT: recoveryText,
    RECOVERY_HTML: formatRecoveryItemsHtml_(recoveryItems),
    DOCUMENT_TEXT: documentText,
    DOCUMENT_HTML: fileInfo && fileInfo.url
      ? '<p><a href="' + escapeHtml_(fileInfo.url) + '">' + escapeHtml_(fileInfo.name || 'Document adjunt') + '</a></p>'
      : '<p>No s\'ha adjuntat cap document.</p>',
    SUMMARY_ROWS_HTML: summaryRowsHtml,
  };
}

function renderTemplate_(template, tags) {
  return String(template || '').replace(/\{\{([A-Z0-9_]+)\}\}/g, function(match, tagName) {
    return Object.prototype.hasOwnProperty.call(tags, tagName) ? String(tags[tagName]) : match;
  });
}

function cleanupBlankTemplateLines_(text) {
  return String(text || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getSubmissionsForTeacher(teacherEmail) {
  assertAllowedUserIfKnown_(getCurrentUser_().email);

  if (!teacherEmail) {
    throw new Error('Cal seleccionar el professor o professora.');
  }

  const formSheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.ABSENCE_FORM);
  ensureFormDataHeaders_(formSheet);
  const values = formSheet.getDataRange().getDisplayValues();

  return values.slice(1).reduce(function(rows, row, index) {
    const rowObject = rowToObject_(row);

    if (normalizeKey_(rowObject.absence_teacher_email) !== normalizeKey_(teacherEmail)) {
      return rows;
    }

    rows.push({
      rowId: Number(rowObject.row_id || index + 2),
      createdAt: rowObject.created_at,
      absenceDate: rowObject.absence_date,
      context: rowObject.context,
    });

    return rows;
  }, []).sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function getSubmissionForEdit(rowId) {
  assertAllowedUserIfKnown_(getCurrentUser_().email);

  const rowNumber = Number(rowId);

  if (!rowNumber || rowNumber < 2) {
    throw new Error('El registre seleccionat no és vàlid.');
  }

  const formSheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.ABSENCE_FORM);
  ensureFormDataHeaders_(formSheet);
  const rowObject = getFormRowObject_(formSheet, rowNumber);

  return {
    editRowId: rowNumber,
    teacherEmail: rowObject.absence_teacher_email,
    action: ACTIONS.CREATE_GUARD_NOTICE,
    professorAcompanyant: rowObject.professor_acompanyant,
    absenceDate: rowObject.absence_date,
    multiDay: rowObject.multi_day,
    selectedScheduleItems: parseJson_(rowObject.selected_schedule_items_json, []),
    reincorporationDate: rowObject.reincorporation_date,
    multiDayStudentWork: rowObject.multi_day_student_work,
    motiu: rowObject.motiu,
    context: rowObject.context,
    hores: rowObject.hores,
    horesARecuperar: rowObject.hores_a_recuperar,
    recoveryItems: parseJson_(rowObject.recovery_items_json, []),
    permisLlicenciaAbsencia: rowObject.permis_llicencia_absencia,
    confirmationOk: parseBoolean_(rowObject.confirmation_ok),
  };
}

function getCurrentUser_() {
  const activeEmail = String(Session.getActiveUser().getEmail() || '').trim();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim();
  const email = activeEmail || effectiveEmail;

  return {
    email: email,
    activeEmail: activeEmail,
    effectiveEmail: effectiveEmail,
    emailDetected: Boolean(email),
  };
}

function assertAllowedUserIfKnown_(email) {
  if (!email) {
    return;
  }

  if (!String(email).toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
    throw new Error('Aquest formulari només és accessible amb un compte ' + ALLOWED_EMAIL_DOMAIN + '.');
  }
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

function loadActiveTeachers_() {
  const sheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.PROFESSORS_DATA);
  const values = sheet.getDataRange().getDisplayValues();

  return values.slice(1).reduce(function(teachers, row) {
    const isInactive = parseBoolean_(row[11]);
    const isActive = parseBoolean_(row[13]);

    if (isInactive || !isActive) {
      return teachers;
    }

    const name = joinName_(row[2], row[3], row[4]);
    const teacherCode = String(row[5] || '').trim();
    const email = String(row[10] || '').trim();

    if (!name || !email) {
      return teachers;
    }

    teachers.push({
      name: name,
      email: email,
      teacherCode: teacherCode,
    });

    return teachers;
  }, []).sort(function(a, b) {
    return a.name.localeCompare(b.name, 'ca');
  });
}

function findTeacherByEmail_(email) {
  const normalizedEmail = normalizeKey_(email);

  return loadActiveTeachers_().filter(function(teacher) {
    return normalizeKey_(teacher.email) === normalizedEmail;
  })[0] || null;
}

function loadScheduleRows_() {
  const sheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.SCHEDULES);
  const values = sheet.getDataRange().getDisplayValues();

  return values.slice(1).map(function(row) {
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

function loadSubjectMap_() {
  const sheet = openTableSheet_(loadTableRegistry_(), TABLE_NAMES.TEACHING_LOAD);
  const values = sheet.getDataRange().getDisplayValues();
  const subjects = {};

  values.slice(1).forEach(function(row) {
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
        hasGroup: false,
      };
      groupedItems.push(groupedByKey[key]);
    }

    groupedByKey[key].rowIds.push(item.rowId);
    pushUnique_(groupedByKey[key].groups, item.group);
    pushUnique_(groupedByKey[key].classrooms, item.classroom);
    groupedByKey[key].hasGroup = groupedByKey[key].groups.length > 0;
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
      hasGroup: item.hasGroup,
    };
  });
}

function ensureFormDataHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), FORM_DATA_HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const hasAnyHeader = firstRow.some(function(value) {
    return String(value || '').trim();
  });

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, FORM_DATA_HEADERS.length).setValues([FORM_DATA_HEADERS]);
    return;
  }

  const currentHeaders = firstRow.slice(0, FORM_DATA_HEADERS.length).map(function(value) {
    return String(value || '').trim();
  });

  const hasExpectedHeaders = FORM_DATA_HEADERS.every(function(header, index) {
    return currentHeaders[index] === header;
  });

  if (!hasExpectedHeaders) {
    throw new Error('The Faltaré/form_data sheet headers do not match the expected schema.');
  }
}

function getFormRowObject_(sheet, rowNumber) {
  const lastColumn = FORM_DATA_HEADERS.length;

  if (rowNumber > sheet.getLastRow()) {
    throw new Error('No s\'ha trobat el registre seleccionat.');
  }

  return rowToObject_(sheet.getRange(rowNumber, 1, 1, lastColumn).getDisplayValues()[0]);
}

function rowToObject_(row) {
  return FORM_DATA_HEADERS.reduce(function(object, header, index) {
    object[header] = row[index] || '';
    return object;
  }, {});
}

function parseJson_(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function validateSubmission_(payload) {
  if (!payload) {
    throw new Error('No s\'han rebut dades del formulari.');
  }

  if (payload.action !== ACTIONS.CREATE_GUARD_NOTICE && payload.action !== ACTIONS.UPDATE_GUARD_NOTICE) {
    throw new Error('Aquesta opció encara no està implementada.');
  }

  required_(payload.teacherEmail, 'Cal seleccionar el professor o professora.');
  required_(payload.professorAcompanyant, 'Cal indicar si és professor acompanyant.');
  required_(payload.absenceDate, 'Cal indicar la data prevista de l\'absència.');
  required_(payload.multiDay, 'Cal indicar si és una absència de més d\'un dia.');

  if (payload.multiDay === 'Sí') {
    required_(payload.reincorporationDate, 'Cal indicar la data de reincorporació.');
  }

  if (payload.multiDay === 'No') {
    if (!Array.isArray(payload.selectedScheduleItems) || !payload.selectedScheduleItems.length) {
      throw new Error('Cal seleccionar com a mínim una classe per generar guàrdia.');
    }

    const schedule = getScheduleForTeacher({
      teacherEmail: payload.teacherEmail,
      absenceDate: payload.absenceDate,
    });

    if (!schedule.items.length && !payload.editRowId) {
      throw new Error(schedule.message || 'No hi ha horari per aquesta data.');
    }
  }

  required_(payload.motiu, 'Cal indicar el motiu.');
  required_(payload.context, 'Cal indicar el context.');

  const route = getReasonRoute_(payload.motiu);

  if (route === REASON_ROUTES.HOURS) {
    required_(payload.hores, 'Cal indicar les hores.');
  }

  if (route === REASON_ROUTES.RECOVERY) {
    required_(payload.horesARecuperar, 'Cal indicar les hores a recuperar.');

    const recoveryCount = Number(payload.horesARecuperar);

    if (!Number.isFinite(recoveryCount) || recoveryCount < 1) {
      throw new Error('Les hores a recuperar han de ser un número superior a zero.');
    }

    if (!Array.isArray(payload.recoveryItems) || payload.recoveryItems.length !== recoveryCount) {
      throw new Error('Cal indicar una data i una hora per cada hora a recuperar.');
    }

    payload.recoveryItems.forEach(function(item, index) {
      required_(item.date, 'Cal indicar la data de recuperació ' + (index + 1) + '.');
      required_(item.time, 'Cal indicar l\'hora de recuperació ' + (index + 1) + '.');
    });
  }

  required_(payload.permisLlicenciaAbsencia, 'Cal indicar si és permís, llicència o absència ordinària.');

  if (!payload.confirmationOk) {
    throw new Error('Cal confirmar la tramitació abans d\'enviar el formulari.');
  }
}

function uploadDocument_(documentFile, rowNumber) {
  required_(documentFile.name, 'El document adjunt no té nom.');
  required_(documentFile.mimeType, 'El document adjunt no té tipus MIME.');
  required_(documentFile.data, 'El document adjunt no té dades.');

  const bytes = Utilities.base64Decode(documentFile.data);
  const extension = getFileExtension_(documentFile.name);
  const fileName = 'document_faltare_' + rowNumber + extension;
  const blob = Utilities.newBlob(bytes, documentFile.mimeType, fileName);
  const file = DriveApp.getFolderById(DOCUMENT_UPLOAD_FOLDER_ID).createFile(blob);

  return {
    id: file.getId(),
    url: file.getUrl(),
    name: file.getName(),
  };
}

function getReasonRoute_(reason) {
  const found = REASONS.filter(function(item) {
    return item.value === reason;
  })[0];

  if (!found) {
    throw new Error('El motiu seleccionat no és vàlid.');
  }

  return found.route;
}

function getIsoWeekday_(dateString) {
  const parts = String(dateString || '').split('-').map(Number);

  if (parts.length !== 3 || parts.some(function(part) { return !Number.isFinite(part); })) {
    throw new Error('La data indicada no és vàlida.');
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay();

  return day === 0 ? 7 : day;
}

function parseBoolean_(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'sí' || normalized === 'si' || normalized === '1';
}

function formatDisplayDate_(dateString) {
  const parts = String(dateString || '').split('-');

  if (parts.length !== 3) {
    return String(dateString || '');
  }

  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatDisplayDateTime_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !Number.isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  }

  return String(value || '');
}

function formatScheduleItemText_(item) {
  const groups = item.groupsText || (Array.isArray(item.groups) ? item.groups.join(', ') : '');
  const studentWork = item.studentWork ? ' | Feina: ' + item.studentWork : '';
  return '- ' + [item.time, item.subjectName || item.subjectCode, groups].filter(Boolean).join(' | ') + studentWork;
}

function formatScheduleItemsHtml_(items) {
  if (!items.length) {
    return '<p>No s\'han indicat classes concretes.</p>';
  }

  const rows = items.map(function(item) {
    const groups = item.groupsText || (Array.isArray(item.groups) ? item.groups.join(', ') : '');

    return '<tr>' +
      '<td style="border-bottom:1px solid #d7dde5;padding:6px;">' + escapeHtml_(item.time || '') + '</td>' +
      '<td style="border-bottom:1px solid #d7dde5;padding:6px;">' + escapeHtml_(item.subjectName || item.subjectCode || '') + '</td>' +
      '<td style="border-bottom:1px solid #d7dde5;padding:6px;">' + escapeHtml_(groups) + '</td>' +
      '<td style="border-bottom:1px solid #d7dde5;padding:6px;">' + nl2br_(item.studentWork || '') + '</td>' +
      '</tr>';
  }).join('');

  return '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #d7dde5;width:100%;max-width:760px;">' +
    '<thead><tr>' +
    '<th style="background:#f8fafc;border-bottom:1px solid #d7dde5;padding:6px;text-align:left;">Hora</th>' +
    '<th style="background:#f8fafc;border-bottom:1px solid #d7dde5;padding:6px;text-align:left;">Assignatura</th>' +
    '<th style="background:#f8fafc;border-bottom:1px solid #d7dde5;padding:6px;text-align:left;">Grups</th>' +
    '<th style="background:#f8fafc;border-bottom:1px solid #d7dde5;padding:6px;text-align:left;">Feina</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function formatRecoveryItemsHtml_(items) {
  if (!items.length) {
    return '<p>No correspon.</p>';
  }

  return '<ol>' + items.map(function(item) {
    return '<li>' + escapeHtml_(formatDisplayDate_(item.date)) + ' - ' + escapeHtml_(item.time || '') + '</li>';
  }).join('') + '</ol>';
}

function emailRow_(label, value) {
  return '<tr>' +
    '<th style="background:#f8fafc;border-bottom:1px solid #d7dde5;padding:6px;text-align:left;width:240px;">' + escapeHtml_(label) + '</th>' +
    '<td style="border-bottom:1px solid #d7dde5;padding:6px;">' + nl2br_(value) + '</td>' +
    '</tr>';
}

function nl2br_(value) {
  return escapeHtml_(value).replace(/\n/g, '<br>');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function joinName_(name, surname1, surname2) {
  return [name, surname1, surname2].map(function(part) {
    return String(part || '').trim();
  }).filter(Boolean).join(' ');
}

function normalizeKey_(value) {
  return String(value || '').trim().toLowerCase();
}

function pushUnique_(list, value) {
  const cleanValue = String(value || '').trim();

  if (cleanValue && list.indexOf(cleanValue) === -1) {
    list.push(cleanValue);
  }
}

function required_(value, message) {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(message);
  }
}

function getFileExtension_(fileName) {
  const cleanName = String(fileName || '').trim();
  const dotIndex = cleanName.lastIndexOf('.');

  if (dotIndex === -1 || dotIndex === cleanName.length - 1) {
    return '';
  }

  return cleanName.slice(dotIndex);
}
