# Project Context

## Google Apps Script

This project is the `attendance_form` Google Apps Script project managed with `clasp`.

- Script name: `attendance_form`
- Script ID: `1RDz0A0yXf1R0CsDVbEqO_NbgJsTXxo2fAiGQrnhx9sr-So_H-MIAII-N`
- Local clasp config: `.clasp.json`

This script exposes an endpoint with a teacher-facing attendance form.

This folder is separate from `admin_page` and `control_panel`. Run `clasp` commands from this folder when changing this script.

Editable confirmation email content lives in `EmailTemplates.js`. The main `Código.js` file builds replacement values from the submitted row and renders the `{{TAG_NAME}}` placeholders before sending.

`Faltaré` storage is normalized across multiple sheets in the same resolved `Faltaré` spreadsheet.

`attendance_form` writes:

- `form_data`: parent absence request rows.
- `absences`: selected schedule/class child rows linked by `row_id`.
- `recovery`: recovery date/time child rows linked by `row_id`.

`control_panel` also writes:

- `profes_guardia`: guard-duty teacher assignments.

Do not store selected schedules or recovery items as JSON fields in `form_data`.
