const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    const classes = new Set();
    elements.set(id, { value: '', innerHTML: '', textContent: '', options: [], selectedIndex: -1, addEventListener() {}, appendChild(option) { this.options.push(option); },
      classList: { add: c => classes.add(c), remove: c => classes.delete(c),
        contains: c => classes.has(c), toggle(c, enabled) { enabled ? classes.add(c) : classes.delete(c); } } });
  }
  return elements.get(id);
}
const radios = { action: ['Avisar que genero guàrdia', 'Actualitzar una guàrdia ja generada'],
  professorAcompanyant: ['Sí','No'], multiDay: ['Sí','No'], fullDay: ['Sí','No'] };
Object.keys(radios).forEach(key => radios[key] = radios[key].map(value => ({value, checked:false})));
const document = {
  addEventListener() {},
  createElement() { return {value:'',textContent:'',dataset:{}}; },
  getElementById: element,
  querySelectorAll(selector) {
    const name = selector.match(/^input\[name="(.+)"\]$/);
    return name ? radios[name[1]] || [] : [];
  },
  querySelector(selector) {
    const name = selector.match(/^input\[name="(.+)"\]:checked$/);
    return name ? radios[name[1]].find(r => r.checked) : null;
  }
};
const requests = [];
const run = {withSuccessHandler(fn) {this.success=fn;return this;},
  withFailureHandler(fn) {this.failure=fn;return this;},
  getScheduleForTeacher(payload) {requests.push({payload,success:this.success,failure:this.failure});}};
const context = vm.createContext({document, window:{scrollTo(){}}, google:{script:{run}}, console});
const html = fs.readFileSync(path.join(__dirname,'../attendance_form/Index.html'),'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
vm.runInContext(source.replace('    init();',''),context);
const exec = code => vm.runInContext(code,context);
const saved = {editRowId:'22b',teacherEmail:'teacher@example.com',absenceDate:'2026-11-06',
  multiDay:'No',fullDay:'No',absenceStartTime:'9:00',returnTime:'10:00',
  selectedScheduleItems:[{rowIds:['1'],time:'9:00',subjectCode:'ANG',hasGroup:true,studentWork:'Saved work',noCoverRequired:true}]};
element('createNoticeScreen').classList.add('hidden');
context.saved = saved;
exec('populateFormForEdit(saved)');
assert.equal(requests.length,1,'Opening an edit must fetch its timetable automatically');
assert.equal(element('createNoticeScreen').classList.contains('hidden'),false);
assert.equal(element('absenceStartTime').value,'09:00');
assert.equal(element('returnTime').value,'10:00');
requests[0].success({items:[{rowIds:['1'],slot:2,time:'09:00',subjectCode:'ANG',hasGroup:true}]});
assert.match(element('scheduleTableWrap').innerHTML, /09:00/);
assert.equal(exec('state.scheduleItems[0].studentWork'),'Saved work');
assert.equal(exec('state.scheduleItems[0].noCoverRequired'),true);
// Failed live lookup restores old non-padded times and keeps the row in the interval.
exec('populateFormForEdit(saved)');
requests[1].failure({message:'Temporarily unavailable'});
assert.match(element('scheduleTableWrap').innerHTML,/09:00/);
assert.equal(exec('state.scheduleItems[0].time'),'09:00');
// Moving to another date must not restore the original record's children.
element('absenceDate').value='2026-11-09';
exec('refreshScheduleIfNeeded()');
requests[2].failure({message:'No timetable'});
assert.equal(element('scheduleTableWrap').innerHTML,'');
// An old response cannot overwrite a newer date or record.
requests[1].success({items:[{time:'09:00',subjectCode:'OLD'}]});
assert.equal(element('scheduleTableWrap').innerHTML,'');
// Empty live lookups also use saved children, without masking invalid intervals.
exec('populateFormForEdit(saved)');
requests[3].success({items:[]});
assert.match(element('scheduleTableWrap').innerHTML,/09:00/);
element('returnTime').value='08:00';
exec('renderStoredScheduleIfNeeded("No timetable")');
assert.match(element('scheduleMessage').textContent,/posterior/);
assert.equal(element('scheduleTableWrap').innerHTML,'');
// Multi-day records do not render a one-day timetable.
context.saved = {...saved,multiDay:'Sí'};
exec('populateFormForEdit(saved)');
assert.equal(element('scheduleTableWrap').innerHTML,'');
console.log('Passed edit initialization, live schedule, saved work/flags, legacy times, fallback, stale response, interval error and multi-day regression checks.');
// A rebuilt cache still restores the saved work when the class identity is unique.
context.saved = {...saved, documentFile:{url:'https://drive.google.com/file/d/example/view',name:'justificant.pdf'}};
exec('populateFormForEdit(saved)');
assert.match(element('existingDocument').innerHTML,/justificant\.pdf/);
assert.match(element('existingDocument').innerHTML,/Es conservarà/);
assert.equal(element('documentFile').value,'');
requests.at(-1).success({items:[{rowIds:['new-id'],slot:2,time:'09:00',subjectCode:'ANG',hasGroup:true}]});
assert.equal(exec('state.scheduleItems[0].studentWork'),'Saved work');
assert.match(element('scheduleTableWrap').innerHTML,/Saved work/,'Work must be in the rendered textarea');
assert.match(element('scheduleTableWrap').innerHTML,/no-cover-toggle active/);
// User changes must survive time-range re-renders, including turning no-cover off.
exec("state.scheduleItems[0].studentWork = 'Edited work'; state.scheduleItems[0].noCoverRequired = false; renderCurrentSchedule()");
assert.match(element('scheduleTableWrap').innerHTML,/Edited work/);
assert.equal(exec('state.scheduleItems[0].noCoverRequired'),false);
exec('renderExistingDocument({})');
assert.match(element('existingDocument').innerHTML,/No hi ha cap document/);
exec('renderExistingDocument(null)');
assert.equal(element('existingDocument').innerHTML,'');
assert.equal(element('existingDocument').classList.contains('hidden'),true);

// Check the real server edit response and save handler, without accessing Sheets/Drive/email.
const server = vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../attendance_form/Código.js'),'utf8'),server);
const original = {row_id:'22b',absence_teacher_email:'teacher@example.com',multi_day:'No',full_day:'No',
 document_file_id:'original-id',document_file_url:'https://drive.google.com/file/d/example/view',document_file_name:'justificant.pdf'};
const written = [];
Object.assign(server, {
 getCurrentUser_:()=>({email:'teacher@example.com'}), assertAllowedUserIfKnown_(){},
 loadTableRegistry_:()=>({}),openFaltareSheet_:()=>({getLastRow:()=>10,getRange:()=>({setValues:rows=>written.push(rows)})}),
 ensureFormDataHeaders_(){},ensureSheetHeaders_(){},
 getFormRecordByRowId_:()=>({rowId:'22b',physicalRowNumber:2,rowObject:original}),
 loadAbsenceItemsForRow_:()=>saved.selectedScheduleItems,loadRecoveryItemsForRow_:()=>[],
 validateSubmission_(){},findTeacherByEmail_:()=>({name:'Teacher',email:'teacher@example.com',teacherCode:'T'}),
 replaceAbsenceRows_(){},replaceRecoveryRows_(){},buildConfirmationEmailTemplate_:()=>({}),sendConfirmationEmail_(){},
});
assert.equal(server.getSubmissionForEdit('22b','teacher@example.com').documentFile.name,'justificant.pdf');
server.submitAttendanceForm({editRowId:'22b',teacherEmail:'teacher@example.com',multiDay:'No',fullDay:'No',
 motiu:'Absència per visita mèdica (cal adjuntar justificant visita)',documentFile:null});
const headerList = vm.runInContext('FORM_DATA_HEADERS',server);
for (const key of ['document_file_id','document_file_url','document_file_name']) {
 assert.equal(written[0][0][headerList.indexOf(key)],original[key],`${key} must be retained without a replacement upload`);
}
console.log('Passed rendered work, cache identity fallback, user edits, existing-document display/reset, server edit response and document retention checks.');

// Exercise the complete startup path too: edit-only tests must not hide bootstrap failures.
let bootstrapSuccess;
const bootstrapRun = {withSuccessHandler(fn) {bootstrapSuccess=fn;return this;},
 withFailureHandler() {return this;}, getClientBootstrapData() {}};
vm.runInNewContext(source,{document,window:{scrollTo(){}},google:{script:{run:bootstrapRun}},console});
assert.equal(element('signedInEmail').value,'Carregant compte...');
assert.equal(element('nextButton').disabled,true);
bootstrapSuccess({user:{email:'teacher@example.com'},today:'2026-11-06',
 teachers:[{email:'teacher@example.com',name:'Teacher'}],reasons:[]});
assert.equal(element('signedInEmail').value,'teacher@example.com');
assert.equal(element('teacherEmail').disabled,false);
assert.equal(element('nextButton').disabled,false);
console.log('Passed full client startup, signed-in email and teacher-list bootstrap checks.');
// Playground guard duty is a saved absence, displayed without a work textarea.
context.saved = {...saved,fullDay:'Sí',selectedScheduleItems:[]};
exec('populateFormForEdit(saved)');
requests.at(-1).success({items:[{rowIds:['pati'],slot:3,time:'10:00',subjectCode:'GUARDIA_PATI',subjectName:'Guàrdia de pati',hasGroup:false}]});
assert.doesNotMatch(element('scheduleTableWrap').innerHTML,/schedule-reference-only|aria-disabled="true"|<textarea/);
assert.equal(exec('collectSelectedScheduleItems().length'),1);
assert.equal(server.shouldCreateAbsenceRegistryItem_({subjectCode:'GUARDIA_PATI',hasGroup:false}),true);
assert.equal(server.shouldCreateAbsenceRegistryItem_({subjectName:'GUARDIA_PATI',hasGroup:false}),true);
assert.equal(server.shouldCreateAbsenceRegistryItem_({subjectCode:'GUARDIA',hasGroup:false}),true);
assert.equal(server.shouldCreateAbsenceRegistryItem_({subjectCode:'REUNIO',hasGroup:false}),false);
const panel = vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../control_panel/Código.js'),'utf8'),panel);
const panelRows = panel.buildAbsencesByTime_({values:[
 ['row_id','absence_item_id','time','subject_code','subject_name','groups'],
 ['22b','pati','10:00','GUARDIA_PATI','Guàrdia de pati',''],
 ['22b','class','10:00','ANG','Anglès','3A']
]}, {'22B':{absence_date:'2026-11-06',multi_day:'No',teacher_code:'T'}},{T:{name:'Teacher'}},'2026-11-06').byTime['10:00'];
assert.equal(panelRows.length,2,'Playground duty remains visible in the main daily panel');
const coverRows = panel.filterCoverableAbsences_(panelRows);
assert.equal(coverRows.length,1);
assert.equal(coverRows[0].subjectCode,'ANG','Guard duties do not become classes to cover');
console.log('Passed playground duty form inclusion, server validation and panel visibility/coverage checks.');
