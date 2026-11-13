# Project Context

## Google Apps Script

This project is the `attendance_form` Google Apps Script project managed with `clasp`.

- Script name: `attendance_form`
- Script ID: `1RDz0A0yXf1R0CsDVbEqO_NbgJsTXxo2fAiGQrnhx9sr-So_H-MIAII-N`
- Local clasp config: `.clasp.json`

This script exposes an endpoint with a teacher-facing attendance form.

This folder is separate from `admin_page` and `control_panel`. Run `clasp` commands from this folder when changing this script.

This script resolves the database registry from Apps Script property `db`.

Editable confirmation email content lives in `EmailTemplates.js`. The main `Código.js` file builds replacement values from the submitted row and renders the `{{TAG_NAME}}` placeholders before sending.

`Faltaré` storage is normalized across multiple sheets in the same resolved `Faltaré` spreadsheet.

`Dades de professors` uses the updated `Llista` schema documented in `ATTENDANCE_FORM_SPEC.md`:

- `CORREU` is column L.
- `NOUS`, `ACTIU`, `BAIXA?`, and `SUBST?` are columns M, N, O, and P.
- Substitute status comes only from `SUBST?`, not from `SITUACIO`.
- Teacher names are built from `NOM`, `COGNOM1`, and `COGNOM2`, and sorted by surname order.
- Active substitutes selected in the form resolve their timetable through `Horaris -> schedule_cache`: match the selected substitute's `REDUIT` to `effective_teacher_code`. The cache already reflects active rows from `Dades de professors -> leave_absence`.
- `form_data.teacher_code` stores the selected teacher's `REDUIT`, including when the selected teacher is a substitute.

Schedule rows are read from `Horaris -> schedule_cache`, not directly from `GPU001`. Use `subject_full_name` from the cache for display instead of opening `Càrrega lectiva -> assignatures` during normal form loading.

This script must not call `rebuildScheduleCache()` or trigger the cache rebuild endpoint. It trusts the existing cache, which is refreshed daily and after leave-of-absence changes by the cache owner.

`attendance_form` writes:

- `form_data`: parent absence request rows.
- `absences`: included schedule/class child rows linked by `row_id`.
- `recovery`: recovery date/time child rows linked by `row_id`.

For one-day absences, `form_data.full_day` controls schedule inclusion. Full-day submissions show every grouped schedule row; partial-day submissions use inclusive `absence_start_time` and exclusive `return_time`. The schedule table has no selection checkboxes. Every visible row counts toward `form_data.hores` for every reason, but only rows with student groups and rows whose subject name or code is exactly `GUARDIA` or `GUARDIA_PATI` are written to `absences`. Other group-less rows remain visible in faded colours with disabled controls. For recovery reasons, `form_data.hores_a_recuperar` is a separate user-entered value and determines the recovery rows. Older one-day rows without `full_day` are treated as full-day.

The legacy one-day backfill completed on `2026-10-21`: the initial pass updated 75 rows, the substitute-cache follow-up updated 14, and the corrected-ID follow-up updated 18 while repairing affected child foreign keys. The final total is 107 reconstructed rows with 7 unsafe rows left unchanged. Its temporary functions and endpoint were removed. See `LEGACY_BACKFILL_2026-10-21.md` for the audit summary.

Full-day one-day submissions now store the first timetable slot start and the next slot start after the last slot as `absence_start_time` and `return_time`, including all slot types. The return boundary after slot 12 is `21:30`. The `2026-10-22` backfill updated 68 records; 2 were already correct, and final verification found all 70 eligible records correct. `FullDayBackfill.js` retains private editor-only preview/write methods. The temporary web runner was removed; see `FULL_DAY_BACKFILL_2026-10-22.md` for the audit summary.

`control_panel` also writes:

- `profes_guardia`: guard-duty teacher assignments.

Do not store selected schedules or recovery items as JSON fields in `form_data`.

When opening an existing absence for editing, reveal the edit screen before triggering the live timetable refresh. Saved class rows are a fallback for the original teacher/date only; normalize their legacy times before partial-day filtering. Discard outdated timetable responses so a previous record or date cannot overwrite the current edit.
Restore saved work/no-cover state before rendering rows, with an unambiguous time/subject/group fallback when cache row IDs change. Show the current uploaded document as a named link; retain it on save unless a replacement file is selected. Clear the file picker when opening another record or starting a new notice.
