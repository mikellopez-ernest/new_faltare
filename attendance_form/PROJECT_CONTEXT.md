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
- `absences`: selected schedule/class child rows linked by `row_id`.
- `recovery`: recovery date/time child rows linked by `row_id`.

`control_panel` also writes:

- `profes_guardia`: guard-duty teacher assignments.

Do not store selected schedules or recovery items as JSON fields in `form_data`.
