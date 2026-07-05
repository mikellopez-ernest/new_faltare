# Project Context

## Google Apps Script

This project is the `admin_page` Google Apps Script project managed with `clasp`.

- Script name: `admin_page`
- Script ID: `1EWDWro_-Ikve8k96BIaJpUjgbGsTeQdYXfSVs0qjt8CRgGFPDPqb7ta4`
- Local clasp config: `.clasp.json`
- Runtime: V8
- Time zone: `Europe/Madrid`

The endpoint UI lives in `Index.html`.

## Database Architecture

The app uses Google Spreadsheets as its database, but it does not store all tables in one spreadsheet.

There is a script property named `db`.

The value of script property `db` is the spreadsheet ID of a database registry spreadsheet.

Inside that registry spreadsheet, there is a sheet named `tables`.

The `tables` sheet is only a table registry:

- Column A contains the logical database/table name.
- Column B contains the spreadsheet ID where that logical table is stored.

Column B is always another spreadsheet ID. It is not a sheet ID and not a sheet name.

Each logical table lives in its own spreadsheet. The sheet name inside that table spreadsheet is configured in code with `TABLE_SHEETS`.

Data resolution must follow this exact flow:

1. Read script property `db`.
2. Open the registry spreadsheet using that ID.
3. Open sheet `tables`.
4. Read column A and column B.
5. Build a registry map where the key is the logical table name and the value is the table spreadsheet ID.
6. Define required logical tables in code with `TABLE_NAMES`.
7. Define physical sheet names in code with `TABLE_SHEETS`.
8. For each required logical table, look up its spreadsheet ID in the registry map.
9. Open the resolved table spreadsheet by ID.
10. Open the configured sheet name inside that table spreadsheet.
11. Load data from that sheet.

Do not assume the registry spreadsheet contains actual table data. It only contains the registry.

Keep logical table names separate from physical sheet names:

- Logical table names are used to look up spreadsheet IDs in the registry.
- Sheet names are configured in code with `TABLE_SHEETS`.
- Data is loaded from the configured sheet inside the resolved table spreadsheet.

Core constants and helpers live in `Código.js`:

- `SCRIPT_PROP_DB`
- `TABLES_SHEET_NAME`
- `TABLE_NAMES`
- `TABLE_SHEETS`
- `getDatabaseSpreadsheetId_()`
- `loadTableRegistry_()`
- `openTableSheet_(tableRegistry, tableName)`
- `loadTableValues_(tableRegistry, tableName)`
- `loadConfiguredTables_()`

Admin page behavior is specified in `ADMIN_PAGE_SPEC.md`.

## Configured Tables

The script currently requires these logical tables from the registry:

| Logical table name | Sheet name inside resolved spreadsheet |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Càrrega lectiva` | `assignatures` |
| `Horaris` | `GPU001` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

`Faltaré` storage is normalized:

- `form_data`: parent absence request rows.
- `absences`: selected schedule/class child rows linked by `row_id`.
- `recovery`: recovery date/time child rows linked by `row_id`.
- `profes_guardia`: guard-duty teacher assignments created by `control_panel`.

`Faltaré -> form_data` includes column Y named `managed`, used by the admin filter `Gestionades`.

Do not read selected schedules or recovery items from JSON fields in `form_data`; those fields are legacy and not part of the current normalized model.
