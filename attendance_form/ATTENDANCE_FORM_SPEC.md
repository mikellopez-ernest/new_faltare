# Attendance Form Specification

## Scope

This document specifies the current `attendance_form` Google Apps Script web app.

The script exposes a teacher-facing endpoint for absence/guard duty notifications.

## Database Architecture

The form must use the existing spreadsheet registry database architecture.

Configured logical tables and physical sheet names:

| Logical table name | Sheet name |
| --- | --- |
| `Dades de professors` | `Llista` |
| `Horaris` | `GPU001` |
| `Càrrega lectiva` | `assignatures` |
| `Faltaré` | `form_data`, `absences`, `recovery` |

`attendance_form` writes only the three `Faltaré` sheets listed above. The same logical `Faltaré` spreadsheet also contains `profes_guardia`, which is owned by `control_panel`.

The app must not assume these sheets live in the same spreadsheet. Each logical table is resolved through the registry spreadsheet defined by script property `db`.

## Access

The endpoint must only be accessible to users from the Google Workspace domain `@iernestlluch.cat`.

Deployment must execute as the script creator/deployer, `admindomini@iernestlluch.cat`, and allow access to every `@iernestlluch.cat` user.

The signed-in user's email must be obtained automatically with the appropriate GAS user/session function. The email field is displayed to the user but must not be editable.

Apps Script can return a blank active-user email in some web-app contexts. If that happens, the form must not block bootstrap or teacher loading. The email field should show a non-editable warning value, and the deployment/domain access setting remains responsible for restricting access to `@iernestlluch.cat`.

## Intro

Copy the intro text exactly as in the PDF:

> Amb aquest formulari s'intenta simplificar la gestió de qualsevol alteració de l'horari normal del professorat. Substituexi l'antic "Faltaré" i "He faltat". Un cop contesteu el formulari, rebreu un correu que heu de guardar com a referència. En aquell correu apareixerà un enllaç on podreu justificar aquella absència. No es poden justificar absències sense haver-les comunicat prèviament.
>
> IMPORTANT. Si és la 1a vegada que accediu a aquest formulari, llegiu amb atenció les següents informacions:
>
> - Enllaç sindical sobre absències al centre de treball per motius de salut (actualitzat 2023).
> - Contestar aquest formulari equival al pdf "Declaració responsable de justificació d'absència per motius de salut o visita mèdica".
> - DOCUMENTS JUSTIFICATIUS. Per evitar malentesos tota falta ha d'anar acompanyada del justificant corresponent.
> - En cas d'haver demanat permís o llicència, cal indicar-ho a OBSERVACIONS. En aquests casos el document justificatiu és el pdf o la captura de pantalla que mostri l'atorgament del permís o llicència.
> - L'acompanyament a sortides del centre no necessita justificació.

## First Screen

### Part A - Teacher's Email Account

Mandatory system-filled field.

- Display the current user's email address.
- The value is based on the signed-in Google Workspace account.
- The value must not be editable.

### Part B - Absència de

Mandatory combo box.

The combo box must show teacher names, not teacher emails.

Source:

- Logical table: `Dades de professors`
- Sheet: `Llista`

Filtering:

- Include rows where column `L` (`BAIXA?`) is `FALSE`.
- Include rows where column `N` (`ACTIVE`) is `TRUE`.

Display value:

- Concatenate columns `C`, `D`, and `E`.
- These represent name, first surname, and second surname.

The selected teacher name will later be used to resolve the teacher email and teacher code where needed.

A teacher can choose any teacher in this field. The selected teacher is not restricted to the signed-in user.

### Part C - Què vols fer?

Mandatory single-choice control.

Use the same three options as the PDF:

- `Avisar que genero guàrdia`
- `Actualitzar una guàrdia ja generada`

After Parts A-C, show a `Next` button.

When the user clicks `Next`, the form stores/keeps the selected first-screen values and branches depending on the selected value of `Què vols fer?`.

First iteration branch:

- If `Avisar que genero guàrdia` is selected, continue to Part D.
- If `Actualitzar una guàrdia ja generada` is selected, show a modal listing rows already generated for the selected teacher email.

The `Adjuntar un justificant per aquest avís de guàrdia` option is removed from the first page.

### Updating An Existing Row

When the user selects `Actualitzar una guàrdia ja generada` and clicks `Next`, show a modal with all rows in `Faltaré -> form_data` where `absence_teacher_email` matches the selected teacher.

The modal table shows:

- Creation date.
- Absence date.
- Context.

The context cell must be visually cropped to two lines. Clicking the context loads the full row into the second page of the form so the user can edit values and save the same row again.

## Branch: Avisar Que Genero Guàrdia

### Section Title

Use the title from the PDF:

`AVÍS DE GENERACIÓ DE GUÀRDIES`

### Part D - Professor Acompanyant?

Mandatory single-choice yes/no question.

Copy the field from the PDF:

Question:

`Professor acompanyant?`

Help text:

`Si és una sortida amb alumnes, no caldrà fer després la justificació. Té el tractament d'un avís que cal tenir en compte per cobrir guàrdies, res més.`

Options:

- `Sí`
- `No` (default)

### Part E - Data Prevista De L'Absència

Mandatory date picker.

Question:

`Data prevista de l'absència`

Behavior:

- Show a date picker.
- Default value is always today's date.
- The date picker must render weeks starting on Monday.

### Part F - Absència De Més D'Un Dia?

Mandatory yes/no question.

Question:

`Absència de més d'un dia?`

Options:

- `Sí`
- `No` (default)

Branching:

- If `No`, show the one-day teacher schedule table in Part G.
- If `Sí`, show the reincorporation date picker in Part G.

### Part G - One-Day Absence Schedule Table

Shown only when Part F is `No`.

The form must show the selected teacher's schedule for the selected absence date.

Teacher code lookup:

- Use logical table `Dades de professors`.
- Use sheet `Llista`.
- Match the selected teacher's email against column `K`.
- Return the teacher code from column `F`.

Schedule source:

- Use logical table `Horaris`.
- Use sheet `GPU001`.

Expected columns in `Horaris` / `GPU001`:

| Field | Meaning |
| --- | --- |
| `ROW_ID` | Row identifier |
| `GROUP` | Student group |
| `TEACHER'S CODE` | Teacher code |
| `SUBJECT CODE` | Subject code |
| `CLASSROOM` | Classroom |
| `DAY` | Day number, from 1 to 5 |
| `SCHEDULE SLOT` | Schedule slot, from 1 to 12 |

Day resolution:

- Convert the date selected in Part E to weekday.
- Monday = `1`.
- Tuesday = `2`.
- Wednesday = `3`.
- Thursday = `4`.
- Friday = `5`.

Schedule slot mapping:

| Slot | Time |
| --- | --- |
| `1` | `08:00` |
| `2` | `09:00` |
| `3` | `10:00` |
| `4` | `11:30` |
| `5` | `12:30` |
| `6` | `13:30` |
| `7` | `15:00` |
| `8` | `16:00` |
| `9` | `17:00` |
| `10` | `18:30` |
| `11` | `19:30` |
| `12` | `20:30` |

Subject name lookup:

- Use logical table `Càrrega lectiva`.
- Use sheet `assignatures`.
- Look up the `SUBJECT CODE` against column `A`.
- Display the corresponding subject name from column `C`.

Schedule table columns:

| Column | Control / Data |
| --- | --- |
| `1` | Checkbox, default `false` |
| `2` | Time, derived from `SCHEDULE SLOT` |
| `3` | Subject name, resolved through `Càrrega lectiva` / `assignatures` |
| `4` | `No cal cobrir` toggle button |
| `5` | Text box with placeholder `Feina per l'alumnat`, only when the grouped row has an associated group |

The checkbox column header must also show a checkbox that selects or unselects all classes shown for the day.

Rows with the same time and same subject are the same class block and must be grouped into one visible row. The row must show the subject name and, underneath it, the groups as a comma-separated list.

Example:

- Teacher: `Mikel López (LOPINF)`
- Day: Thursday
- Source rows: subject `DIGI`, groups `4A`, `4B`, `4C`, `4D`, `4E`
- Visible row: `DIGITALITZACIÓ`, with `4A, 4B, 4C, 4D, 4E` underneath

If a grouped subject row does not have an associated group in the source timetable data, do not show the `Feina per l'alumnat` text box for that row.
Leave that cell blank.

Default checked rows:

- Rows with at least one group are checked by default.
- Rows without a group are checked by default only when the subject name or subject code is `GUARDIA`.
- Other rows without a group are shown but unchecked by default.

For example, for `Mikel López (LOPINF)` on Thursday, the `DIGITALITZACIÓ` row grouping groups `4A`, `4B`, `4C`, `4D`, and `4E` must show the text box.

Checking a row means the user wants to generate guard duty for that class/hour. Unchecked rows are ignored for guard-duty generation.

The `No cal cobrir` toggle marks a checked absence row as not requiring a substitute teacher. The UI shows it as a compact icon button and strikes through the visible row when active.

`No cal cobrir` does not uncheck the row and does not remove it from the absence-hour count. It is stored in `Faltaré -> absences.no_cover_required` and is consumed by `control_panel`.

`Hores` and `Hores a recuperar` must count only checked schedule rows.

If the selected date is a weekend or there are no schedule rows for the selected teacher on that day, the form must show an error and block new submissions for the one-day branch.

At least one schedule row must be checked for a one-day `Avisar que genero guàrdia` submission.

When editing an existing row, saved child rows in `Faltaré -> absences` are the source of truth for previously selected schedule rows. The form must render those stored subjects immediately, use them as a fallback if the live timetable lookup fails or returns no rows, and allow saving the edited row as long as at least one stored/checked subject is present.

### Part G - Multi-Day Absence Reincorporation Date

Shown only when Part F is `Sí`.

Show another date picker.

Title:

`Data de reincorporació`

For the first implementation, multi-day absences only collect this reincorporation date. They do not render or calculate affected schedule rows across the date range.

For multi-day absences, also show a text box titled `Feina per l'alumnat`.

### Part H - Motiu

Combo box.

Question:

`Motiu`

Options and later Part J routing:

| Option | Part J route |
| --- | --- |
| `Estic de baixa (cal adjuntar document baixa per justificació)` | `J-a` |
| `Absència per motius de salut de màxim 15 hores (cal adjuntar declaració responsable)` | `J-a` |
| `Absència per visita mèdica (cal adjuntar justificant visita)` | `J-a` |
| `Absència per encàrrec de servei o formació de centre` | `J-a` |
| `Absència per realització de prova mèdica invasiva (cal adjuntar justificant visita)` | `J-a` |
| `Absència per menstruació o climateri (recuperable)` | `J-b` |
| `Absència per visita mèdica d'un familiar (Cal recuperar les hores)` | `J-b` |
| `ATRI - Absència per reunió de tutoria dels fills (Cal omplir ATRI i recuperar les hores)` | `J-b` |
| `ATRI - Llicència per assumptes propis no remunerats (Cal omplir ATRI)` | `J-a` |
| `ATRI - Llicència per estudis no retribuïts (Cal omplir ATRI)` | `J-a` |
| `ATRI - Permís de maternitat/paternitat (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per accident d'un familiar (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per adopció internacional (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per atendre fill discapacitat (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per deure inexcusable (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per deures de conciliació de la vida familiar i laboral (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per dol gestacional (cal omplir ATRI)` | `J-a` |
| `Permís per examen prenatal / preparació part / reproducció assistida (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per exàmens finals en centres oficials (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per força major per motiu d'emergència ambientals (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per hospitalització d'un familiar (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per lactància (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per malaltia greu d'un familiar (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per matrimoni (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per matrimoni d'un fill o familiar de fins 2n grau de consanguinitat (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per defunció d'un familiar (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per situació de violència de gènere (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per tràmits adopció/acolliment (cal omplir ATRI)` | `J-a` |
| `ATRI - Permís per trasllat de domilici (cal omplir ATRI)` | `J-a` |
| `Absència no justificable aprovada per direcció (Cal recuperar les hores)` | `J-b` |

### Part I - Context

Copy from the PDF.

Question:

`Context`

Help text:

`Indiqueu el context de l'absència. Recordeu que aquest context és confidencial i només visible per a membres de l'equip directiu. Si no es vol, no cal especificar els motius de salut.`

### Part J-a - Hores

Used when Part H routes to `J-a`.

This field is hidden from the user.

Question:

`Hores`

Help text:

`Nombre d'hores què es faltarà: s'inclouen lectives i no lectives. No cal notificar les hores del dimarts per la tarda en cas de no poder anar a les reunions.`

The value is still auto-filled and submitted to the database.

After Part J-a, go directly to Part K.

Do not show Part J-b.

Default value: auto-fill with the number of grouped schedule rows for the selected teacher/date.
The number must track checked schedule rows only.

### Part J-b - Hores A Recuperar

Shown when Part H routes to `J-b`.

Question:

`Hores a recuperar`

Text:

`Nombre d'hores què es faltarà: s'inclouen lectives i no lectives. No cal notificar les hores del dimarts per la tarda en cas de no poder anar a les reunions`

Control:

- Show a box that only accepts numbers.

Dynamic recovery controls:

- After the user enters a number, show the same number of recovery controls.
- Each recovery control has:
  - Date picker titled `Data`, with weeks starting on Monday.
  - Combo box titled `Hora`.
- Recovery dates cannot be before Part E, `Data prevista de l'absència`. The form must show an error and block submission if a recovery date is earlier.

Recovery hour combo values:

- `08:00`
- `09:00`
- `10:00`
- `11:30`
- `12:30`
- `13:30`
- `15:00`
- `16:00`
- `17:00`
- `18:30`
- `19:30`
- `20:30`

After Part J-b, continue to Part K.

Default value: auto-fill with the number of grouped schedule rows for the selected teacher/date.
The number must track checked schedule rows only.

When Part H routes to `J-b`, Part K is hidden from the user and automatically set to `Absència ordinària`.

### Part K - Permís, Llicència O Absència Ordinària

Copy from the PDF.

Question:

`Permís, llicència o absència ordinària`

Help text:

`Cal indicar si s'ha demanat permís o llicència per ATRI. Qualsevol altra absència es considera "Absència ordinària".`

Options:

- `He demanat permís/llicència a ATRI i ha estat aprovat (o ho estarà en breu)`
- `Absència ordinària`

Visibility:

- Show this question for routes other than `J-b`.
- Hide it for route `J-b` and submit `Absència ordinària` automatically.

### Part L - Document Justificatiu

Question:

`Document justificatiu`

Text:

`IMPORTANT. En cas de llicència o permís demanat per ATRI, el document justificatiu és el pdf o captura de pantalla amb l'acceptació del permis o llicència.`

Control:

- Show a button to pick a file from the user's computer.

Upload behavior:

- Upload the selected file to Drive folder `12CHcrUW8mgeeotIi5ltzNeoWiy9toqjI`.
- Rename the uploaded file to `document_faltare_#`.
- `#` is the row number of the data registry created when the form is submitted.

Validation:

- The upload is currently not mandatory.
- Later rules may make it mandatory depending on `Motiu` and/or `Permís, llicència o absència ordinària`.

### Part M - Confirmació

Mandatory confirmation checkbox.

Question:

`Confirmació`

Text:

`Recordem que un cop enviat el "Faltaré" rebreu un avís al vostre correu electrònic. Hi trobareu un enllaç per a) modificar les dades d'aquest "Faltaré"; b) confirmar-lo posteriorment amb el justificant`

Control:

- Single checkbox / bullet with value `OK`.

Validation:

- The form cannot be submitted unless this checkbox is set.

## Submission Storage

Submitted form rows must be stored in:

- Logical table: `Faltaré`
- Parent sheet: `form_data`
- Child sheet for selected schedule/class rows: `absences`
- Child sheet for recovery date/time rows: `recovery`

This table must also be resolved through the registry spreadsheet. Do not assume it lives in the same spreadsheet as any other logical table.

The normalized schema is documented in `FORM_DATA_SCHEMA.md`.

`form_data` must not store these old JSON fields:

- `selected_schedule_items_json`
- `recovery_items_json`

Instead:

- Selected schedule/class rows are stored in `absences`, linked by `row_id`.
- Recovery date/time rows are stored in `recovery`, linked by `row_id`.

When creating a row, first write `form_data`, then write child rows using the created `row_id`.

When updating a row, update `form_data`, replace all existing `absences` child rows for that `row_id`, and replace all existing `recovery` child rows for that `row_id`.

The submission handler must send a confirmation email to the user who created or updated the absence. The generated email must include:

- Recipient email.
- Subject with the registry number and absence date.
- Plain-text body.
- HTML body.
- Registry number, creation/update date, teacher, absence date, multi-day details, reason, context, selected classes, recovery items, permit/license value, and document link when present.

The email is sent after the form row is stored.

The editable email template lives in `EmailTemplates.js` and uses `{{TAG_NAME}}` placeholders. `Código.js` must build the tag values from the stored row data before sending.

The intro/description appears only on the first screen. It must not be shown after the user clicks `Next` and enters the `AVÍS DE GENERACIÓ DE GUÀRDIES` screen.

After a successful submission, redirect the web page to `https://agora.xtec.cat/sesernestlluch-cunit/`.

When editing an existing row, stored child rows from `absences` and `recovery` must be loaded and rendered in the form. `absences` rows must be used as the selected schedule fallback when the live schedule list has not been freshly regenerated yet.

## Deferred Work

1. Define the later update/justification link workflow.
2. Define any future rules that make document upload mandatory for specific reasons or permit/license types.
