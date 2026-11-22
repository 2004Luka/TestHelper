import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const toCents = (amount) => Math.round((Number(amount) || 0) * 100);

function getInstallments(billing) {
  const count = Math.max(1, Math.min(36, Number(billing.installmentCount) || 1));
  const total = toCents(billing.courseFee);
  const standard = Math.floor(total / count);
  let remainingPaid = (billing.payments || []).reduce((sum, payment) => sum + toCents(payment.amount), 0);
  return Array.from({ length: count }, (_, index) => {
    const dueCents = standard + (index < total % count ? 1 : 0);
    const paidCents = Math.min(dueCents, remainingPaid);
    remainingPaid = Math.max(0, remainingPaid - paidCents);
    return { number: index + 1, due: dueCents / 100, paid: paidCents / 100, remaining: (dueCents - paidCents) / 100 };
  });
}

function formatDate(value, locale) {
  const datePart = String(value || '').slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? new Date(`${datePart}T00:00:00.000Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export default function StudentBilling() {
  const { student, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const locale = lang === 'ka' ? 'ka-GE' : 'en-US';
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!student) { setLoading(false); return () => { mounted = false; }; }
    setLoading(true);
    setError(false);
    api.get('/students/me')
      .then((response) => { if (mounted) setStudentRecord(response.data); })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [student, reloadVersion]);

  const billing = studentRecord?.billing || null;
  const payments = billing?.payments || [];
  const totals = useMemo(() => {
    const received = payments.reduce((sum, payment) => sum + toCents(payment.amount), 0) / 100;
    return { received, balance: Math.max(0, toCents(billing?.courseFee) - toCents(received)) / 100 };
  }, [payments, billing?.courseFee]);
  const installments = billing ? getInstallments(billing) : [];
  const currency = ['GEL', 'USD', 'EUR', 'GBP'].includes(billing?.currency) ? billing.currency : 'GEL';

  function money(amount) {
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0); }
    catch { return `${Number(amount || 0).toFixed(2)} ${currency}`; }
  }

  if (authLoading) return <main className="page student-billing-page"><p>{t('studentBillingLoading')}</p></main>;
  if (!student) {
    return (
      <main className="page student-billing-page">
        <div className="card student-billing-empty">
          <h1 className="page-title">{t('studentBillingTitle')}</h1>
          <p>{t('studentLoginSubtitle')}</p>
          <Link className="btn btn-primary" to="/login">{t('navLogin')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page student-billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('studentBillingTitle')}</h1>
          <p className="page-subtitle">{t('studentBillingSubtitle')}</p>
          <p className="student-billing-course">{studentRecord?.class?.name || student?.class?.name || studentRecord?.teacher?.subject || student?.teacher?.subject || ''}</p>
        </div>
        <Link className="btn btn-secondary" to="/student/portal">{t('navStudentPortal')}</Link>
      </div>

      {loading ? <div className="card student-billing-empty">{t('studentBillingLoading')}</div> : error ? (
        <div className="inline-alert inline-alert-error student-billing-error" role="alert">
          <span>{t('studentBillingError')}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadVersion((version) => version + 1)}>{t('studentBillingRetry')}</button>
        </div>
      ) : !billing ? (
        <div className="card student-billing-empty"><p>{t('studentBillingNoPlan')}</p></div>
      ) : <>
        <section className="student-billing-summary" aria-label={t('studentBillingTitle')}>
          <article className="card student-billing-summary-card"><span>{t('studentBillingFee')}</span><strong>{money(billing.courseFee)}</strong></article>
          <article className="card student-billing-summary-card"><span>{t('studentBillingReceived')}</span><strong className="student-billing-paid">{money(totals.received)}</strong></article>
          <article className="card student-billing-summary-card"><span>{t('studentBillingBalance')}</span><strong className="student-billing-due">{money(totals.balance)}</strong></article>
        </section>

        <section className="card student-billing-panel">
          <div className="section-title"><span>{t('studentBillingPlan')}</span></div>
          <div className="student-billing-installments">
            {installments.map((installment) => <div className="student-billing-installment" key={installment.number}>
              <strong>{t('studentBillingInstallment')} {installment.number}</strong>
              <span>{money(installment.paid)} / {money(installment.due)}</span>
              <span className={installment.remaining === 0 ? 'student-billing-paid' : 'student-billing-due'}>{installment.remaining === 0 ? t('studentBillingPaid') : `${t('studentBillingDue')}: ${money(installment.remaining)}`}</span>
            </div>)}
          </div>
        </section>

        <section className="card student-billing-panel">
          <div className="section-title"><span>{t('studentBillingHistory')}</span></div>
          {payments.length ? <div className="student-billing-history">
            {[...payments].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((payment) => <div className="student-billing-payment" key={payment.id}>
              <span>{formatDate(payment.date, locale)}</span><strong>{money(payment.amount)}</strong>
            </div>)}
          </div> : <p className="student-billing-muted">{t('studentBillingNoPayments')}</p>}
        </section>
      </>}
    </main>
  );
}
