# Control Panel Spec

`control_panel` is the third Google Apps Script project in this workspace.

Script ID:

`1NkdZpoaVwLeVKtlgSi3qPCLPgytFS666qcgrSf0JeJ-bBr9ofWc8D76U`

## Scope

The endpoint title is `Panell de guàrdies` and it shows a daily control table for guard-duty management.

The first filter is a date picker. It defaults to today and reloads the table when changed.

The date picker must use the same Monday-first behavior as the teacher form:

- Week starts on Monday.
- Weekday labels are `Dl`, `Dt`, `Dc`, `Dj`, `Dv`, `Ds`, `Dg`.
- The submitted value is stored as `yyyy-mm-dd`.
- There is one arrow button on the left of the date to move to the previous day.
- There is one arrow button on the right of the date to move to the next day.
- Clicking either arrow updates the date value and reloads the table.

The endpoint has a `Gestionar` button for each time slot. Clicking it opens a management popup for that selected date and time.

Current implementation status:

- The popup opens.
- Rows and corridor rows are rendered.
- Guard teachers are proposed automatically.
- The header gear enables in-popup editing with dropdowns.
- The `Desa` button persists assignments to `Faltaré -> profes_guardia`.
- Time slots with saved assignments show a green check next to the `Gestionar` button.
- Saved popup assignments show a green check in the popup `DESAT` column.
- Bootstrap loading, day loading, popup loading, and saving show a full-page disabled overlay with a moving loading icon and a short action description.

## Database Sources

All data access must resolve through the script property `db` and the registry spreadsheet sheet `tables`.

Configured logical tables:

| Logical table | Physical sheet or sheets |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Horaris` | `GPU001`, `schedule_cache` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

`Faltaré` is one logical spreadsheet with multiple sheets. The registry maps only the logical table name `Faltaré` to a spreadsheet ID; the physical sheet names are configured in code.

Column B in the registry sheet is always another spreadsheet ID, never a sheet name.

### `Dades de professors -> Llista` Structure

`control_panel` must use the updated `Dades de professors` structure.

Relevant columns:

| Column | Header | Meaning |
| --- | --- | --- |
| A | `ESP` | Original teacher code. |
| C | `NOM` | Name. |
| D | `COGNOM1` | First surname. |
| E | `COGNOM2` | Second surname. |
| F | `REDUIT` | Short teacher code used by `form_data.teacher_code`, `Horaris -> schedule_cache.effective_teacher_code`, and `profes_guardia.teacher_code`. |
| N | `ACTIU` | Active boolean. |
| P | `SUBST?` | Substitute boolean. |

Boolean handling:

- Read both real boolean `true` and string `TRUE` as true.
- Active teacher filtering must use `ACTIU` column N.
- Substitute status, if needed by future control-panel logic, must use `SUBST?` column P and not `SITUACIO`.

Teacher display names use columns C, D, and E: `NOM COGNOM1 COGNOM2`.

Teacher lookup keys:

- `form_data.teacher_code` stores the selected teacher's `REDUIT`, including substitute submissions.
- Runtime `Horaris -> schedule_cache.effective_teacher_code` values are matched to `REDUIT`.
- `profes_guardia.teacher_code` stores assigned teacher `REDUIT`, except the special non-teacher token `__NO_CAL_COBRIR__`.

`Dades de professors` also contains `leave_absence`.

For schedule cache generation outside this script:

- `leave_absence.teacher_code` identifies the original teacher on leave.
- `leave_absence.substitute_code` identifies the substitute teacher by `REDUIT`.
- A leave row is active when the selected control-panel date is between `start_date` and `end_date`, inclusive.
- Blank `end_date` means the leave is still active.
- `Horaris -> schedule_cache` must already apply these rules. `control_panel` consumes the resulting `effective_teacher_code` and does not recalculate leave substitutions during normal loads.
- `control_panel` trusts the existing cache. It must not call `rebuildScheduleCache()` and must not call the cache rebuild web endpoint.
- Cache freshness is handled outside this script by daily rebuilds and rebuilds after leave-of-absence changes.

## Data Loading

For a selected date, the endpoint loads:

- `Faltaré -> form_data`
- `Faltaré -> absences`
- `Faltaré -> recovery`
- `Faltaré -> profes_guardia`
- `Dades de professors -> Llista`
- `Horaris -> schedule_cache`

Primary absence rows come from `Faltaré -> absences`.

Date coverage rules:

- A one-day parent matches only `form_data.absence_date`.
- A multi-day parent (`multi_day = Sí`) matches `absence_date` and every later date strictly before `reincorporation_date`.
- `reincorporation_date` is the first day back at work and is therefore excluded from the absence interval.
- Weekends within that interval remain covered dates, but normally produce no visible rows because `schedule_cache` contains weekday timetable rows only.
- Multi-day parents are rendered from the selected date's `Horaris -> schedule_cache` timetable instead of repeating any day-one `absences` child rows.
- Multi-day fallback rows use `form_data.multi_day_student_work` as their task text.

The endpoint reads `schedule_cache` as-is. It does not rebuild or refresh the cache during page load, popup load, or save.

## Blocking Loading State

When the app is waiting for a server operation, the page must be visually blocked:

- show a full-page translucent overlay,
- show a moving loading spinner in the center,
- show a short description below the spinner, such as `Carregant dades...`, `Carregant guàrdia...`, or `Desant assignacions...`,
- disable visible controls until the operation finishes.

The blocking state applies at least to:

- initial bootstrap load,
- selected-day reload,
- management popup load,
- assignment save.

## Recovery Notifications

The script exposes a trigger-ready function named `notify_recovery()`.

Expected usage:

- configure a daily Apps Script time trigger manually,
- the function checks tomorrow's date in the script timezone,
- it reads `Faltaré -> recovery`,
- it joins each recovery row to `Faltaré -> form_data` by `row_id`,
- it groups recovery reminders by `form_data.absence_teacher_email`,
- it sends one Catalan email per teacher.

The email reminds the teacher that the next day they set a class recovery, including the date and hour for each recovery item.

The function must not modify database rows.

Fallback rule:

- If a one-day `form_data` parent row matches the selected date but has no child rows in `Faltaré -> absences`, the endpoint computes visible rows from `Horaris -> schedule_cache`.
- Every matching multi-day parent uses this timetable fallback for each covered date, even if legacy child rows exist.
- The fallback uses the parent `teacher_code`, the selected absence date weekday, `schedule_cache.effective_teacher_code`, `schedule_cache.subject_full_name`, and the schedule slot mapping.
- This keeps existing or partially migrated parent rows visible without changing the normalized storage rule.
- For substitute submissions, `form_data.teacher_code` stores the substitute's `REDUIT`; fallback works as long as the cache has been rebuilt with that substitute as `effective_teacher_code`.

## Helper Contract

- `getDatabaseSpreadsheetId_()` reads the script property `db`.
- `loadTableRegistry_()` reads the registry spreadsheet sheet `tables`.
- `openConfiguredTableSheet_()` opens one of the single-sheet logical tables.
- `openFaltareSheet_()` opens a configured sheet inside the `Faltaré` spreadsheet.
- `getControlPanelDayData()` loads the selected day and returns grouped time-slot data for the page.

## Daily Table

Columns:

- `FRANJA HORÀRIA`
- `PROFESSOR ABSENT`
- `ASSIGNATURA`
- `GRUP`
- `AULA`
- `GESTIONAR`

Rows are grouped by fixed time slots, always in this order:

1. `08:00`
2. `09:00`
3. `10:00`
4. `11:30`
5. `12:30`
6. `13:30`
7. `15:00`
8. `16:00`
9. `17:00`
10. `18:30`
11. `19:30`
12. `20:30`

For every time slot:

1. Show a green separator row with the time. The data cells are visually merged, and the final column contains a `Gestionar` button.
2. If `Faltaré -> profes_guardia` has saved rows for that date/time, show a green saved-check icon next to `Gestionar`.
3. Immediately under the green row, show a yellow `Guàrdia preferent:` row if there are matching recovery rows for the selected date/time.
4. Under the yellow row, show the absence rows for that date/time.

If a time slot has no recovery candidates and no absences, it still shows the green time row.

One-day absence rows are read from `Faltaré -> absences` when child rows exist. `Horaris -> schedule_cache` is used for matching one-day parents without children and for every matching multi-day parent. Multi-day coverage includes `absence_date` and excludes `reincorporation_date`.

If an absence row represents a `GUARDIA` slot, it must be displayed in the main daily absence table so staff can see that the teacher is absent. It must not be displayed in the management popup as a row that needs coverage. The absent teacher is still unavailable for substitutions at that slot and must be excluded from the guard-teacher dropdown candidate pool.

Absent teacher names are resolved by joining:

`absences.row_id -> form_data.row_id -> form_data.teacher_code -> Dades de professors/Llista column F (REDUIT)`

The displayed teacher name uses:

`Dades de professors/Llista columns C + D + E`

Recovery candidates are resolved by joining:

`recovery.row_id -> form_data.row_id -> form_data.teacher_code -> Dades de professors/Llista column F (REDUIT)`

Recovery teachers are shown as unique teacher names, one per line, under the text `Guàrdia preferent:`. Each preferred recovery teacher name in the yellow row should be visually indented under that title.

For the management popup, recovery teachers matching the selected date/time must also be added to the guard-teacher dropdown candidate pool even if they do not have a `GUARDIA` timetable row at that slot.

Recovery teachers are preferred candidates for that exact date/time. They are proposed before ordinary `GUARDIA` candidates and therefore receive the first automatic assignments, unless the row is `No cal cobrir`.

## Gestionar Popup

Clicking `Gestionar` for a time slot opens a modal/popup window for:

- the currently selected date, and
- the time slot of the clicked green row.

The popup contains only the absence rows matching that date and time.

### Popup Columns

The popup table shows:

| Column | Source / Behavior |
| --- | --- |
| `PROFESSOR ABSENT` | Full absent-teacher name from `form_data.teacher_code -> Dades de professors/Llista`. |
| `ASSIGNATURA` | Subject from `Faltaré -> absences`. |
| `GRUP` | Group from `Faltaré -> absences`. |
| `AULA` | Classroom from `Faltaré -> absences`. |
| `TASQUES` | Student work from `Faltaré -> absences.student_work`. |
| `GUÀRDIA` | Proposed or manually selected teacher who will substitute the absent teacher. |
| `DESAT` | Green saved-check icon when that popup row already has a saved assignment in `Faltaré -> profes_guardia`. |

If an absence row has `Faltaré -> absences.no_cover_required` set to `TRUE`, its `GUÀRDIA` value defaults to `No cal cobrir`.

The popup does not show a gear icon in each row.

The popup header shows one compact gear icon button in the upper area. That top-level gear button enables editing of the `GUÀRDIA` assignments for the whole popup.

### Additional Corridor Rows

Besides the absence rows, the popup always includes two extra rows:

1. `Passadissos pis inferior i lavabos`
2. `Passadissos pis superior i lavabos`

For these rows:

- The cells for `ASSIGNATURA`, `GRUP`, `AULA`, and `TASQUES` are merged.
- The merged cell contains the corridor text.
- The row still has a `GUÀRDIA` teacher cell.
- The `PROFESSOR ABSENT` cell is blank.

### Popup Row Priority

Before assigning proposed guard teachers, popup rows must be ordered by substitution priority:

1. ESO absence rows, ordered from `1` to `4`.
2. `Passadissos pis inferior i lavabos`.
3. Other absence rows, for example BAT, PFI, and other non-ESO groups.
4. `Passadissos pis superior i lavabos`.

The group priority is inferred from the `GRUP` value:

- ESO groups sort first when their group starts with `1`, `2`, `3`, or `4`.
- Other groups sort after the lower-corridor row.
- If a row has multiple groups, use the highest-priority group contained in the comma-separated list.

Within the same priority block, preserve the visible order from the main time-slot data unless a later rule requires a more specific sort.

## Guard Teacher Candidate Pool

For a selected date and time, the available guard-teacher pool is built from `Horaris -> schedule_cache`.

A teacher is eligible for the pool when:

- the cache row matches the selected weekday,
- the cache row matches the selected time slot,
- the cache row subject code or `subject_full_name` is `GUARDIA`,
- `effective_teacher_code` matches an active teacher in `Dades de professors/Llista`,
- their `Dades de professors/Llista` row is active (`ACTIU` column N true).

Teacher names are resolved through `Dades de professors -> Llista`.

If that `GUARDIA` timetable row belongs to an original teacher currently covered by an active leave, the cache should expose the substitute in `effective_teacher_code`. The eligible candidate is therefore the effective teacher, not the source/original teacher.

If a teacher is absent at the same date/time, they must not be proposed as a guard teacher for another row.

Each candidate must carry the source/effective identity from `schedule_cache`:

- `source_teacher_code`
- `source_teacher_name`
- `effective_teacher_code`
- `effective_teacher_name`
- `teacher_was_substituted`

For normal non-substituted rows, source and effective values are the same. For leave substitutions, source identifies the original timetable owner and effective identifies the current substitute.

## Guard Teacher Proposal Order

The popup proposes guard teachers automatically.

For the selected weekday and time slot, order eligible guard teachers by:

1. Fewest previous substitutions in `Faltaré -> profes_guardia` for that same weekday and time slot, using the fairness identity rule below.
2. If tied, the teacher whose last previous substitution is oldest.
3. If still tied, first surname initial, A-Z.

The first proposed teacher is assigned to the first popup row by substitution priority, the second teacher to the second row, and so on.

Rows marked `No cal cobrir` by the teacher are skipped when automatically consuming proposed guard teachers.

If there are more rows to cover than eligible teachers, the remaining rows have an empty `GUÀRDIA` value.

## Manual Guard Teacher Editing

Clicking the popup header gear icon changes the popup into assignment edit mode.

In edit mode, each `GUÀRDIA` text cell becomes a dropdown combo.

Each dropdown contains `No cal cobrir` as the first option, followed by an empty `Sense assignar` option, followed by the eligible guard-teacher pool for that date/time.

Teacher options must show the number of previous substitutions for the same weekday and time slot next to the teacher name, for example `Mikel López Villarroya (7)`.

The number in parentheses uses the same fairness identity rule as automatic ordering.

Preferred recovery teachers should be visually identified in the option text, for example `Guàrdia preferent: Mikel López Villarroya (7)`.

Rules:

- `No cal cobrir` is not a teacher assignment and can be selected in more than one row.
- A teacher can only appear in one popup row at a time.
- If a user selects a teacher who is already assigned to another row, both row assignments are swapped so no teacher is duplicated.
- A row with an empty `GUÀRDIA` value is visually marked as incomplete.
- The popup cannot be saved while any selected/proposed teacher has no row or any required row has no teacher, except when there are not enough eligible guard teachers.
- Rows with `No cal cobrir` do not require a teacher and do not consume an eligible guard teacher.

When there are not enough eligible guard teachers:

- It is valid for some rows to remain empty.
- It is not valid for an eligible guard teacher to be unassigned while an empty row still exists.
- The save rule is therefore: every eligible guard teacher must be placed somewhere, and no teacher may be duplicated.

Saving replaces all existing `profes_guardia` rows for the selected date and time with the popup's current nonempty assignments. After a successful save, the popup closes and the selected day reloads so the main table immediately shows the saved-check state.

When `No cal cobrir` is saved, `profes_guardia.teacher_code` stores the special token `__NO_CAL_COBRIR__`.

When a real teacher is saved, the row must also persist the candidate's source/effective identity from `schedule_cache`. This lets future counts know that, for example, Alba made the assignment while covering Gemma's timetable.

When a popup row has a saved real teacher assignment, the popup shows a green saved-check icon in the dedicated `DESAT` column. If the user changes the assignment in edit mode, the row is considered unsaved until `Desa` succeeds again.

## `profes_guardia` Sheet

`profes_guardia` lives inside the logical table `Faltaré`.

The user described the minimum persisted data as:

- absence id
- teacher code

To support corridor rows and the ordering rules, the implementation should use the following explicit schema unless changed before development:

| Column | Header | Description |
| --- | --- | --- |
| A | `assignment_id` | Stable assignment identifier. |
| B | `assignment_date` | Selected date, `yyyy-mm-dd`. |
| C | `weekday` | ISO weekday, Monday = `1`, Sunday = `7`. |
| D | `time` | Time slot, for example `08:00`. |
| E | `absence_id` | `absences.absence_item_id` for absence rows, or a corridor pseudo-id for corridor rows. |
| F | `assignment_type` | `absence`, `corridor_lower`, or `corridor_upper`. |
| G | `row_id` | Parent `form_data.row_id` for absence rows; blank for corridor rows. |
| H | `teacher_code` | Teacher assigned to the guard duty, or `__NO_CAL_COBRIR__` for a no-cover row. |
| I | `source_teacher_code` | Original timetable owner from `schedule_cache.source_teacher_code`. For ordinary rows, same as effective/assigned teacher. |
| J | `source_teacher_name` | Original timetable owner full name from `schedule_cache.source_teacher_name`. |
| K | `effective_teacher_code` | Current/effective teacher from `schedule_cache.effective_teacher_code`. Normally the same value as `teacher_code`. |
| L | `effective_teacher_name` | Current/effective teacher full name from `schedule_cache.effective_teacher_name`. |
| M | `teacher_was_substituted` | Boolean from `schedule_cache.teacher_was_substituted`. |
| N | `created_at` | Creation timestamp. |
| O | `updated_at` | Last update timestamp. |

Corridor pseudo-ids:

- `corridor-lower:{date}:{time}`
- `corridor-upper:{date}:{time}`

Counting previous substitutions for proposal order uses `weekday`, `time`, and a fairness identity built from the current candidate:

- candidate assigned/effective teacher code,
- candidate source teacher code.

For each previous `profes_guardia` row in the same weekday/time, count the row once when any of these previous-row fields matches the current fairness identity:

- `teacher_code`
- `source_teacher_code`
- `effective_teacher_code`

This means:

- During Gemma's leave, Alba appears as the effective GUARDIA teacher, but Alba's bracket count includes Gemma's previous rows for that weekday/time.
- While Alba covers Gemma, saved rows store `teacher_code = Alba`, `source_teacher_code = Gemma`, and `effective_teacher_code = Alba`.
- When Gemma returns and the cache again exposes Gemma as source/effective, Gemma's bracket count still includes Alba's rows that were saved with `source_teacher_code = Gemma`.
- Unrelated substitutions remain separated by their own source/effective identity where possible.

Finding the oldest/latest previous substitution uses `assignment_date` and then `updated_at` as a tie-breaker.
