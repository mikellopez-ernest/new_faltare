# Legacy one-day absence backfill - 2026-10-21

## Scope

- Processed only `multi_day = No` rows with `absence_date < 2026-10-21`.
- Reconstructed `full_day`, `absence_start_time`, `return_time`, and `hores` from `Faltaré -> absences` and `Horaris -> schedule_cache`.
- Used the teacher's actual weekday timetable to determine full-day coverage.
- Counted every timetable row in the reconstructed interval, including faded rows not stored in `absences`.

## Result

- Rows scanned: 138
- Eligible legacy one-day rows: 114
- Rows updated: 75
- Full-day rows reconstructed: 41
- Partial-day rows reconstructed: 34
- Rows deliberately left unchanged: 39
- Verification preview after apply: 75 unchanged, 0 pending updates

## Rows left unchanged

These records require manual evidence or data repair before they can be reconstructed safely.

### Duplicate parent `row_id` values (22 rows)

| `row_id` | `absence_date` | `teacher_code` |
| --- | --- | --- |
| 102 | 2026-09-04 | ROMCAT |
| 103 | 2026-09-07 | JOVEXP |
| 105 | 2026-09-15 | OSEVIP |
| 22 | 2026-09-14 | AZNCAT |
| 23 | 2026-09-14 | SANTEC |
| 24 | 2026-09-14 | ROMCAT |
| 25 | 2026-09-15 | SANTEC |
| 26 | 2026-09-15 | AZNCAT |
| 27 | 2026-09-16 | PASSOC |
| 28 | 2026-09-16 | ROMCAT |
| 29 | 2026-09-16 | SANTEC |
| 22 | 2026-09-16 | MUCAS |
| 23 | 2026-09-17 | ROMCAT |
| 24 | 2026-09-17 | SANTEC |
| 25 | 2026-09-18 | SANTEC |
| 27 | 2026-09-18 | IZQEXP |
| 28 | 2026-09-17 | TORSOC |
| 29 | 2026-09-17 | SALEXP |
| 30 | 2026-09-17 | BORMAT |
| 102 | 2026-10-09 | GIMCOM |
| 103 | 2026-10-13 | VEIANG |
| 105 | 2026-10-16 | NOPFI |

### Schedule not found in the current cache (14 rows)

| `row_id` | `absence_date` | `teacher_code` |
| --- | --- | --- |
| 5 | 2026-09-07 | VEIANG |
| 31 | 2026-09-17 | AZNCAT |
| 35 | 2026-09-21 | BORMAT |
| 43 | 2026-09-22 | QUVIP |
| 45 | 2026-09-30 | VEIANG |
| 48 | 2026-09-23 | GONCOM |
| 51 | 2026-09-24 | QUVIP |
| 57 | 2026-09-25 | QUVIP |
| 59 | 2026-09-25 | VEIANG |
| 63 | 2026-09-28 | QUVIP |
| 90 | 2026-10-07 | GONCOM |
| 109 | 2026-10-14 | VEIANG |
| 110 | 2026-10-15 | VEIANG |
| 111 | 2026-10-16 | VEIANG |

### Absence child no longer matches the current cache (3 rows)

| `row_id` | `absence_date` | `teacher_code` |
| --- | --- | --- |
| 40 | 2026-09-21 | MILINF |
| 74 | 2026-10-02 | MARCEX |
| 107 | 2026-10-13 | LOPINF |
