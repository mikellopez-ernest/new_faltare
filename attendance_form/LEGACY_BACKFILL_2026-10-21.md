# Legacy one-day absence backfill - 2026-10-21

## Scope

- Processed only `multi_day = No` rows with `absence_date < 2026-10-21`.
- Reconstructed `full_day`, `absence_start_time`, `return_time`, and `hores` from `Faltaré -> absences` and `Horaris -> schedule_cache`.
- Used the teacher's actual weekday timetable to determine full-day coverage.
- Counted every timetable row in the reconstructed interval, including faded rows not stored in `absences`.

## Result

- Rows scanned: 138
- Eligible legacy one-day rows: 114
- Rows updated in the initial pass: 75
- Rows updated from substitute schedules in the follow-up pass: 14
- Total rows reconstructed: 89
- Full-day rows reconstructed: 52
- Partial-day rows reconstructed: 37
- Rows deliberately left unchanged: 25
- Follow-up verification preview after apply: 14 unchanged, 0 pending updates

## Substitute-schedule follow-up

The 14 records whose teacher was no longer directly present in the current cache were reconstructed from the timetable retained under the leave substitute's effective identity. The two `GONCOM` rows use the confirmed Wednesday `VAPRO` timetable, including faded management rows in `hores`.

| `row_id` | `absence_date` | `teacher_code` | `full_day` | `absence_start_time` | `return_time` | `hores` |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 2026-09-07 | VEIANG | Sí | | | 5 |
| 31 | 2026-09-17 | AZNCAT | No | 11:30 | 15:00 | 3 |
| 35 | 2026-09-21 | BORMAT | Sí | | | 5 |
| 43 | 2026-09-22 | QUVIP | Sí | | | 4 |
| 45 | 2026-09-30 | VEIANG | No | 09:00 | 12:30 | 3 |
| 48 | 2026-09-23 | GONCOM | Sí | | | 5 |
| 51 | 2026-09-24 | QUVIP | Sí | | | 3 |
| 57 | 2026-09-25 | QUVIP | Sí | | | 1 |
| 59 | 2026-09-25 | VEIANG | No | 09:00 | 13:30 | 4 |
| 63 | 2026-09-28 | QUVIP | Sí | | | 4 |
| 90 | 2026-10-07 | GONCOM | Sí | | | 5 |
| 109 | 2026-10-14 | VEIANG | Sí | | | 4 |
| 110 | 2026-10-15 | VEIANG | Sí | | | 5 |
| 111 | 2026-10-16 | VEIANG | Sí | | | 5 |

## Rows left unchanged

These 25 records still require manual evidence or data repair before they can be reconstructed safely.

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

### Absence child no longer matches the current cache (3 rows)

| `row_id` | `absence_date` | `teacher_code` |
| --- | --- | --- |
| 40 | 2026-09-21 | MILINF |
| 74 | 2026-10-02 | MARCEX |
| 107 | 2026-10-13 | LOPINF |
