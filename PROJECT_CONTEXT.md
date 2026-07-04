# Project Context

This workspace contains multiple Google Apps Script projects managed with `clasp`.

See `ARCHITECTURE.md` for repository layout, Git/clasp rules, database access rules, and template conventions.

## Scripts

| Local folder | Script name | Script ID |
| --- | --- | --- |
| `admin_page` | `admin_page` | `1EWDWro_-Ikve8k96BIaJpUjgbGsTeQdYXfSVs0qjt8CRgGFPDPqb7ta4` |
| `attendance_form` | `attendance_form` | `1RDz0A0yXf1R0CsDVbEqO_NbgJsTXxo2fAiGQrnhx9sr-So_H-MIAII-N` |

Run `clasp` commands from the script folder you want to affect.

Examples:

```sh
cd admin_page
clasp push -f
```

```sh
cd attendance_form
clasp push -f
```

The shared source PDF `avis_guardies.pdf` remains at the workspace root.

Local `.clasp.json` files are intentionally ignored by Git. Recreate them locally when connecting a clone to Apps Script.
