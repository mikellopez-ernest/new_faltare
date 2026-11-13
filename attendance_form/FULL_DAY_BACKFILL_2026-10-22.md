# Full-day start and return time backfill — 2026-10-22

The one-time backfill populated `absence_start_time` and `return_time` for explicitly full-day, one-day records in `Faltaré -> form_data`.

- Rows scanned: 139.
- Eligible full-day records: 70.
- Updated: 68.
- Already correct: 2.
- Skipped eligible records: 0.
- Final read-only verification: all 70 correct, 0 pending changes.

The calculation used every timetable slot in `Horaris -> schedule_cache`, regardless of subject or group. The earliest slot supplies the start time; the slot immediately after the latest slot supplies the return time, with `21:30` after slot 12. Effective teacher codes matched first; historical original teachers missing from that identity matched their source teacher code.

Only the two time cells were written. Partial-day records, multi-day records, and unresolved legacy blank `full_day` values were excluded. Hours, child rows, metadata, and email notifications were untouched. Previous cell values were backed up in script properties named `full_day_times_2026_10_22_<row_id>`.

`FullDayBackfill.js` retains the private, editor-only preview and write methods. The temporary operator-only web runner was removed after verification. Future full-day form submissions and updates calculate the same boundaries on the server before saving.
