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
| `Horaris` | `GPU001` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery`, `profes_guardia` |

`Faltaré` is one logical spreadsheet with multiple sheets. The registry maps only the logical table name `Faltaré` to a spreadsheet ID; the physical sheet names are configured in code.

Column B in the registry sheet is always another spreadsheet ID, never a sheet name.

## Data Loading

For a selected date, the endpoint loads:

- `Faltaré -> form_data`
- `Faltaré -> absences`
- `Faltaré -> recovery`
- `Faltaré -> profes_guardia`
- `Dades de professors -> Llista`
- `Horaris -> GPU001`
- `Càrrega lectiva -> assignatures`

Primary absence rows come from `Faltaré -> absences`.

Fallback rule:

- If a `form_data` parent row matches the selected date but has no child rows in `Faltaré -> absences`, the endpoint computes visible rows from `Horaris -> GPU001`.
- The fallback uses the parent `teacher_code`, the selected absence date weekday, the schedule slot mapping, and `Càrrega lectiva -> assignatures` for subject names.
- This keeps existing or partially migrated parent rows visible without changing the normalized storage rule.

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

Absence rows are read from `Faltaré -> absences` when child rows exist. `Horaris -> GPU001` is only used as a fallback for matching parent rows that have no `absences` children.

Absent teacher names are resolved by joining:

`absences.row_id -> form_data.row_id -> form_data.teacher_code -> Dades de professors/Llista column F`

The displayed teacher name uses:

`Dades de professors/Llista columns C + D + E`

Recovery candidates are resolved by joining:

`recovery.row_id -> form_data.row_id -> form_data.teacher_code -> Dades de professors/Llista column F`

Recovery teachers are shown as unique teacher names, one per line, under the text `Guàrdia preferent:`.

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

For a selected date and time, the available guard-teacher pool is built from `Horaris -> GPU001`.

A teacher is eligible for the pool when:

- their timetable row matches the selected weekday,
- their timetable row matches the selected time slot, and
- their subject code or subject name is `GUARDIA`.

Teacher names are resolved through `Dades de professors -> Llista`.

If a teacher is absent at the same date/time, they must not be proposed as a guard teacher for another row.

## Guard Teacher Proposal Order

The popup proposes guard teachers automatically.

For the selected weekday and time slot, order eligible guard teachers by:

1. Fewest previous substitutions in `Faltaré -> profes_guardia` for that same weekday and time slot.
2. If tied, the teacher whose last previous substitution is oldest.
3. If still tied, first surname initial, A-Z.

The first proposed teacher is assigned to the first popup row by substitution priority, the second teacher to the second row, and so on.

If there are more rows to cover than eligible teachers, the remaining rows have an empty `GUÀRDIA` value.

## Manual Guard Teacher Editing

Clicking the popup header gear icon changes the popup into assignment edit mode.

In edit mode, each `GUÀRDIA` text cell becomes a dropdown combo.

Each dropdown contains the eligible guard-teacher pool for that date/time.

Rules:

- A teacher can only appear in one popup row at a time.
- If a user selects a teacher who is already assigned to another row, the previous row becomes empty.
- A row with an empty `GUÀRDIA` value is visually marked as incomplete.
- The popup cannot be saved while any selected/proposed teacher has no row or any required row has no teacher, except when there are not enough eligible guard teachers.

When there are not enough eligible guard teachers:

- It is valid for some rows to remain empty.
- It is not valid for an eligible guard teacher to be unassigned while an empty row still exists.
- The save rule is therefore: every eligible guard teacher must be placed somewhere, and no teacher may be duplicated.

Saving replaces all existing `profes_guardia` rows for the selected date and time with the popup's current nonempty assignments.

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
| H | `teacher_code` | Teacher assigned to the guard duty. |
| I | `created_at` | Creation timestamp. |
| J | `updated_at` | Last update timestamp. |

Corridor pseudo-ids:

- `corridor-lower:{date}:{time}`
- `corridor-upper:{date}:{time}`

Counting previous substitutions for proposal order uses `teacher_code`, `weekday`, and `time`.

Finding the oldest/latest previous substitution uses `assignment_date` and then `updated_at` as a tie-breaker.
