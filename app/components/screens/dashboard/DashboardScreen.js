'use client';

import { WEEKDAYS } from '../../../../lib/record-types';
import { getTodayAsIsoDate, getTodaysWeekdayKey } from '../../../helpers/formatting';
import { getAmountStillOwed, sumOf } from '../../../helpers/money';
import { useAppContext } from '../../AppContext';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatCard } from '../../ui/StatCard';
import { StatusBadge } from '../../ui/StatusBadge';

/** How many upcoming agenda items and unpaid invoices the dashboard lists. */
const DASHBOARD_LIST_LENGTH = 5;

/**
 * The home screen: headline numbers, today's classes, the next agenda items,
 * students per class and the most recent unpaid invoices.
 * Cards that contain money or discipline data only appear for roles allowed to see them.
 */
export function DashboardScreen() {
  const { translate, canView, formatMoney, formatDate, schoolData } = useAppContext();
  const { students, teachers, classNames, invoices, schedule, agenda, discipline, staffNames } =
    schoolData;

  // Which cards this user is allowed to see (rules live in lib/permissions.js).
  const mayViewTeachers = canView('teachers');
  const mayViewAccounting = canView('accounting');
  const mayViewDiscipline = canView('discipline');

  const todayWeekdayKey = getTodaysWeekdayKey(WEEKDAYS);
  const todayIsoDate = getTodayAsIsoDate();

  const activeStudents = students.filter((student) => student.status === 'active');
  const activeStaffCount = teachers.filter((teacher) => teacher.status === 'active').length;
  const openDisciplineCases = discipline.filter((incident) => incident.status === 'open').length;

  // Money
  const totalBilled = sumOf(invoices, 'total_amount');
  const totalCollected = sumOf(invoices, 'paid_amount');
  const totalOutstanding = totalBilled - totalCollected;

  // Active students counted per class, biggest class first: [['Class 1', 12], ['Class 2', 9], ...]
  const studentCountByClass = activeStudents.reduce((counts, student) => {
    counts[student.class_name] = (counts[student.class_name] || 0) + 1;
    return counts;
  }, {});
  const studentCountsSortedLargestFirst = Object.entries(studentCountByClass).sort(
    (classA, classB) => classB[1] - classA[1],
  );
  const largestClassSize = Math.max(
    1,
    ...studentCountsSortedLargestFirst.map(([, count]) => count),
  );

  const todaysPeriods = schedule
    .filter((period) => period.weekday === todayWeekdayKey)
    .sort((periodA, periodB) => periodA.start_time.localeCompare(periodB.start_time));

  const upcomingAgendaItems = agenda
    .filter((agendaItem) => agendaItem.event_date >= todayIsoDate)
    .sort((itemA, itemB) => itemA.event_date.localeCompare(itemB.event_date))
    .slice(0, DASHBOARD_LIST_LENGTH);

  // The newest invoices that still have a balance, newest first.
  const recentUnpaidInvoices = invoices
    .filter((invoice) => getAmountStillOwed(invoice) > 0)
    .slice(-DASHBOARD_LIST_LENGTH)
    .reverse();

  const findStaffName = (teacherId) =>
    staffNames.find((staffMember) => staffMember.id === teacherId)?.name || '';
  const findStudentName = (studentId) => students.find((student) => student.id === studentId)?.name;

  return (
    <>
      <div className="stat-grid">
        <StatCard
          iconName="students"
          value={activeStudents.length}
          label={translate('dashboard.activeStudents')}
        />
        {mayViewTeachers && (
          <StatCard
            iconName="teachers"
            value={activeStaffCount}
            label={translate('dashboard.activeStaff')}
          />
        )}
        <StatCard
          iconName="academic"
          value={classNames.length}
          label={translate('academic.classes')}
        />
        {mayViewAccounting && (
          <>
            <StatCard
              iconName="money"
              value={formatMoney(totalCollected)}
              label={translate('dashboard.feesCollected')}
            />
            <StatCard
              iconName="warning"
              value={formatMoney(totalOutstanding)}
              label={translate('dashboard.feesOutstanding')}
            />
          </>
        )}
        {mayViewDiscipline && (
          <StatCard
            iconName="administrative"
            value={openDisciplineCases}
            label={translate('dashboard.openCases')}
          />
        )}
      </div>

      <div className="two-column-grid two-column-grid--wide-cards">
        <section className="card">
          <h2 className="card-title">
            {translate('dashboard.today')} · {translate(`option.${todayWeekdayKey}`)}
          </h2>
          <ResponsiveTable
            emptyMessage={translate('common.emptyState')}
            rows={todaysPeriods}
            columns={[
              {
                heading: translate('field.start_time'),
                renderCell: (period) => `${period.start_time}–${period.end_time}`,
              },
              { heading: translate('field.class_name'), renderCell: (period) => period.class_name },
              {
                heading: translate('field.subject_name'),
                renderCell: (period) => period.subject_name,
              },
              {
                heading: translate('field.teacher_id'),
                renderCell: (period) => findStaffName(period.teacher_id),
              },
            ]}
          />
        </section>

        <section className="card">
          <h2 className="card-title">{translate('dashboard.upcomingAgenda')}</h2>
          <ResponsiveTable
            emptyMessage={translate('common.emptyState')}
            rows={upcomingAgendaItems}
            columns={[
              {
                heading: translate('field.date'),
                renderCell: (item) => formatDate(item.event_date),
              },
              { heading: translate('field.title'), renderCell: (item) => item.title },
              {
                heading: translate('field.category'),
                renderCell: (item) => (
                  <StatusBadge>{translate(`option.${item.category}`)}</StatusBadge>
                ),
              },
            ]}
          />
        </section>

        <section className="card">
          <h2 className="card-title">{translate('dashboard.studentsPerClass')}</h2>
          {studentCountsSortedLargestFirst.length === 0 ? (
            <div className="empty-state">{translate('common.emptyState')}</div>
          ) : (
            <div className="bar-chart">
              {studentCountsSortedLargestFirst.map(([className, studentCount]) => (
                <div className="bar-chart-row" key={className}>
                  <span className="bar-chart-label">{className}</span>
                  <span className="bar-chart-track">
                    <span
                      className="bar-chart-fill"
                      style={{ width: `${(studentCount / largestClassSize) * 100}%` }}
                    />
                  </span>
                  <span className="bar-chart-count">{studentCount}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {mayViewAccounting && (
          <section className="card">
            <h2 className="card-title">{translate('dashboard.recentUnpaidInvoices')}</h2>
            <ResponsiveTable
              emptyMessage={translate('common.emptyState')}
              rows={recentUnpaidInvoices}
              columns={[
                {
                  heading: translate('field.invoice_number'),
                  renderCell: (invoice) => invoice.invoice_number,
                },
                {
                  heading: translate('field.student'),
                  renderCell: (invoice) => findStudentName(invoice.student_id),
                },
                {
                  heading: translate('accounting.outstanding'),
                  renderCell: (invoice) => (
                    <span className="amount-due">{formatMoney(getAmountStillOwed(invoice))}</span>
                  ),
                },
              ]}
            />
          </section>
        )}
      </div>
    </>
  );
}
