# Control Panel Context

Script name: `control_panel`

Script ID: `1NkdZpoaVwLeVKtlgSi3qPCLPgytFS666qcgrSf0JeJ-bBr9ofWc8D76U`

This project is managed independently with `clasp` from the `control_panel/` folder.

The endpoint UI lives in `Index.html`.

Current behavior is specified in `CONTROL_PANEL_SPEC.md`.

## Database Architecture

The script property `db` must contain the spreadsheet ID of the database registry spreadsheet.

The registry spreadsheet must contain a sheet named `tables`:

| Column | Meaning |
| --- | --- |
| A | Logical table name |
| B | Spreadsheet ID where that logical table is stored |

Column B is always a spreadsheet ID, not a physical sheet name.

Configured sources:

| Logical table | Physical sheet or sheets |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Horaris` | `GPU001`, `schedule_cache` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

Keep logical table names separate from sheet names:

- Logical table names resolve spreadsheet IDs through the registry.
- Physical sheet names are configured in code.

`Dades de professors -> Llista` uses the updated schema:

- `REDUIT` is column F and is the code used by `form_data.teacher_code`, `Horaris -> schedule_cache.effective_teacher_code`, and real `profes_guardia.teacher_code` values.
- `ACTIU` is column N and must be used to filter active teachers.
- `SUBST?` is column P and is the only source for substitute status if substitute-specific logic is added.
- Names are built from columns C, D, and E.

## Current Behavior

The page is titled `Panell de guàrdies` and shows a selected-day guard-duty control table.

- The date filter defaults to today.
- The date filter has left/right arrow buttons to move one day backward or forward.
- Rows are grouped by the fixed schedule time slots.
- Each time slot starts with a green row and a `Gestionar` button.
- If matching recovery rows exist for that date/time, a yellow `Guàrdia preferent:` row appears immediately after the green row.
- Preferred recovery teacher names are indented below the `Guàrdia preferent:` label.
- Absence rows appear under the yellow row and are read from `Faltaré -> absences`.
- Absence rows whose subject is `GUARDIA` are displayed in the main table for visibility, but are not displayed as popup rows to cover; the absent teacher is still removed from guard-teacher candidates for that slot.
- Absence rows with `absences.no_cover_required = TRUE` default to `No cal cobrir` in the popup and do not consume a guard teacher.
- If a matching `form_data` parent row has no `absences` child rows, the page computes fallback visible rows from `Horaris -> schedule_cache`, using `effective_teacher_code` and `subject_full_name`.
- Multi-day `form_data` rows are active from `absence_date` until the day before `reincorporation_date`; the reincorporation date itself is excluded. They always use the selected weekday's `schedule_cache` rows rather than repeating day-one children, and display `multi_day_student_work` as the task text.
- Teacher codes are translated through `Dades de professors -> Llista`.
- Active `Dades de professors -> leave_absence` rows are consumed through `Horaris -> schedule_cache`; the control panel does not recalculate leave substitution for normal schedule reads.
- The control panel trusts the existing cache and must not call `rebuildScheduleCache()` or trigger the cache rebuild endpoint.
- Clicking `Gestionar` opens a popup for the selected date/time, proposes guard teachers, allows editing through the header gear, and saves assignments to `Faltaré -> profes_guardia`.
- Saved popup assignments can be reopened and changed at any time. In edit mode, `Desa` is blocked only by duplicate real-teacher assignments; empty rows are permitted, and historical saved teachers remain visible even if the live candidate pool has changed.
- A green check next to `Gestionar` means that date/time has saved rows in `profes_guardia`.
- A green check in the popup `Desat` column means that row assignment has been saved.
- After saving the popup, it closes and reloads the selected day so the main table immediately reflects the saved state.
- The saved `profes_guardia.teacher_code` value `__NO_CAL_COBRIR__` is a special non-teacher token and may appear more than once in the same time slot.
- `profes_guardia` also stores `source_teacher_code/name`, `effective_teacher_code/name`, and `teacher_was_substituted` from `schedule_cache`. Guard-count fairness uses the candidate's source/effective identity, so a leave substitute and the original timetable owner share the count history for the relevant weekday/time slot.
- Bootstrap, day loading, popup loading, and saving show a full-page disabled loading overlay.
- `notify_recovery()` is available for a daily trigger. It emails teachers in Catalan when they have recovery rows scheduled for the next day.
