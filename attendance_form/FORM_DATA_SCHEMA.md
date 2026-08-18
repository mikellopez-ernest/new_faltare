# Faltaré Schema

Submitted and updated `attendance_form` data, plus control-panel guard assignments, are stored in the logical table `Faltaré`.

`Faltaré` is resolved through the database registry spreadsheet from script property `db`. The value in the registry points to the spreadsheet that contains these physical sheets:

- `form_data`
- `absences`
- `recovery`
- `profes_guardia`

## Design

The old JSON fields in `form_data` are not part of the current normalized schema:

- `selected_schedule_items_json`
- `recovery_items_json`

The script may remove these legacy columns by header name during schema validation/migration if they are still present in an older sheet.

Selected schedule/class rows now live in `absences`.

Recovery date/time rows now live in `recovery`.

Both child sheets use `row_id` to relate back to the parent row in `form_data`.

`profes_guardia` is written by `control_panel`, not by `attendance_form`. It is documented here because it lives inside the same logical `Faltaré` spreadsheet.

## `form_data`

One row per submitted or updated absence request.

| Column | Header | Description |
| --- | --- | --- |
| A | `row_id` | Spreadsheet row number used as the registry/edit identifier. |
| B | `created_at` | Creation timestamp. Preserved on edit. |
| C | `updated_at` | Last update timestamp. |
| D | `adreca_electronica` | Signed-in user when Apps Script exposes it; may be blank/fallback-derived when hidden by Apps Script. |
| E | `absence_teacher_name` | Teacher selected in `Absència de`. |
| F | `absence_teacher_email` | Email for the selected teacher from `Dades de professors`. |
| G | `teacher_code` | Selected teacher `REDUIT` from `Dades de professors/Llista` column F. For substitute submissions, store the substitute's `REDUIT`; timetable lookup uses `Horaris -> schedule_cache.effective_teacher_code`. |
| H | `que_vols_fer` | Selected first-page action. |
| I | `professor_acompanyant` | `Sí` or `No`. Defaults to `No`. |
| J | `absence_date` | Selected absence date. |
| K | `multi_day` | `Sí` or `No`. Defaults to `No`. |
| L | `reincorporation_date` | Reincorporation date for multi-day absences. |
| M | `multi_day_student_work` | Student-work text for multi-day absences. |
| N | `motiu` | Selected absence reason. |
| O | `motiu_route` | `J-a` for ordinary hours, `J-b` for recovery hours. |
| P | `context` | Confidential context text. |
| Q | `hores` | Hidden hours value for `J-a`, auto-filled from checked grouped schedule rows by default and still submitted. |
| R | `hores_a_recuperar` | Recovery hour count for `J-b`, auto-filled from checked grouped schedule rows by default. |
| S | `permis_llicencia_absencia` | Selected permit/license/ordinary absence value. For `J-b`, the field is hidden and automatically saved as `Absència ordinària`. |
| T | `document_file_id` | Uploaded Drive file ID, if any. Preserved on edit when no new file is uploaded. |
| U | `document_file_url` | Uploaded Drive file URL, if any. Preserved on edit when no new file is uploaded. |
| V | `document_file_name` | Uploaded Drive file name, if any. Preserved on edit when no new file is uploaded. |
| W | `confirmation_ok` | `TRUE` when the mandatory confirmation is checked. |
| X | `status` | Initial value `submitted`; changed to `updated` when edited. |
| Y | `managed` | `TRUE` when the admin page marks the row as managed; empty/FALSE otherwise. |

## `absences`

One row per selected schedule/class item.

Rows are linked to `form_data` with `row_id`.

| Column | Header | Description |
| --- | --- | --- |
| A | `row_id` | Parent `form_data.row_id`. |
| B | `absence_item_id` | Stable child identifier, for example `row_id + "-" + index`. |
| C | `item_index` | 1-based order in the submitted selection. |
| D | `time` | Human-readable time derived from schedule slot, for example `08:00`. |
| E | `subject_code` | Subject code from `Horaris`. |
| F | `subject_name` | Subject name read from `Horaris -> schedule_cache.subject_full_name`. |
| G | `groups` | Comma-separated grouped class groups. |
| H | `classrooms` | Comma-separated classrooms from source schedule rows. |
| I | `schedule_row_ids` | Comma-separated source `Horaris -> schedule_cache.row_id` values included in this grouped item. |
| J | `student_work` | Text entered in `Feina per l'alumnat`. |
| K | `has_group` | `TRUE` if the grouped item had at least one group. |
| L | `created_at` | Child row creation timestamp. |
| M | `updated_at` | Child row last update timestamp. |
| N | `no_cover_required` | `TRUE` when the teacher marked the row as `No cal cobrir`; empty/FALSE otherwise. |

## `recovery`

One row per recovery date/time item.

Rows are linked to `form_data` with `row_id`.

| Column | Header | Description |
| --- | --- | --- |
| A | `row_id` | Parent `form_data.row_id`. |
| B | `recovery_item_id` | Stable child identifier, for example `row_id + "-" + index`. |
| C | `item_index` | 1-based order in the submitted recovery list. |
| D | `date` | Recovery date. |
| E | `time` | Recovery hour. |
| F | `created_at` | Child row creation timestamp. |
| G | `updated_at` | Child row last update timestamp. |

## `profes_guardia`

One row per saved guard-duty assignment from `control_panel`.

Rows can point either to a real absence row from `absences` or to one of the corridor duties created inside the control-panel popup.

| Column | Header | Description |
| --- | --- | --- |
| A | `assignment_id` | Stable assignment identifier. |
| B | `assignment_date` | Selected date, `yyyy-mm-dd`. |
| C | `weekday` | ISO weekday, Monday = `1`, Sunday = `7`. |
| D | `time` | Time slot, for example `08:00`. |
| E | `absence_id` | `absences.absence_item_id` for absence rows, or a corridor pseudo-id for corridor rows. |
| F | `assignment_type` | `absence`, `corridor_lower`, or `corridor_upper`. |
| G | `row_id` | Parent `form_data.row_id` for absence rows; blank for corridor rows. |
| H | `teacher_code` | Teacher assigned to the guard duty. May be the special non-teacher token `__NO_CAL_COBRIR__` when no substitution is required. |
| I | `source_teacher_code` | Original timetable owner from `Horaris -> schedule_cache.source_teacher_code`. For ordinary rows, usually the same as the effective/assigned teacher. |
| J | `source_teacher_name` | Original timetable owner full name from `Horaris -> schedule_cache.source_teacher_name`. |
| K | `effective_teacher_code` | Current/effective guard teacher from `Horaris -> schedule_cache.effective_teacher_code`. Normally the same value as `teacher_code`. |
| L | `effective_teacher_name` | Current/effective guard teacher full name from `Horaris -> schedule_cache.effective_teacher_name`. |
| M | `teacher_was_substituted` | Boolean copied from `Horaris -> schedule_cache.teacher_was_substituted`. |
| N | `created_at` | Creation timestamp. |
| O | `updated_at` | Last update timestamp. |

Corridor pseudo-ids:

- `corridor-lower:{date}:{time}`
- `corridor-upper:{date}:{time}`

## Write Rules

When creating a new absence:

1. Write the parent row to `form_data`.
2. Use its `row_id` to write selected schedule rows to `absences`.
3. Use its `row_id` to write recovery rows to `recovery`.

When updating an existing absence:

1. Update the parent row in `form_data`.
2. Delete or clear existing `absences` child rows for that `row_id`.
3. Rewrite the current selected schedule rows in `absences`.
4. Delete or clear existing `recovery` child rows for that `row_id`.
5. Rewrite the current recovery rows in `recovery`.

This replacement strategy is the default until historical child-row tracking is explicitly required.

When saving control-panel guard-duty assignments:

1. Delete existing `profes_guardia` rows for the selected `assignment_date` and `time`.
2. Write one row per nonempty guard assignment.
3. Use the explicit `profes_guardia` headers above.

`__NO_CAL_COBRIR__` is a special saved assignment value, not a real teacher code. It is allowed to appear in more than one row for the same slot and must not count as a duplicate teacher assignment.

For real teacher assignments, `profes_guardia` stores both source and effective teacher identity from `schedule_cache`. This allows guard-count fairness to treat an original teacher and the substitute currently covering that teacher's timetable as one continuity for the relevant weekday/time slot.
