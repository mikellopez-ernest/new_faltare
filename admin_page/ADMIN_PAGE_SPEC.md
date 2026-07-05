# Admin Page Spec

## Purpose

`admin_page` is an Apps Script web endpoint for reviewing rows submitted through `attendance_form`.

The endpoint uses the normalized `Faltaré` data model:

- `Faltaré` -> `form_data`
- `Faltaré` -> `absences`
- `Faltaré` -> `recovery`
- `Faltaré` -> `profes_guardia`
- `Dades de professors` -> `Llista`

The current visible table is built from `form_data` plus `Dades de professors -> Llista`. Future views that need selected classes, recovery dates, or guard-duty assignments must read `absences`, `recovery`, and `profes_guardia` directly.

Both logical tables must be resolved through the registry spreadsheet described in `PROJECT_CONTEXT.md` and `ARCHITECTURE.md`.

## Database Rules

The script must follow the shared database architecture exactly:

1. Read script property `db`.
2. Open the registry spreadsheet.
3. Read sheet `tables`.
4. Resolve logical table names to spreadsheet IDs.
5. Open each resolved spreadsheet by ID.
6. Open the configured physical sheet name for that logical table.

Column B in registry sheet `tables` is always a spreadsheet ID, never a sheet name.

## Required Tables

| Logical table | Sheet |
| --- | --- |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |
| `Dades de professors` | `Llista` |

`Faltaré -> form_data` contains:

| Column | Header |
| --- | --- |
| Y | `managed` |

`managed` is interpreted as boolean. Empty/FALSE/no/0 values mean not managed.

`Faltaré -> form_data` does not store these old JSON fields in the current normalized schema:

- `selected_schedule_items_json`
- `recovery_items_json`

Schedule/class rows live in `Faltaré -> absences`.

Recovery date/time rows live in `Faltaré -> recovery`.

Guard-duty assignments live in `Faltaré -> profes_guardia`.

`absences` and `recovery` relate to `form_data` with `row_id`. `profes_guardia` relates to absence/corridor assignment identifiers and stores the assigned guard teacher code.

## Data Loading

When the endpoint opens:

1. Server reads the full `Faltaré -> form_data` sheet.
2. Server reads the full `Dades de professors -> Llista` sheet.
3. Server maps teacher code from `form_data.teacher_code` to the full teacher name from `Llista`.
4. Client stores all returned parent rows in memory.
5. Filtering and sorting happen in the browser without re-reading the database.

For the current visible table, `admin_page` does not need to load `absences`, `recovery`, or `profes_guardia`. Any view that needs selected classes, recovery dates, or guard-duty assignments must read the normalized sheets directly instead of parsing JSON from `form_data`.

Teacher name resolution from `Dades de professors -> Llista`:

- Column C: name
- Column D: surname 1
- Column E: surname 2
- Column F: teacher code

Visible teacher value is `C D E`.

## Table Columns

The admin table must show:

| Column | Source / Rule |
| --- | --- |
| Select | Checkbox to select the row locally. |
| `Data absència` | `absence_date` |
| `Professor` | Resolve `teacher_code` through `Dades de professors -> Llista`; fallback to stored `absence_teacher_name`. |
| `Context` | `context` |
| `Multiday` | `multi_day` |
| `Recuperable?` | `Sí` when `motiu_route` is `J-b`; `No` when `motiu_route` is `J-a`. |
| `Hores` | `hores` for `J-a`; `hores_a_recuperar` for `J-b`. |
| `ATRI?` | `No` if `permis_llicencia_absencia` is `Absència ordinària`; `Sí` otherwise. |
| `Document` | Link from `document_file_url`. |

## Filters

Filters appear above the table.

### Gestionades

- Checkbox.
- Default: unchecked.
- When unchecked, show rows where `managed` is FALSE/empty.
- When checked, show rows where `managed` is TRUE.

### Recuperables

- Checkbox.
- Default: checked.
- When unchecked, hide rows where `motiu_route` is `J-b`.

### ATRI

- Checkbox.
- Default: checked.
- When unchecked, hide rows where `motiu_route` is `J-a`.

## Sorting

Clicking a table header sorts by that column.

- First click sorts ascending.
- Second click on the same header toggles descending.
- If no header sort is active, preserve database order.

Sorting is client-side and must not reload the database.

## Managed Action

Show a bottom action button:

`Gestionat`

Behavior:

- The button is disabled when no rows are checked.
- When clicked, send the selected spreadsheet row numbers to the server.
- Server writes `TRUE` in the `managed` column for each selected row in `Faltaré -> form_data`.
- The server must find the `managed` column by header name, not by hard-coded column number.
- After success, the client updates the in-memory rows as managed.
- Since `Gestionades` is unchecked by default, newly managed rows disappear from the default visible table.
