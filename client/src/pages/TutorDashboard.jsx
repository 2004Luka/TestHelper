import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_WORKSPACE = { groups: [], students: [] };
const CURRENCY_OPTIONS = [['GEL', '₾'], ['USD', '$'], ['EUR', '€'], ['GBP', '£']];

const copyByLanguage = {
  ka: {
    title: 'რეპეტიტორის ფინანსები', subtitle: 'მართეთ არსებული მოსწავლეების სწავლის საფასური და გადახდები.',
    export: 'ექსპორტი', import: 'იმპორტი',
    received: 'მიღებული თანხა', outstanding: 'დარჩენილი თანხა', currency: 'ვალუტა',
    directory: 'კლასები და მოსწავლეები', search: 'ძებნა სახელით, კურსით ან ტელეფონით', searchLabel: 'მოსწავლეების ძებნა',
    ungrouped: 'კლასის გარეშე', billingInfo: 'გადახდის ინფორმაცია', changePassword: 'პაროლის შეცვლა', deleteStudent: 'მოსწავლის წაშლა', delete: 'წაშლა',
    studentCount: 'მოსწავლე',
    noStudents: 'მოსწავლეები ჯერ არ არის დამატებული.', noMatches: 'შესაბამისი მოსწავლე ვერ მოიძებნა.', noPlan: 'გეგმა არ არის',
    group: 'კლასი', noGroup: 'კლასის გარეშე', save: 'შენახვა', cancel: 'გაუქმება', copy: 'ბმულის კოპირება',
    newStudent: 'გადახდის გეგმა', editStudent: 'გეგმის რედაქტირება', name: 'სახელი და გვარი', course: 'კურსი', phone: 'მოსწავლის ანგარიში', parentContact: 'მშობლის საკონტაქტო ინფორმაცია',
    setupPlan: 'გეგმის დამატება', editPlan: 'გეგმის შეცვლა', planDescription: 'აირჩიეთ კურსის საფასური და თანაბარი გადახდების რაოდენობა.',
    courseFee: 'კურსის სრული საფასური', installments: 'გადახდების რაოდენობა', assessments: 'შეფასებები', addAssessment: 'შეფასების დამატება', assessmentLabel: 'შეფასების დასახელება', score: 'ქულა (0–100)',
    close: 'დახურვა', studentProfile: 'მოსწავლის პროფილი', contactDetails: 'საკონტაქტო ინფორმაცია', paymentHistory: 'გადახდების ისტორია', balance: 'დარჩენილი ბალანსი',
    installmentProgress: 'გადახდების პროგრესი', installment: 'გადახდა', amount: 'თანხა', dueAmount: 'გადასახდელი', paid: 'გადახდილი', open: 'დარჩენილი',
    recordPayment: 'გადახდის დამატება', paymentAmount: 'გადახდის თანხა', addPayment: 'გადახდის შენახვა', noPayments: 'გადახდები ჯერ არ არის.',
    loading: 'მონაცემები იტვირთება…', loadError: 'მონაცემების ჩატვირთვა ვერ მოხერხდა.', retry: 'ხელახლა ცდა', saveError: 'ცვლილებების შენახვა ვერ მოხერხდა.', saved: 'ცვლილებები შენახულია.',
    currencyEntryHelp: 'შეამოწმეთ, რომ საფასური არჩეულ ვალუტაშია მითითებული.',
    studentAdded: 'მოსწავლე დაემატა.', studentUpdated: 'მოსწავლის მონაცემები განახლდა.', studentDeleted: 'მოსწავლე წაიშალა.',
    passwordLinkError: 'პაროლის შეცვლის ბმულის შექმნა ვერ მოხერხდა.', passwordLinkReady: 'პაროლის შეცვლის ბმული მზად არის.', passwordLinkCopied: 'ბმული დაკოპირდა.', passwordLinkLabel: 'პაროლის შეცვლის ბმული', passwordLinkHelp: 'გაუზიარეთ ეს ბმული მოსწავლეს პაროლის შესაცვლელად.',
    paymentAdded: 'გადახდა ჩაიწერა.', paymentDeleted: 'გადახდა წაიშალა.', imported: 'სარეზერვო ასლი ჩაიტვირთა.', exported: 'სარეზერვო ასლი ჩამოიტვირთა.',
    confirmDeleteStudent: 'წავშალოთ ეს მოსწავლე და მისი ფინანსური ჩანაწერები?', confirmDeletePayment: 'წავშალოთ ეს გადახდა? გადახდის გეგმა ხელახლა გადანაწილდება.', confirmImport: 'იმპორტი ჩაანაცვლებს მიმდინარე მოსწავლეებსა და ჯგუფებს. გავაგრძელოთ?',
    invalidRequired: 'შეავსეთ მოსწავლის სახელი, კურსი და ტელეფონი.', invalidFee: 'შეიყვანეთ სწორი საფასური და გადახდების რაოდენობა (1–36).', invalidAssessment: 'შეფასების სათაური აუცილებელია; ქულა უნდა იყოს 0-დან 100-მდე.', invalidGroup: 'შეიყვანეთ ჯგუფის სახელი.', duplicateGroup: 'ასეთი სახელის ჯგუფი უკვე არსებობს.', invalidPayment: 'გადახდის თანხა უნდა იყოს დადებითი და დარჩენილ ბალანსს არ უნდა აღემატებოდეს.', invalidBackup: 'სარეზერვო ასლის ფაილის ფორმატი არასწორია.',
  },
  en: {
    title: 'Tutor finance', subtitle: 'Manage course fees and payments for students already on your roster.',
    export: 'Export', import: 'Import',
    received: 'Payments received', outstanding: 'Outstanding balance', currency: 'Currency',
    directory: 'Classes and students', search: 'Search by name, course, or phone', searchLabel: 'Search students',
    ungrouped: 'No class', billingInfo: 'Billing information', changePassword: 'Change password', deleteStudent: 'Delete student', delete: 'Delete',
    studentCount: 'students',
    noStudents: 'No students have been added yet.', noMatches: 'No matching students found.', noPlan: 'No plan yet',
    group: 'Class', noGroup: 'No class', save: 'Save', cancel: 'Cancel', copy: 'Copy link',
    newStudent: 'Payment plan', editStudent: 'Edit plan', name: 'Full name', course: 'Course', phone: 'Student account', parentContact: 'Parent contact',
    setupPlan: 'Set payment plan', editPlan: 'Edit payment plan', planDescription: 'Choose the course fee and number of equal payments.',
    courseFee: 'Total course fee', installments: 'Number of payments', assessments: 'Assessments', addAssessment: 'Add assessment', assessmentLabel: 'Assessment label', score: 'Score (0–100)',
    close: 'Close', studentProfile: 'Student profile', contactDetails: 'Contact details', paymentHistory: 'Payment history', balance: 'Course balance',
    installmentProgress: 'Payment progress', installment: 'Payment', amount: 'Amount', dueAmount: 'Due', paid: 'Paid', open: 'Outstanding',
    recordPayment: 'Record a payment', paymentAmount: 'Payment amount', addPayment: 'Save payment', noPayments: 'No payments yet.',
    loading: 'Loading records…', loadError: 'Could not load records.', retry: 'Try again', saveError: 'Could not save changes.', saved: 'Changes saved.',
    currencyEntryHelp: 'Make sure the fee is entered in the selected currency.',
    studentAdded: 'Student added.', studentUpdated: 'Student updated.', studentDeleted: 'Student deleted.',
    passwordLinkError: 'Could not create a password reset link.', passwordLinkReady: 'Password reset link is ready.', passwordLinkCopied: 'Link copied.', passwordLinkLabel: 'Password reset link', passwordLinkHelp: 'Share this link with the student so they can change their password.',
    paymentAdded: 'Payment recorded.', paymentDeleted: 'Payment removed.', imported: 'Backup imported.', exported: 'Backup downloaded.',
    confirmDeleteStudent: 'Delete this student and their finance records?', confirmDeletePayment: 'Remove this payment? The payment plan will be recalculated.', confirmImport: 'Importing will replace the current students and groups. Continue?',
    invalidRequired: 'Enter the student’s name, course, and phone number.', invalidFee: 'Enter a valid course fee and payment count (1–36).', invalidAssessment: 'Assessment labels are required and scores must be between 0 and 100.', invalidGroup: 'Enter a group name.', duplicateGroup: 'A group with this name already exists.', invalidPayment: 'Payment must be positive and cannot exceed the remaining balance.', invalidBackup: 'The backup file has an invalid format.',
  },
};

const makeId = () => globalThis.crypto?.randomUUID?.() || `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const todayDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const toCents = (amount) => Math.round((Number(amount) || 0) * 100);
const paidAmount = (student) => (student.payments || []).reduce((sum, payment) => sum + toCents(payment.amount), 0) / 100;
const balanceFor = (student) => Math.max(0, toCents(student.courseFee) - toCents(paidAmount(student))) / 100;

function normalizeWorkspace(data) {
  if (!data || !Array.isArray(data.groups) || !Array.isArray(data.students)) throw new Error('Invalid workspace');
  return {
    groups: data.groups.map((group) => ({ id: group.id, name: group.name })),
    currency: data.currency || 'GEL',
    students: data.students.map((student) => ({
      ...student,
      id: student.id,
      groupId: student.groupId || null,
      assessments: Array.isArray(student.assessments) ? student.assessments : [],
      payments: Array.isArray(student.payments)
        ? student.payments.map(({ id, amount, date }) => ({ id, amount, date }))
        : [],
    })),
  };
}

function installmentsFor(student) {
  const count = Math.max(1, Math.min(36, Number(student.installmentCount) || 1));
  const totalCents = toCents(student.courseFee);
  const baseCents = Math.floor(totalCents / count);
  let paidCents = (student.payments || []).reduce((sum, payment) => sum + toCents(payment.amount), 0);
  return Array.from({ length: count }, (_, index) => {
    const amountCents = baseCents + (index < totalCents % count ? 1 : 0);
    const allocatedCents = Math.min(amountCents, paidCents);
    paidCents = Math.max(0, paidCents - allocatedCents);
    return { index: index + 1, amount: amountCents / 100, paid: allocatedCents / 100, remaining: (amountCents - allocatedCents) / 100 };
  });
}

function formatDate(value, language) {
  const datePart = String(value || '').slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? new Date(`${datePart}T00:00:00.000Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export default function TutorDashboard() {
  const { lang } = useLanguage();
  const text = copyByLanguage[lang] || copyByLanguage.ka;
  const locale = lang === 'ka' ? 'ka-GE' : 'en-US';
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const currency = workspace.currency || 'GEL';
  const [search, setSearch] = useState('');
  const [openClassId, setOpenClassId] = useState(null);
  const [studentDraft, setStudentDraft] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [resetLinkModal, setResetLinkModal] = useState(null);
  const [resetLinkError, setResetLinkError] = useState('');
  const [resettingStudentId, setResettingStudentId] = useState(null);
  const [resetLinkCopied, setResetLinkCopied] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState({ amount: '' });
  const editorRef = useRef(null);
  const profileRef = useRef(null);
  const resetLinkRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadFailed(false);
    Promise.all([api.get('/tutor-dashboard'), api.get('/classes')])
      .then(([workspaceResponse, classesResponse]) => {
        if (!mounted) return;
        setWorkspace(normalizeWorkspace(workspaceResponse.data));
        setClasses(Array.isArray(classesResponse.data) ? classesResponse.data : []);
      })
      .catch(() => { if (mounted) { setLoadFailed(true); notify(text.loadError, 'error'); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; clearTimeout(noticeTimer.current); };
  }, [reloadVersion]);

  useEffect(() => {
    if (studentDraft && editorRef.current && !editorRef.current.open) editorRef.current.showModal();
  }, [Boolean(studentDraft)]);

  useEffect(() => {
    if (profileId && profileRef.current && !profileRef.current.open) profileRef.current.showModal();
    if (!profileId && profileRef.current?.open) profileRef.current.close();
  }, [profileId]);

  useEffect(() => {
    if (resetLinkModal && resetLinkRef.current && !resetLinkRef.current.open) resetLinkRef.current.showModal();
    if (!resetLinkModal && resetLinkRef.current?.open) resetLinkRef.current.close();
  }, [Boolean(resetLinkModal)]);

  function notify(message, kind = 'success') {
    setNotice({ message, kind });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  }

  async function persist(next, successMessage = text.saved) {
    if (savingRef.current || loading || loadFailed) return false;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await api.put('/tutor-dashboard', next);
      setWorkspace(normalizeWorkspace(response.data));
      notify(successMessage);
      return true;
    } catch (error) {
      notify(error.message || text.saveError, 'error');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query) return workspace.students;
    return workspace.students.filter((student) => [student.name, student.course, student.phone, student.phoneNumber, student.username].some((value) => String(value || '').toLocaleLowerCase(locale).includes(query)));
  }, [workspace.students, search, locale]);
  const totals = useMemo(() => ({
    received: workspace.students.reduce((sum, student) => sum + paidAmount(student), 0),
    outstanding: workspace.students.reduce((sum, student) => sum + balanceFor(student), 0),
  }), [workspace.students]);
  const selectedStudent = workspace.students.find((student) => student.id === profileId) || null;

  function money(amount) {
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0); }
    catch { return `${Number(amount || 0).toFixed(2)} ${currency}`; }
  }

  function setCurrencyChoice(value) {
    persist({ ...workspace, currency: value });
  }

  function openPaymentPlan(student) {
    setStudentDraft({ id: student.id, courseFee: student.courseFee === null ? '' : String(student.courseFee), installmentCount: String(student.installmentCount || 1) });
  }

  function openProfile(student) {
    setProfileId(student.id);
    setPaymentDraft({ amount: '' });
    setAssessmentDraft({ studentId: student.id, entries: (student.assessments || []).map((entry) => ({ ...entry, score: String(entry.score) })) });
  }

  async function saveStudent(event) {
    event.preventDefault();
    const courseFee = Number(studentDraft.courseFee);
    const installmentCount = Number(studentDraft.installmentCount);
    if (!Number.isFinite(courseFee) || courseFee < 0 || !Number.isInteger(installmentCount) || installmentCount < 1 || installmentCount > 36) {
      notify(text.invalidFee, 'error'); return;
    }
    const original = workspace.students.find((entry) => entry.id === studentDraft.id);
    if (!original) return;
    const student = { ...original, courseFee, installmentCount };
    if (toCents(paidAmount(student)) > toCents(courseFee)) { notify(text.invalidFee, 'error'); return; }
    const students = workspace.students.map((entry) => entry.id === student.id ? student : entry);
    if (await persist({ ...workspace, students }, text.studentUpdated)) setStudentDraft(null);
  }

  async function saveAssessments(event) {
    event.preventDefault();
    if (!assessmentDraft || !selectedStudent) return;
    const assessments = [];
    for (const assessment of assessmentDraft.entries) {
      const label = assessment.label.trim();
      const score = Number(assessment.score);
      if (!label || !Number.isFinite(score) || score < 0 || score > 100) { notify(text.invalidAssessment, 'error'); return; }
      assessments.push({ id: assessment.id || makeId(), label, score });
    }
    const students = workspace.students.map((entry) => entry.id === assessmentDraft.studentId ? { ...entry, assessments } : entry);
    if (await persist({ ...workspace, students })) setAssessmentDraft({ studentId: selectedStudent.id, entries: assessments.map((entry) => ({ ...entry, score: String(entry.score) })) });
  }

  async function deleteStudent(student) {
    if (!window.confirm(`${text.confirmDeleteStudent} (${student.name})`)) return;
    try {
      await api.del(`/classes/students/${student.id}`);
      setProfileId(null);
      setReloadVersion((version) => version + 1);
      notify(text.studentDeleted);
    } catch (error) {
      notify(error.message || text.saveError, 'error');
    }
  }

  async function createPasswordResetLink(student) {
    setResetLinkError('');
    setResetLinkCopied(false);
    setResetLinkModal({ studentId: student.id, studentName: student.name, url: '' });
    setResettingStudentId(student.id);
    try {
      const response = await api.post(`/students/teacher/${student.id}/password-reset`, {});
      const resetUrl = new URL('/login', window.location.origin);
      resetUrl.hash = `student-reset=${response.data.token}`;
      setResetLinkModal({ studentId: student.id, studentName: student.name, url: resetUrl.toString() });
      notify(text.passwordLinkReady);
    } catch (error) {
      setResetLinkError(error.message || text.passwordLinkError);
    } finally {
      setResettingStudentId(null);
    }
  }

  async function copyPasswordResetLink() {
    if (!resetLinkModal?.url) return;
    try {
      await navigator.clipboard.writeText(resetLinkModal.url);
    } catch {
      const input = document.createElement('input');
      input.value = resetLinkModal.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setResetLinkCopied(true);
    notify(text.passwordLinkCopied);
  }

  async function recordPayment(event) {
    event.preventDefault();
    if (!selectedStudent) return;
    const amount = Number(paymentDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || toCents(amount) > toCents(balanceFor(selectedStudent))) {
      notify(text.invalidPayment, 'error'); return;
    }
    const student = { ...selectedStudent, payments: [...selectedStudent.payments, { id: makeId(), amount, date: todayDate() }] };
    const students = workspace.students.map((entry) => entry.id === student.id ? student : entry);
    if (await persist({ ...workspace, students }, text.paymentAdded)) setPaymentDraft({ amount: '' });
  }

  async function deletePayment(student, payment) {
    if (!window.confirm(text.confirmDeletePayment)) return;
    const updated = { ...student, payments: student.payments.filter((entry) => entry.id !== payment.id) };
    const students = workspace.students.map((entry) => entry.id === student.id ? updated : entry);
    await persist({ ...workspace, students }, text.paymentDeleted);
  }

  function exportBackup() {
    const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...workspace }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tutor-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(text.exported);
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const backup = normalizeWorkspace(parsed);
      if (!window.confirm(text.confirmImport)) return;
      if (await persist(backup, text.imported)) { setProfileId(null); setStudentDraft(null); }
    } catch {
      notify(text.invalidBackup, 'error');
    }
  }

  function classIdForStudent(student) {
    const assignedClass = student.class;
    return assignedClass && typeof assignedClass === 'object' ? assignedClass._id || assignedClass.id : assignedClass;
  }

  function classNameForStudent(student) {
    const assignedClass = student.class;
    const classId = classIdForStudent(student);
    return assignedClass?.name || classes.find((classRecord) => String(classRecord._id) === String(classId))?.name || text.noGroup;
  }

  function studentsForClass(classRecord) {
    const query = search.trim().toLocaleLowerCase(locale);
    const classMatchesSearch = String(classRecord.name || '').toLocaleLowerCase(locale).includes(query);
    return workspace.students.filter((student) => {
      if (String(classIdForStudent(student) || '') !== String(classRecord._id)) return false;
      return !query || classMatchesSearch || filteredStudents.some((match) => match.id === student.id);
    });
  }

  const visibleClasses = classes.filter((classRecord) => {
    const query = search.trim().toLocaleLowerCase(locale);
    return !query || String(classRecord.name || '').toLocaleLowerCase(locale).includes(query) || studentsForClass(classRecord).length > 0;
  });
  const knownClassIds = new Set(classes.map((classRecord) => String(classRecord._id)));
  const studentsWithoutClass = filteredStudents.filter((student) => {
    const classId = classIdForStudent(student);
    return !classId || !knownClassIds.has(String(classId));
  });

  function toggleClass(classId) {
    setOpenClassId((currentId) => currentId === classId ? null : classId);
  }

  function renderStudent(student) {
    return (
      <article className="tutor-student-row" key={student.id}>
        <div className="tutor-student-main">
          <strong>{student.name}</strong>
          <span>{student.course}</span>
          {(student.phone || student.phoneNumber || student.username) && <span className="tutor-student-phone">{student.phone || student.phoneNumber || student.username}</span>}
        </div>
        <div className="tutor-student-finance">
          {student.courseFee === null ? <span className="tutor-status-open">{text.noPlan}</span> : <>
            <span>{money(student.courseFee)}</span>
            <span className={balanceFor(student) === 0 ? 'tutor-status-paid' : 'tutor-status-open'}>{money(balanceFor(student))} {balanceFor(student) === 0 ? text.paid.toLocaleLowerCase(locale) : text.open.toLocaleLowerCase(locale)}</span>
          </>}
        </div>
        <div className="tutor-row-actions">
          <button type="button" className="tutor-button tutor-button-soft" aria-label={`${text.billingInfo}: ${student.name}`} disabled={loading || loadFailed || saving} onClick={() => openProfile(student)}>{text.billingInfo}</button>
          <button type="button" className={student.courseFee === null ? 'tutor-button tutor-button-primary' : 'tutor-button tutor-button-soft'} disabled={loading || loadFailed || saving} onClick={() => openPaymentPlan(student)}>{student.courseFee === null ? text.setupPlan : text.editPlan}</button>
          <button type="button" className="tutor-button tutor-button-plain" aria-label={`${text.changePassword}: ${student.name}`} disabled={Boolean(resettingStudentId)} onClick={() => createPasswordResetLink(student)}>{text.changePassword}</button>
        </div>
      </article>
    );
  }

  return (
    <main className="page tutor-page">
      <header className="page-header tutor-header">
        <div>
          <p className="tutor-eyebrow">QUIZZUP</p>
          <h1 className="page-title">{text.title}</h1>
          <p className="page-subtitle">{text.subtitle}</p>
        </div>
        <div className="tutor-header-actions">
          <label className="tutor-currency-control">
            <span>{text.currency}</span>
            <select value={currency} disabled={loading || loadFailed || saving} onChange={(event) => setCurrencyChoice(event.target.value)} aria-label={text.currency}>
              {CURRENCY_OPTIONS.map(([code, symbol]) => <option value={code} key={code}>{code}{symbol ? ` ${symbol}` : ''}</option>)}
            </select>
          </label>
        </div>
      </header>

      <section className="tutor-summary" aria-label={text.title}>
        <article className="card tutor-summary-card"><span>{text.received}</span><strong>{money(totals.received)}</strong></article>
        <article className="card tutor-summary-card tutor-summary-outstanding"><span>{text.outstanding}</span><strong>{money(totals.outstanding)}</strong></article>
      </section>

      <section className="card tutor-directory" aria-labelledby="tutor-directory-title">
        <div className="tutor-directory-heading">
          <div><h2 id="tutor-directory-title">{text.directory}</h2></div>
          <div className="tutor-tools">
            <label className="tutor-search">
              <span className="tutor-visually-hidden">{text.searchLabel}</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} />
            </label>
            <button type="button" className="tutor-button tutor-button-soft" disabled={loading || loadFailed || saving} onClick={exportBackup}>{text.export}</button>
            <button type="button" className="tutor-button tutor-button-soft" disabled={loading || loadFailed || saving} onClick={() => importRef.current?.click()}>{text.import}</button>
            <input ref={importRef} className="tutor-visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} aria-label={text.import} />
          </div>
        </div>

        {loading ? <p className="tutor-empty">{text.loading}</p> : loadFailed ? (
          <div className="tutor-load-error" role="alert"><p>{text.loadError}</p><button type="button" className="tutor-button tutor-button-soft" onClick={() => setReloadVersion((version) => version + 1)}>{text.retry}</button></div>
        ) : (
          <div className="tutor-class-list">
            {visibleClasses.map((classRecord) => {
              const students = studentsForClass(classRecord);
              const classId = String(classRecord._id);
              const expanded = openClassId === classId;
              const listId = `tutor-class-students-${classId}`;
              return (
                <section className="tutor-class-card" key={classId}>
                  <button type="button" className="tutor-class-trigger" aria-expanded={expanded} aria-controls={listId} onClick={() => toggleClass(classId)}>
                    <span className="tutor-class-title"><strong>{classRecord.name}</strong><span aria-label={`${students.length} ${text.studentCount}`}>{students.length}</span></span>
                    <span className="tutor-class-chevron" aria-hidden="true" />
                  </button>
                  <div className="tutor-class-students" id={listId} hidden={!expanded}>
                    {students.length ? students.map(renderStudent) : <p className="tutor-group-empty">{text.noStudents}</p>}
                  </div>
                </section>
              );
            })}
            {studentsWithoutClass.length > 0 && <section className="tutor-class-card tutor-class-ungrouped">
              <button type="button" className="tutor-class-trigger" aria-expanded={openClassId === 'unassigned'} aria-controls="tutor-class-students-unassigned" onClick={() => toggleClass('unassigned')}>
                <span className="tutor-class-title"><strong>{text.ungrouped}</strong><span aria-label={`${studentsWithoutClass.length} ${text.studentCount}`}>{studentsWithoutClass.length}</span></span>
                <span className="tutor-class-chevron" aria-hidden="true" />
              </button>
              <div className="tutor-class-students" id="tutor-class-students-unassigned" hidden={openClassId !== 'unassigned'}>{studentsWithoutClass.map(renderStudent)}</div>
            </section>}
            {filteredStudents.length === 0 && workspace.students.length > 0 && <p className="tutor-empty">{text.noMatches}</p>}
            {workspace.students.length === 0 && <p className="tutor-empty">{text.noStudents}</p>}
          </div>
        )}
      </section>

      {notice && <div className={`tutor-toast tutor-toast-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{notice.message}</div>}

      {studentDraft && <dialog ref={editorRef} className="tutor-dialog" aria-labelledby="tutor-editor-title" onCancel={(event) => { event.preventDefault(); setStudentDraft(null); }} onClick={(event) => { if (event.target === event.currentTarget) setStudentDraft(null); }}>
        <form className="tutor-dialog-content" onSubmit={saveStudent}>
          <div className="tutor-dialog-heading"><div><p className="tutor-eyebrow">{studentDraft.courseFee === '' ? text.newStudent : text.editStudent}</p><h2 id="tutor-editor-title">{workspace.students.find((student) => student.id === studentDraft.id)?.name}</h2></div><button type="button" className="tutor-dialog-close" aria-label={text.close} onClick={() => setStudentDraft(null)}>×</button></div>
          <p className="tutor-subtitle">{text.planDescription}</p>
          <div className="tutor-form-grid">
            <label>{text.courseFee} ({currency})<input required autoFocus type="number" min="0" step="0.01" value={studentDraft.courseFee} disabled={saving} onChange={(event) => setStudentDraft({ ...studentDraft, courseFee: event.target.value })} /></label>
            <label>{text.currency}<select value={currency} disabled={loading || loadFailed || saving} onChange={(event) => setCurrencyChoice(event.target.value)} aria-label={text.currency}>{CURRENCY_OPTIONS.map(([code, symbol]) => <option value={code} key={code}>{code}{symbol ? ` ${symbol}` : ''}</option>)}</select></label>
            <label>{text.installments}<input required type="number" min="1" max="36" step="1" value={studentDraft.installmentCount} disabled={saving} onChange={(event) => setStudentDraft({ ...studentDraft, installmentCount: event.target.value })} /></label>
          </div>
          <p className="tutor-subtitle">{text.currencyEntryHelp}</p>
          <div className="tutor-dialog-actions"><button type="button" className="tutor-button tutor-button-soft" onClick={() => setStudentDraft(null)}>{text.cancel}</button><button type="submit" className="tutor-button tutor-button-primary" disabled={saving}>{text.save}</button></div>
        </form>
      </dialog>}

      {selectedStudent && <dialog ref={profileRef} className="tutor-dialog tutor-profile-dialog" aria-labelledby="tutor-profile-title" onCancel={(event) => { event.preventDefault(); setProfileId(null); }} onClick={(event) => { if (event.target === event.currentTarget) setProfileId(null); }}>
        <div className="tutor-dialog-content">
          <div className="tutor-dialog-heading"><div><p className="tutor-eyebrow">{text.studentProfile}</p><h2 id="tutor-profile-title">{selectedStudent.name}</h2></div><button type="button" className="tutor-dialog-close" aria-label={text.close} onClick={() => setProfileId(null)}>×</button></div>
          <section className="tutor-profile-overview"><div><h3>{text.contactDetails}</h3><p>{text.course}: <strong>{selectedStudent.course}</strong></p><p>{text.phone}: <strong>{selectedStudent.phone || selectedStudent.phoneNumber || selectedStudent.username || '—'}</strong></p>{selectedStudent.parentContact && <p>{text.parentContact}: <strong>{selectedStudent.parentContact}</strong></p>}<p>{text.group}: <strong>{classNameForStudent(selectedStudent)}</strong></p></div>{selectedStudent.courseFee === null ? <div className="tutor-balance-box"><span>{text.noPlan}</span><button type="button" className="tutor-button tutor-button-primary" onClick={() => openPaymentPlan(selectedStudent)}>{text.setupPlan}</button></div> : <div className="tutor-balance-box"><span>{text.balance}</span><strong>{money(balanceFor(selectedStudent))}</strong><span>{text.courseFee}: {money(selectedStudent.courseFee)}</span><button type="button" className="tutor-button tutor-button-soft" onClick={() => openPaymentPlan(selectedStudent)}>{text.editPlan}</button></div>}</section>

          <section className="tutor-profile-section"><div className="tutor-inline-heading"><h3>{text.assessments}</h3><button type="button" className="tutor-button tutor-button-soft" onClick={() => setAssessmentDraft({ studentId: selectedStudent.id, entries: [...(assessmentDraft?.entries || []), { id: makeId(), label: '', score: '' }] })}>{text.addAssessment}</button></div>
            <form className="tutor-assessment-editor" onSubmit={saveAssessments}>
              {(assessmentDraft?.entries || []).map((assessment, index) => <div className="tutor-assessment-fields" key={assessment.id || index}>
                <label>{text.assessmentLabel}<input required maxLength={80} value={assessment.label} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, entries: assessmentDraft.entries.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry) })} /></label>
                <label>{text.score}<input required type="number" min="0" max="100" step="any" value={assessment.score} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, entries: assessmentDraft.entries.map((entry, itemIndex) => itemIndex === index ? { ...entry, score: event.target.value } : entry) })} /></label>
                <button type="button" className="tutor-button tutor-button-danger" aria-label={`${text.delete}: ${assessment.label || text.assessmentLabel}`} onClick={() => setAssessmentDraft({ ...assessmentDraft, entries: assessmentDraft.entries.filter((_, itemIndex) => itemIndex !== index) })}>{text.delete}</button>
              </div>)}
              <button className="tutor-button tutor-button-primary" type="submit" disabled={saving}>{text.save}</button>
            </form>
            {selectedStudent.assessments?.length > 0 && !(assessmentDraft?.entries || []).length && <div className="tutor-score-list">{selectedStudent.assessments.map((assessment) => <div className="tutor-score" key={assessment.id}><span>{assessment.label}</span><strong>{assessment.score}/100</strong></div>)}</div>}
          </section>

          {selectedStudent.courseFee !== null && <section className="tutor-profile-section"><h3>{text.installmentProgress}</h3><div className="tutor-installments">{installmentsFor(selectedStudent).map((installment) => <div className="tutor-installment" key={installment.index}>
            <span>{text.installment} {installment.index}</span><span>{money(installment.paid)} / {money(installment.amount)}</span><span className={installment.remaining === 0 ? 'tutor-status-paid' : 'tutor-status-open'}>{installment.remaining === 0 ? text.paid : `${text.open}: ${money(installment.remaining)}`}</span>
          </div>)}</div></section>}

          {selectedStudent.courseFee !== null && <section className="tutor-profile-section"><h3>{text.recordPayment}</h3><form className="tutor-payment-form" onSubmit={recordPayment}>
            <label>{text.paymentAmount}<input required type="number" min="0.01" max={balanceFor(selectedStudent)} step="0.01" value={paymentDraft.amount} onChange={(event) => setPaymentDraft({ ...paymentDraft, amount: event.target.value })} /></label>
            <button type="submit" className="tutor-button tutor-button-primary" disabled={saving || balanceFor(selectedStudent) <= 0}>{text.addPayment}</button>
          </form></section>}

          {selectedStudent.courseFee !== null && <section className="tutor-profile-section"><h3>{text.paymentHistory}</h3>
            {selectedStudent.payments?.length ? <div className="tutor-payment-history">{[...selectedStudent.payments].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((payment) => <div className="tutor-payment-row" key={payment.id}><span>{formatDate(payment.date, lang)}</span><strong>{money(payment.amount)}</strong><button type="button" className="tutor-button tutor-button-danger" disabled={saving} onClick={() => deletePayment(selectedStudent, payment)}>{text.delete}</button></div>)}</div> : <p className="tutor-group-empty">{text.noPayments}</p>}
          </section>}
          <div className="tutor-dialog-actions tutor-profile-actions"><button type="button" className="tutor-button tutor-button-plain" disabled={Boolean(resettingStudentId)} onClick={() => createPasswordResetLink(selectedStudent)}>{text.changePassword}</button><button type="button" className="tutor-button tutor-button-danger" disabled={saving} onClick={() => deleteStudent(selectedStudent)}>{text.deleteStudent}</button><button type="button" className="tutor-button tutor-button-soft" onClick={() => setProfileId(null)}>{text.close}</button></div>
        </div>
      </dialog>}

      {resetLinkModal && <dialog ref={resetLinkRef} className="tutor-dialog tutor-reset-dialog" aria-labelledby="tutor-reset-title" onCancel={(event) => { event.preventDefault(); setResetLinkModal(null); setResetLinkError(''); }} onClick={(event) => { if (event.target === event.currentTarget) { setResetLinkModal(null); setResetLinkError(''); } }}>
        <div className="tutor-dialog-content">
          <div className="tutor-dialog-heading"><div><p className="tutor-eyebrow">{text.changePassword}</p><h2 id="tutor-reset-title">{resetLinkModal.studentName}</h2></div><button type="button" className="tutor-dialog-close" aria-label={text.close} onClick={() => { setResetLinkModal(null); setResetLinkError(''); }}>×</button></div>
          <p className="tutor-subtitle">{text.passwordLinkHelp}</p>
          {resettingStudentId && <p className="tutor-empty" role="status">{text.loading}</p>}
          {resetLinkError && <div className="tutor-load-error" role="alert"><p>{resetLinkError}</p><button type="button" className="tutor-button tutor-button-soft" onClick={() => { const student = workspace.students.find((entry) => entry.id === resetLinkModal.studentId); if (student) createPasswordResetLink(student); }}>{text.retry}</button></div>}
          {resetLinkModal.url && <label className="tutor-reset-link-field">{text.passwordLinkLabel}<input type="url" readOnly value={resetLinkModal.url} onFocus={(event) => event.target.select()} /></label>}
          <div className="tutor-dialog-actions"><button type="button" className="tutor-button tutor-button-soft" onClick={() => { setResetLinkModal(null); setResetLinkError(''); }}>{text.close}</button>{resetLinkModal.url && <button type="button" className="tutor-button tutor-button-primary" onClick={copyPasswordResetLink}>{resetLinkCopied ? text.passwordLinkCopied : text.copy}</button>}</div>
        </div>
      </dialog>}
    </main>
  );
}
