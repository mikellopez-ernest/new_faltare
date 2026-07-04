# Project Context

## Google Apps Script

This project is the `attendance_form` Google Apps Script project managed with `clasp`.

- Script name: `attendance_form`
- Script ID: `1RDz0A0yXf1R0CsDVbEqO_NbgJsTXxo2fAiGQrnhx9sr-So_H-MIAII-N`
- Local clasp config: `.clasp.json`

This script will expose an endpoint with a teacher-facing attendance form.

This folder is separate from `admin_page`. Run `clasp` commands from this folder when changing this script.

Editable confirmation email content lives in `EmailTemplates.js`. The main `Código.js` file builds replacement values from the submitted row and renders the `{{TAG_NAME}}` placeholders before sending.
