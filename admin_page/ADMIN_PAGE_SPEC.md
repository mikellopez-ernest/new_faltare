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

## Access Control

The admin endpoint is protected by role-based access control.

Deployment remains domain-restricted:

- `executeAs`: `USER_DEPLOYING`
- `access`: `DOMAIN`

This blocks non-domain users at the Apps Script deployment level, while the script performs its own allow-list check for users inside `@iernestlluch.cat`.

The script property `access_granted` must contain a comma-separated list of allowed direct institutional emails and/or role names.

Examples:

- `mikellopez@iernestlluch.cat`
- `Coord. 3ESO`
- `Coord. 3ESO,COCOBE,mikellopez@iernestlluch.cat`

Entries containing `@` are treated as direct allowed emails.

Entries without `@` are treated as role/càrrec names and are resolved through `Càrrega lectiva`.

Role resolution:

1. Resolve logical table `Càrrega lectiva` through the shared `db` registry.
2. Open physical sheet `carrecs`.
3. Match `access_granted` role names against `carrecs` column A.
4. Read assigned people from `carrecs` column D.
5. Open physical sheet `professors`.
6. Match assigned people against `professors` column Q.
7. Read institutional email from `professors` column L.
8. Allow access only when `Session.getActiveUser().getEmail()` matches one of the direct or resolved emails.

Role and person matching is normalized for case and accents. Direct email comparison is lower-cased.

If the active user cannot be identified, `access_granted` is missing, or the user is not allowed, `doGet()` returns an `Accés no autoritzat` page instead of the admin interface.

Every browser-callable server method must call `assertUserAccess_()` before reading or writing data. Current protected methods:

- `getAdminPageData()`
- `getAdminRecord(rowId)`
- `saveAdminRecord(payload)`
- `markRowsManaged(rowIds)`

The script also exposes `grantRequiredPermissions()` as a manual helper to trigger authorization prompts for the required access-control reads.

## Required Tables

The main admin table reads `Faltaré -> form_data` and `Dades de professors -> Llista`. The record-detail modal also reads and writes `Faltaré -> recovery`.

The normalized `Faltaré` child sheets are part of the same logical data model and must be used by future admin views that need child-row detail:

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

`absences` and `recovery` relate to `form_data` with `row_id`. `profes_guardia` relates to absence/corridor assignment identifiers and stores the assigned guard teacher code plus source/effective teacher identity from `Horaris -> schedule_cache`.

## Data Loading

When the endpoint opens:

1. Server reads the full `Faltaré -> form_data` sheet.
2. Server reads the full `Dades de professors -> Llista` sheet.
3. Server maps teacher code from `form_data.teacher_code` to the full teacher name from `Llista`.
4. Client stores all returned parent rows in memory.
5. Filtering and sorting happen in the browser without re-reading the database.

The main table does not preload child sheets. When a row is opened, the server reads only the related `recovery` rows by stable `row_id`. The admin page does not parse legacy JSON fields.

Teacher name resolution from `Dades de professors -> Llista`:

- Column C: name
- Column D: surname 1
- Column E: surname 2
- Column F: `REDUIT`, the teacher code stored in `form_data.teacher_code`
- Column L: `CORREU`, teacher email if needed

Visible teacher value is `C D E`.

Do not filter `Dades de professors` rows by `ACTIU` in this admin view. Historical submitted rows should continue to resolve names even if the teacher later becomes inactive.

## Table Columns

The admin table must show:

| Column | Source / Rule |
| --- | --- |
| Select | Checkbox to select the row locally. |
| `Data absència` | `absence_date` |
| `Professor` | Resolve `teacher_code` through `Dades de professors -> Llista`; fallback to stored `absence_teacher_name`. |
| `Motiu` | `motiu` (column N in the normalized schema). |
| `Context` | `context` |
| `Recuperable?` | `Sí` when `motiu_route` is `J-b`; `No` when `motiu_route` is `J-a`. |
| `Hores` | `hores` for `J-a`; `hores_a_recuperar` for `J-b`. |
| `ATRI?` | `No` if `permis_llicencia_absencia` is `Absència ordinària`; `Sí` otherwise. |
| `Document` | Link from `document_file_url`. |

## Filters

Filters appear above the table.

### Professor

- Text input.
- Case-insensitive and accent-insensitive partial match against the resolved teacher name.
- Filtering is client-side and updates while typing.

### Data

- Custom Catalan calendar picker.
- Displays dates as `dd/mm/yyyy`.
- Week starts on Monday and weekday labels are Catalan (`Dl` through `Dg`).
- Matches `form_data.absence_date` exactly after normalizing the stored date.

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
- When clicked, send the selected stable `row_id` values to the server.
- Server resolves each physical spreadsheet row from `row_id` immediately before writing.
- Server writes `TRUE` in the `managed` column for each selected row in `Faltaré -> form_data`.
- The server must find the `managed` column by header name, not by hard-coded column number.
- After success, the client updates the in-memory rows as managed.
- Since `Gestionades` is unchecked by default, newly managed rows disappear from the default visible table.

## Record Detail And Editing

Every main-table row is clickable, except its selection checkbox and document link.

Clicking a row opens a modal that:

- Loads the parent from `Faltaré -> form_data` by stable `row_id`.
- Shows only the operational `form_data` fields listed below.
- Shows the related `Faltaré -> recovery` rows ordered by `item_index`.
- Provides an `Edita` action.

The popup must not display these fields:

- `row_id`
- `adreca_electronica`
- `absence_teacher_email`
- `teacher_code`
- `que_vols_fer`
- `multi_day_student_work`
- `motiu_route`
- `document_file_id`
- `document_file_name`
- `confirmation_ok`
- `status`
- `managed`

The popup displays `created_at`, `updated_at`, `absence_teacher_name`, `professor_acompanyant`, `absence_date`, `multi_day`, `reincorporation_date`, `motiu`, `context`, `hores`, `hores_a_recuperar`, `permis_llicencia_absencia`, and `document_file_url`.

`motiu` is a select, not free text. Its options must match the complete `REASONS` catalogue in `attendance_form/Código.js`. The current saved value remains visible if a historical record contains a reason that is no longer in the catalogue. On save, the server validates the selected reason and derives the hidden `motiu_route` from the catalogue (`J-a` or `J-b`).

In edit mode, all displayed business fields can be changed. `created_at` and `updated_at` are protected system metadata. `updated_at` is refreshed automatically on save. Hidden fields are preserved, except `motiu_route`, which is synchronized from the selected `motiu`.

Recovery rows can be added, edited, or removed. Dates are saved as `yyyy-mm-dd`, times as canonical `HH:mm`, and the server rejects incomplete or invalid recovery rows.

Saving runs under a script lock. The server updates the parent row found by stable `row_id`, deletes that parent's existing `recovery` rows, and writes the edited recovery list with regenerated item indexes and child IDs.
