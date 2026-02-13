import React from 'react';
import { useRecurring } from '@/hooks/useRecurring';
import Card from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const DashboardBillsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading } = useRecurring();

  if (loading) return null;

  const upcoming = items
    .filter(i => i.isActive && !i.isIncome && (i.dueSoon || i.overdue))
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
    })
    .slice(0, 5);

  const overdueCount = items.filter(i => i.overdue && i.isActive).length;

  return (
    <div onClick={() => navigate('/recurring')} className="cursor-pointer">
    <Card
      title="Upcoming Bills"
      className="hover:shadow-md transition-shadow"
    >
      {upcoming.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-400 py-2">
          <CalendarIcon className="h-5 w-5" />
          <span className="text-sm">No upcoming bills</span>
        </div>
      ) : (
        <div className="space-y-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {overdueCount} overdue
            </div>
          )}
          {upcoming.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.overdue ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <ClockIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-900 truncate max-w-[140px]">
                  {item.merchantName || item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
                <p className={`text-xs ${item.overdue ? 'text-red-500' : 'text-amber-500'}`}>
                  {item.overdue
                    ? 'Overdue'
                    : item.daysUntilDue === 0
                    ? 'Due today'
                    : `${item.daysUntilDue}d`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
    </div>
  );
};

export default DashboardBillsWidget;
