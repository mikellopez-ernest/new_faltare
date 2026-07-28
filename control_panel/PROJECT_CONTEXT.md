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

The page shows a selected-day guard-duty control table.

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
- Teacher codes are translated through `Dades de professors -> Llista`.
- Active `Dades de professors -> leave_absence` rows are consumed through `Horaris -> schedule_cache`; the control panel does not recalculate leave substitution for normal schedule reads.
- The control panel trusts the existing cache and must not call `rebuildScheduleCache()` or trigger the cache rebuild endpoint.
- Clicking `Gestionar` opens a popup for the selected date/time, proposes guard teachers, allows editing through the header gear, and saves assignments to `Faltaré -> profes_guardia`.
- The saved `profes_guardia.teacher_code` value `__NO_CAL_COBRIR__` is a special non-teacher token and may appear more than once in the same time slot.
