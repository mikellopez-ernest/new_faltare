# Project Context

This workspace contains multiple Google Apps Script projects managed with `clasp`.

See `ARCHITECTURE.md` for repository layout, Git/clasp rules, database access rules, and template conventions.

## Scripts

| Local folder | Script name | Script ID |
| --- | --- | --- |
| `admin_page` | `admin_page` | `1EWDWro_-Ikve8k96BIaJpUjgbGsTeQdYXfSVs0qjt8CRgGFPDPqb7ta4` |
| `attendance_form` | `attendance_form` | `1RDz0A0yXf1R0CsDVbEqO_NbgJsTXxo2fAiGQrnhx9sr-So_H-MIAII-N` |
| `control_panel` | `control_panel` | `1NkdZpoaVwLeVKtlgSi3qPCLPgytFS666qcgrSf0JeJ-bBr9ofWc8D76U` |

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

```sh
cd control_panel
clasp push -f
```

The shared source PDF `avis_guardies.pdf` remains at the workspace root.

Local `.clasp.json` files are intentionally ignored by Git. Recreate them locally when connecting a clone to Apps Script.

## Current Database Shape

The logical table `Faltaré` is a spreadsheet with these physical sheets:

- `form_data`
- `absences`
- `recovery`
- `profes_guardia`

`form_data` is the parent table. `absences` and `recovery` are child tables linked by `row_id`. `profes_guardia` stores guard-duty teacher assignments created in `control_panel`.

The old JSON fields `selected_schedule_items_json` and `recovery_items_json` are not part of the current normalized model. `attendance_form`, `admin_page`, and `control_panel` logic must use the normalized sheets instead.

The logical table `Horaris` has a raw source sheet `GPU001` and a runtime cache sheet `schedule_cache`. New runtime schedule logic should read `schedule_cache`, using `effective_teacher_code` for the teacher currently covering a timetable row and `subject_full_name` for display. `GPU001` remains the source of truth used to rebuild the cache.

`attendance_form` and `control_panel` do not rebuild the cache. They trust the current `schedule_cache`; freshness is guaranteed by external daily rebuilds and rebuilds after leave-of-absence updates.

## Current Script Responsibilities

- `attendance_form`: teacher-facing form that creates/updates `Faltaré` parent and child rows.
- `admin_page`: administration table for reviewing `form_data` and marking rows as `managed`.
- `control_panel`: daily guard-duty table grouped by time slot, with preferred guard candidates from `recovery`, absence rows from `absences`, and saved substitutions in `profes_guardia`.
