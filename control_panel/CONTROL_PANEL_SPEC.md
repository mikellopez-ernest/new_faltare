# Control Panel Spec

`control_panel` is the third Google Apps Script project in this workspace.

Script ID:

`1NkdZpoaVwLeVKtlgSi3qPCLPgytFS666qcgrSf0JeJ-bBr9ofWc8D76U`

## Scope

The endpoint shows a daily control table for guard-duty management.

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

The endpoint reads `schedule_cache` as-is. It does not rebuild or refresh the cache during page load, popup load, or save.

Fallback rule:

- If a `form_data` parent row matches the selected date but has no child rows in `Faltaré -> absences`, the endpoint computes visible rows from `Horaris -> schedule_cache`.
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
2. Immediately under the green row, show a yellow `Guàrdia preferent:` row if there are matching recovery rows for the selected date/time.
3. Under the yellow row, show the absence rows for that date/time.

If a time slot has no recovery candidates and no absences, it still shows the green time row.

Absence rows are read from `Faltaré -> absences` when child rows exist. `Horaris -> schedule_cache` is only used as a fallback for matching parent rows that have no `absences` children.

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

## Guard Teacher Proposal Order

The popup proposes guard teachers automatically.

For the selected weekday and time slot, order eligible guard teachers by:

1. Fewest previous substitutions in `Faltaré -> profes_guardia` for that same weekday and time slot.
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

Preferred recovery teachers should be visually identified in the option text, for example `Guàrdia preferent: Mikel López Villarroya (7)`.

Rules:

- `No cal cobrir` is not a teacher assignment and can be selected in more than one row.
- A teacher can only appear in one popup row at a time.
- If a user selects a teacher who is already assigned to another row, the previous row becomes empty.
- A row with an empty `GUÀRDIA` value is visually marked as incomplete.
- The popup cannot be saved while any selected/proposed teacher has no row or any required row has no teacher, except when there are not enough eligible guard teachers.
- Rows with `No cal cobrir` do not require a teacher and do not consume an eligible guard teacher.

When there are not enough eligible guard teachers:

- It is valid for some rows to remain empty.
- It is not valid for an eligible guard teacher to be unassigned while an empty row still exists.
- The save rule is therefore: every eligible guard teacher must be placed somewhere, and no teacher may be duplicated.

Saving replaces all existing `profes_guardia` rows for the selected date and time with the popup's current nonempty assignments.

When `No cal cobrir` is saved, `profes_guardia.teacher_code` stores the special token `__NO_CAL_COBRIR__`.

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
| I | `created_at` | Creation timestamp. |
| J | `updated_at` | Last update timestamp. |

Corridor pseudo-ids:

- `corridor-lower:{date}:{time}`
- `corridor-upper:{date}:{time}`

Counting previous substitutions for proposal order uses `teacher_code`, `weekday`, and `time`.

Finding the oldest/latest previous substitution uses `assignment_date` and then `updated_at` as a tie-breaker.
