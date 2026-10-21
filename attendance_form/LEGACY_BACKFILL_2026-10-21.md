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
- Rows updated after duplicate IDs were corrected: 18
- Total rows reconstructed: 107
- Full-day rows reconstructed: 65
- Partial-day rows reconstructed: 42
- Rows deliberately left unchanged: 7
- Final verification preview: 7 blocked, 0 pending updates

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

## Corrected-ID follow-up

After the duplicate parent IDs were corrected, 18 additional records were reconstructed. Child foreign keys for the renamed `b` parents were also repaired: 22 `absences.row_id` values and 3 `recovery.row_id` values were relinked while preserving the child item IDs used by existing guard assignments.

| `row_id` | `absence_date` | `teacher_code` | `full_day` | `absence_start_time` | `return_time` | `hores` |
| --- | --- | --- | --- | --- | --- | --- |
| 22 | 2026-09-14 | AZNCAT | Sí | | | 4 |
| 22b | 2026-09-16 | MUCAS | No | 09:00 | 10:00 | 1 |
| 23 | 2026-09-14 | SANTEC | Sí | | | 3 |
| 23b | 2026-09-17 | ROMCAT | No | 09:00 | 15:00 | 5 |
| 24b | 2026-09-17 | SANTEC | Sí | | | 3 |
| 25 | 2026-09-15 | SANTEC | Sí | | | 8 |
| 25b | 2026-09-18 | SANTEC | Sí | | | 4 |
| 26 | 2026-09-15 | AZNCAT | Sí | | | 8 |
| 27 | 2026-09-16 | PASSOC | Sí | | | 6 |
| 27b | 2026-09-18 | IZQEXP | No | 09:00 | 11:30 | 2 |
| 28 | 2026-09-16 | ROMCAT | Sí | | | 5 |
| 28b | 2026-09-17 | TORSOC | Sí | | | 5 |
| 29 | 2026-09-16 | SANTEC | Sí | | | 6 |
| 29b | 2026-09-17 | SALEXP | Sí | | | 2 |
| 30b | 2026-09-17 | BORMAT | Sí | | | 3 |
| 102 | 2026-10-09 | GIMCOM | No | 18:30 | 19:30 | 1 |
| 103 | 2026-10-13 | VEIANG | Sí | | | 5 |
| 105 | 2026-10-16 | NOPFI | No | 12:30 | 13:30 | 1 |

## Rows left unchanged

These seven records still require manual evidence before they can be reconstructed safely.

| `row_id` | `absence_date` | `teacher_code` | Reason |
| --- | --- | --- | --- |
| 2 | 2026-09-04 | ROMCAT | No surviving absence child rows or legacy hour count. |
| 3 | 2026-09-07 | JOVEXP | No surviving absence child rows or legacy hour count. |
| 4 | 2026-09-15 | OSEVIP | Legacy count is 2, but the selected interval is unknown. |
| 24 | 2026-09-14 | ROMCAT | No surviving absence child rows or legacy hour count. |
| 40 | 2026-09-21 | MILINF | Saved `13:30 ROB` row is now assigned to `VAPRO`. |
| 74 | 2026-10-02 | MARCEX | Saved `10:00 BIO` row is now assigned to `DOEXP`. |
| 107 | 2026-10-13 | LOPINF | Saved `13:30 DIG` row currently has multiple possible owners. |
