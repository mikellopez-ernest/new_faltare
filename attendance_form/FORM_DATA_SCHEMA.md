# Faltaré / form_data Schema

Submitted and updated `attendance_form` rows are stored in the logical table `Faltaré`, sheet `form_data`.

The table is resolved through the database registry spreadsheet from script property `db`; it is not assumed to live in the registry spreadsheet.

The user plans to delete the old form-data sheet/spreadsheet contents, so this implementation creates the header row automatically when `form_data` is empty.

Columns are ordered to follow the form flow, with minimal internal metadata first:

| Column | Header | Description |
| --- | --- | --- |
| A | `row_id` | Spreadsheet row number used as the registry/edit identifier. |
| B | `created_at` | Creation timestamp. Preserved on edit. |
| C | `updated_at` | Last update timestamp. |
| D | `adreca_electronica` | Signed-in user when Apps Script exposes it; may be blank/fallback-derived when hidden by Apps Script. |
| E | `absence_teacher_name` | Teacher selected in `Absència de`. |
| F | `absence_teacher_email` | Email for the selected teacher from `Dades de professors`. |
| G | `teacher_code` | Teacher code from `Dades de professors`, column F. |
| H | `que_vols_fer` | Selected first-page action. |
| I | `professor_acompanyant` | `Sí` or `No`. Defaults to `No`. |
| J | `absence_date` | Selected absence date. |
| K | `multi_day` | `Sí` or `No`. Defaults to `No`. |
| L | `selected_schedule_items_json` | JSON array of checked grouped schedule rows and student work text. Grouped rows include source row IDs, groups, classrooms, and whether the row had an associated group. This JSON is loaded back into the edit form and preserved when saving existing rows. |
| M | `reincorporation_date` | Reincorporation date for multi-day absences. |
| N | `multi_day_student_work` | Student-work text for multi-day absences. |
| O | `motiu` | Selected absence reason. |
| P | `motiu_route` | `J-a` for ordinary hours, `J-b` for recovery hours. |
| Q | `context` | Confidential context text. |
| R | `hores` | Hidden hours value for `J-a`, auto-filled from checked grouped schedule rows by default and still submitted. |
| S | `hores_a_recuperar` | Recovery hour count for `J-b`, auto-filled from checked grouped schedule rows by default. |
| T | `recovery_items_json` | JSON array of recovery date/time pairs. |
| U | `permis_llicencia_absencia` | Selected permit/license/ordinary absence value. For `J-b`, the field is hidden and automatically saved as `Absència ordinària`. |
| V | `document_file_id` | Uploaded Drive file ID, if any. Preserved on edit when no new file is uploaded. |
| W | `document_file_url` | Uploaded Drive file URL, if any. Preserved on edit when no new file is uploaded. |
| X | `document_file_name` | Uploaded Drive file name, if any. Preserved on edit when no new file is uploaded. |
| Y | `confirmation_ok` | `TRUE` when the mandatory confirmation is checked. |
| Z | `status` | Initial value `submitted`; changed to `updated` when edited. |

If the sheet has no headers, the script creates this header row automatically. If headers already exist but do not match, submission stops with an error so data is not written into an unexpected structure.
