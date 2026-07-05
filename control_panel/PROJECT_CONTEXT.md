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
| `Horaris` | `GPU001` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

Keep logical table names separate from sheet names:

- Logical table names resolve spreadsheet IDs through the registry.
- Physical sheet names are configured in code.

## Current Behavior

The page shows a selected-day guard-duty control table.

- The date filter defaults to today.
- The date filter has left/right arrow buttons to move one day backward or forward.
- Rows are grouped by the fixed schedule time slots.
- Each time slot starts with a green row and a `Gestionar` button.
- If matching recovery rows exist for that date/time, a yellow `Guàrdia preferent:` row appears immediately after the green row.
- Absence rows appear under the yellow row and are read from `Faltaré -> absences`.
- Absence rows with `absences.no_cover_required = TRUE` default to `No cal cobrir` in the popup and do not consume a guard teacher.
- If a matching `form_data` parent row has no `absences` child rows, the page computes fallback visible rows from `Horaris -> GPU001` and subject names from `Càrrega lectiva -> assignatures`.
- Teacher codes are translated through `Dades de professors -> Llista`.
- Clicking `Gestionar` opens a popup for the selected date/time, proposes guard teachers, allows editing through the header gear, and saves assignments to `Faltaré -> profes_guardia`.
- The saved `profes_guardia.teacher_code` value `__NO_CAL_COBRIR__` is a special non-teacher token and may appear more than once in the same time slot.
