# Architecture

This workspace contains multiple Google Apps Script projects that are developed together but deployed independently with `clasp`.

## Folder Layout

Each script lives in its own top-level folder:

| Folder | Script | Purpose |
| --- | --- | --- |
| `admin_page/` | `admin_page` | Administration-facing script. |
| `attendance_form/` | `attendance_form` | Teacher-facing absence/guard-duty form. |

Future scripts should follow the same pattern:

```text
script_name/
  appsscript.json
  Código.js
  PROJECT_CONTEXT.md
  ...script-specific files...
```

Run `clasp` commands from the script folder you want to affect.

## Git And Clasp

The repo ignores `.clasp.json` files because they are local deployment identity/configuration files. To connect a fresh clone to an Apps Script project, create or restore the appropriate `.clasp.json` locally in that script folder.

Do commit:

- Apps Script source files (`.js`, `.html`, `appsscript.json`).
- Specs and schema documentation.
- Reusable templates such as `attendance_form/EmailTemplates.js`.

Do not commit:

- `.clasp.json` or `.clasprc.json`.
- Generated temporary files under `tmp/`.
- Local environment/editor files.

## Database Access Pattern

All scripts must use the registry-based database architecture:

1. Script property `db` contains the spreadsheet ID of the database registry spreadsheet.
2. The registry spreadsheet contains a sheet named `tables`.
3. Column A of `tables` is the logical table name.
4. Column B of `tables` is the spreadsheet ID where that logical table is stored.
5. Each logical table spreadsheet contains a physical sheet whose name is configured in code.

Important: column B is always a spreadsheet ID, not a sheet name.

Current logical table mappings:

| Logical table | Physical sheet |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Horaris` | `GPU001` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data` |

## Template Pattern

User-facing text that will be edited often should live outside the main algorithm file.

For `attendance_form`, confirmation email content lives in:

- `attendance_form/EmailTemplates.js`

Templates use `{{TAG_NAME}}` placeholders. `Código.js` is responsible for building the tag values from database/submission data and rendering the template before sending.

## Scaling Rules

- Keep script-specific business logic inside that script folder.
- Keep frequently edited text/templates in separate files.
- Keep schema and behavior decisions documented beside the script that owns them.
- Avoid sharing local clasp configuration through Git; document script IDs in context files instead.
