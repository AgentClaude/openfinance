import React, { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { RecurringItem } from '@/hooks/useRecurring';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface BillCalendarProps {
  items: RecurringItem[];
  onMarkPaid?: (id: string) => void;
  onItemClick?: (item: RecurringItem) => void;
}

/** Expand recurring items into individual occurrences for a given month */
function getOccurrencesForMonth(
  items: RecurringItem[],
  year: number,
  month: number // 0-indexed
): Map<number, RecurringItem[]> {
  const map = new Map<number, RecurringItem[]>();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // last day of month

  for (const item of items) {
    if (!item.isActive || !item.nextOccurrence) continue;

    // Calculate all occurrences of this item that fall in this month
    const dates = getItemDatesInMonth(item, year, month, monthStart, monthEnd);
    for (const day of dates) {
      const existing = map.get(day) || [];
      existing.push(item);
      map.set(day, existing);
    }
  }

  return map;
}

function getItemDatesInMonth(
  item: RecurringItem,
  year: number,
  month: number,
  _monthStart: Date,
  monthEnd: Date
): number[] {
  const dates: number[] = [];
  const next = new Date(item.nextOccurrence! + 'T00:00:00');

  // For monthly frequency, the bill falls on the same day each month
  if (item.frequency === 'monthly') {
    const dayOfMonth = next.getDate();
    const maxDay = monthEnd.getDate();
    dates.push(Math.min(dayOfMonth, maxDay));
  } else if (item.frequency === 'weekly') {
    // Every week — find all matching weekdays in this month
    const targetDay = next.getDay();
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      const dt = new Date(year, month, d);
      if (dt.getDay() === targetDay) dates.push(d);
    }
  } else if (item.frequency === 'biweekly') {
    // Every 2 weeks — find matching dates
    const targetDay = next.getDay();
    const refTime = next.getTime();
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      const dt = new Date(year, month, d);
      if (dt.getDay() !== targetDay) continue;
      const diffWeeks = Math.round((dt.getTime() - refTime) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks % 2 === 0) dates.push(d);
    }
  } else if (item.frequency === 'quarterly') {
    // Every 3 months from next occurrence
    const refMonth = next.getMonth();
    const diff = (month - refMonth + 12) % 12;
    if (diff % 3 === 0) {
      const dayOfMonth = next.getDate();
      dates.push(Math.min(dayOfMonth, monthEnd.getDate()));
    }
  } else if (item.frequency === 'yearly') {
    // Once a year
    if (next.getMonth() === month) {
      dates.push(Math.min(next.getDate(), monthEnd.getDate()));
    }
  } else {
    // Fallback: if nextOccurrence is in this month
    if (next.getFullYear() === year && next.getMonth() === month) {
      dates.push(next.getDate());
    }
  }

  return dates;
}

function getStatusForDay(
  item: RecurringItem,
  day: number,
  year: number,
  month: number
): 'paid' | 'overdue' | 'upcoming' | 'future' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const billDate = new Date(year, month, day);

  // If the bill's next occurrence is in the past relative to this date, it might be paid
  const nextOcc = item.nextOccurrence ? new Date(item.nextOccurrence + 'T00:00:00') : null;

  if (billDate < today) {
    // Past date - if the next occurrence is after this date, it was paid
    if (nextOcc && nextOcc > billDate) return 'paid';
    if (nextOcc && nextOcc <= billDate) return 'overdue';
    return 'paid';
  }

  if (billDate.getTime() === today.getTime()) {
    return 'upcoming';
  }

  // Within 3 days
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);
  if (billDate <= threeDays) return 'upcoming';

  return 'future';
}

const statusColors = {
  paid: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  overdue: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  upcoming: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  future: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const statusDotColors = {
  paid: 'bg-emerald-500',
  overdue: 'bg-red-500',
  upcoming: 'bg-amber-500',
  future: 'bg-blue-400',
};

const BillCalendar: React.FC<BillCalendarProps> = ({ items, onMarkPaid, onItemClick }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const navigateMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(null);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true });
    }

    // Next month padding (fill to 6 rows = 42 cells, or 5 rows = 35 if fits)
    const totalCells = days.length <= 35 ? 35 : 42;
    for (let d = 1; days.length < totalCells; d++) {
      days.push({ day: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Get bill occurrences for this month
  const billsByDay = useMemo(
    () => getOccurrencesForMonth(items, currentYear, currentMonth),
    [items, currentYear, currentMonth]
  );

  // Monthly summary
  const monthSummary = useMemo(() => {
    let totalExpenses = 0;
    let totalIncome = 0;
    let billCount = 0;
    billsByDay.forEach((dayItems) => {
      dayItems.forEach((item) => {
        if (item.isIncome) {
          totalIncome += item.amount;
        } else {
          totalExpenses += item.amount;
          billCount++;
        }
      });
    });
    return { totalExpenses, totalIncome, billCount };
  }, [billsByDay]);

  const isToday = (day: number) =>
    currentYear === today.getFullYear() &&
    currentMonth === today.getMonth() &&
    day === today.getDate();

  const selectedDayItems = selectedDay ? (billsByDay.get(selectedDay) || []) : [];

  return (
    <div className="space-y-4">
      {/* Month summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-gray-500 dark:text-gray-400">Paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-gray-500 dark:text-gray-400">Upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-gray-500 dark:text-gray-400">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
        </div>
        <div className="ml-auto text-gray-500 dark:text-gray-400">
          {monthSummary.billCount} bill{monthSummary.billCount !== 1 ? 's' : ''} ·{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(monthSummary.totalExpenses)}
          </span>
          {monthSummary.totalIncome > 0 && (
            <> · <span className="text-emerald-600">+{formatCurrency(monthSummary.totalIncome)}</span></>
          )}
        </div>
      </div>

      {/* Calendar header */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            {(currentYear !== today.getFullYear() || currentMonth !== today.getMonth()) && (
              <button
                onClick={goToToday}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, i) => {
            const dayBills = cell.isCurrentMonth ? (billsByDay.get(cell.day) || []) : [];
            const hasBills = dayBills.length > 0;
            const todayCell = cell.isCurrentMonth && isToday(cell.day);
            const isSelected = cell.isCurrentMonth && selectedDay === cell.day;

            return (
              <div
                key={i}
                onClick={() => {
                  if (cell.isCurrentMonth && hasBills) setSelectedDay(cell.day);
                  else if (cell.isCurrentMonth) setSelectedDay(null);
                }}
                className={`
                  relative min-h-[80px] p-1.5 border-b border-r border-gray-100 dark:border-gray-800
                  ${!cell.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-brand-500' : ''}
                  ${hasBills && cell.isCurrentMonth ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                  transition-colors
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-xs font-medium leading-6 w-6 h-6 flex items-center justify-center rounded-full
                      ${!cell.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                      ${todayCell ? 'bg-brand-600 text-white font-bold' : ''}
                    `}
                  >
                    {cell.day}
                  </span>
                  {hasBills && cell.isCurrentMonth && dayBills.length > 2 && (
                    <span className="text-[10px] text-gray-400">+{dayBills.length - 2}</span>
                  )}
                </div>

                {/* Bill pills (max 2 visible) */}
                {cell.isCurrentMonth && dayBills.slice(0, 2).map((item) => {
                  const status = getStatusForDay(item, cell.day, currentYear, currentMonth);
                  return (
                    <div
                      key={item.id}
                      className={`
                        text-[10px] leading-tight px-1.5 py-0.5 rounded mb-0.5 truncate border
                        ${statusColors[status]}
                      `}
                      title={`${item.merchantName || item.name}: ${formatCurrency(item.amount)}`}
                    >
                      {item.merchantName || item.name}
                    </div>
                  );
                })}

                {/* Dot indicators for days with bills (when no room for pills) */}
                {cell.isCurrentMonth && dayBills.length > 0 && dayBills.length <= 2 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayBills.map((item) => {
                      const status = getStatusForDay(item, cell.day, currentYear, currentMonth);
                      return (
                        <span
                          key={`dot-${item.id}`}
                          className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected day detail panel */}
      {selectedDay !== null && selectedDayItems.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
            <span className="ml-2 text-gray-400 font-normal">
              {selectedDayItems.length} bill{selectedDayItems.length !== 1 ? 's' : ''}
            </span>
          </h4>
          <div className="space-y-2">
            {selectedDayItems.map((item) => {
              const status = getStatusForDay(item, selectedDay, currentYear, currentMonth);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotColors[status]}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.merchantName || item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.category.icon} {item.category.name}
                          </span>
                        )}
                        <Badge
                          variant={status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'upcoming' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : status === 'upcoming' ? 'Due Soon' : 'Scheduled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${item.isIncome ? 'text-emerald-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {item.isIncome ? '+' : ''}{formatCurrency(item.amount)}
                    </span>
                    {onMarkPaid && (status === 'overdue' || status === 'upcoming') && !item.isIncome && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkPaid(item.id);
                        }}
                        className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                    {onItemClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Day total</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(selectedDayItems.filter(i => !i.isIncome).reduce((s, i) => s + i.amount, 0))}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BillCalendar;
