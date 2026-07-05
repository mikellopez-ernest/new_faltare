# Faltaré Apps Script Workspace

Google Apps Script workspace managed with `clasp`.

This repo contains multiple Apps Script projects that are developed together but deployed independently.

## Scripts

| Folder | Script | Purpose |
| --- | --- | --- |
| `admin_page/` | `admin_page` | Administration endpoint for reviewing submitted absences. |
| `attendance_form/` | `attendance_form` | Teacher-facing absence and guard-duty form. |
| `control_panel/` | `control_panel` | Daily guard-duty control panel grouped by time slot. |

Current script IDs are documented in `PROJECT_CONTEXT.md`.

## Database Architecture

The apps use Google Sheets as the database through a registry spreadsheet.

Each script has a script property named `db`.

`db` contains the spreadsheet ID of the database registry spreadsheet. That registry spreadsheet has a sheet named `tables`:

| Column | Meaning |
| --- | --- |
| A | Logical table name |
| B | Spreadsheet ID where that logical table is stored |

Column B is always a spreadsheet ID, not a sheet name.

Each logical table lives in its own spreadsheet. The physical sheet name inside that spreadsheet is configured in code.

Current logical table mappings:

| Logical table | Sheet |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Horaris` | `GPU001` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

`Faltaré` uses a parent/child structure:

- `form_data`: main absence request row.
- `absences`: selected schedule/class rows linked to `form_data.row_id`.
- `recovery`: recovery date/time rows linked to `form_data.row_id`.
- `profes_guardia`: guard-duty assignments created by the control panel, linked to absence/corridor assignment IDs.

Schedule selections and recovery items must not be stored as JSON fields in `form_data`.

## Git Setup

`.clasp.json` files are intentionally ignored because they contain local Apps Script project binding details.

After cloning, recreate or restore each local clasp binding in the relevant script folder.

Example:

```sh
cd attendance_form
clasp clone SCRIPT_ID
```

or create the local `.clasp.json` manually if you already have the source files and only need to bind the folder.

Do commit:

- Apps Script source files
- `appsscript.json`
- HTML files
- specs and schema docs
- editable templates such as `attendance_form/EmailTemplates.js`

Do not commit:

- `.clasp.json`
- `.clasprc.json`
- temporary renders under `tmp/`
- local environment/editor files

## Development

Run `clasp` commands from the script folder you want to affect.

```sh
cd attendance_form
clasp push -f
clasp deploy -d "description"
```

```sh
cd admin_page
clasp push -f
clasp deploy -d "description"
```

```sh
cd control_panel
clasp push -f
clasp deploy -d "description"
```

## Docs

- `ARCHITECTURE.md`: shared architecture and scaling rules.
- `PROJECT_CONTEXT.md`: workspace-level script IDs and reminders.
- `attendance_form/ATTENDANCE_FORM_SPEC.md`: teacher form behavior.
- `attendance_form/FORM_DATA_SCHEMA.md`: submitted row schema.
- `admin_page/ADMIN_PAGE_SPEC.md`: admin endpoint behavior.
- `control_panel/CONTROL_PANEL_SPEC.md`: daily guard-duty control panel behavior.

## Deployment Notes

Deployed webapps are expected to run as the deployer/creator account and be accessible to the `@iernestlluch.cat` domain.

When adding new services, update `appsscript.json` OAuth scopes explicitly.
