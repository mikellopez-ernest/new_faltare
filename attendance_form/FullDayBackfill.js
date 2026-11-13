/** One-time maintenance: run previewFullDayTimes_(), then backfillFullDayTimes_() in the editor. */
function previewFullDayTimes_() {
  return processFullDayTimesBackfill_(false);
}

function backfillFullDayTimes_() {
  return processFullDayTimesBackfill_(true);
}

function processFullDayTimesBackfill_(apply) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const registry = loadTableRegistry_();
    const sheet = openFaltareSheet_(registry, FALTARE_SHEETS.FORM_DATA);
    const range = sheet.getDataRange();
    const values = range.getValues();
    const displayValues = range.getDisplayValues();
    const headers = buildHeaderMap_(values[0] || []);
    ['row_id', 'multi_day', 'full_day', 'teacher_code', 'absence_date', 'absence_start_time', 'return_time'].forEach(function(header) {
      if (headers[header] === undefined) throw new Error('Missing form_data column: ' + header);
    });
    const schedules = loadScheduleCacheRows_(registry);
    const report = { apply: apply, scanned: values.length - 1, eligible: 0, changed: [], unchanged: 0, skipped: [] };
    values.slice(1).forEach(function(row, index) {
      if (!String(row[headers.row_id] || '').trim() || parseBoolean_(row[headers.multi_day])) return;
      const fullDay = String(row[headers.full_day] || '').trim();
      // Only explicitly full-day rows; unresolved legacy blanks remain untouched.
      if (!parseBoolean_(fullDay)) return;
      report.eligible++;
      const rowId = String(row[headers.row_id]);
      try {
        const teacherCode = normalizeKey_(row[headers.teacher_code]);
        if (!teacherCode) throw new Error('Missing teacher code');
        const date = normalizeDateValue_(row[headers.absence_date]);
        const weekday = getIsoWeekday_(date);
        const dayRows = schedules.filter(function(item) { return Number(item.day) === weekday; });
        let items = dayRows.filter(function(item) { return normalizeKey_(item.effectiveTeacherCode) === teacherCode; });
        let match = 'effective';
        if (!items.length) {
          items = dayRows.filter(function(item) { return normalizeKey_(item.sourceTeacherCode) === teacherCode; });
          match = 'source';
        }
        const boundaries = getFullDayBoundaries_(items);
        const displayedRow = displayValues[index + 1];
        if (normalizeRecoveryTime_(displayedRow[headers.absence_start_time]) === boundaries.absenceStartTime &&
            normalizeRecoveryTime_(displayedRow[headers.return_time]) === boundaries.returnTime) {
          report.unchanged++;
          return;
        }
        const change = { rowId: rowId, date: date, match: match,
          previousStart: String(displayedRow[headers.absence_start_time] || ''),
          previousReturn: String(displayedRow[headers.return_time] || ''),
          absenceStartTime: boundaries.absenceStartTime, returnTime: boundaries.returnTime };
        if (apply) {
          // Persist the previous cells before touching the sheet; retries preserve the first backup.
          const properties = PropertiesService.getScriptProperties();
          const backupKey = 'full_day_times_2026_10_22_' + rowId;
          if (!properties.getProperty(backupKey)) properties.setProperty(backupKey, JSON.stringify(change));
          sheet.getRange(index + 2, headers.absence_start_time + 1).setValue(boundaries.absenceStartTime);
          sheet.getRange(index + 2, headers.return_time + 1).setValue(boundaries.returnTime);
        }
        report.changed.push(change);
      } catch (error) {
        report.skipped.push({ rowId: rowId, reason: error.message });
      }
    });
    if (apply) SpreadsheetApp.flush();
    console.log(JSON.stringify(report));
    return report;
  } finally {
    lock.releaseLock();
  }
}
