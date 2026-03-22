import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useFinancialHealth } from '@/hooks/useFinancialHealth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import clsx from 'clsx';

const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({ score, color, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
      </div>
    </div>
  );
};

const ComponentBar: React.FC<{ label: string; score: number; status: string }> = ({ label, score, status }) => {
  const barColor = status === 'excellent' || status === 'good'
    ? 'bg-emerald-500'
    : status === 'needs_work'
      ? 'bg-amber-500'
      : status === 'critical'
        ? 'bg-red-500'
        : 'bg-gray-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{score}</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const DashboardHealthWidget: React.FC = () => {
  const { health, loading, getScoreRingColor, getStatusBadgeVariant } = useFinancialHealth();

  if (loading) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Financial Health</h3>
        </div>
        <Badge variant={getStatusBadgeVariant(health.score >= 80 ? 'excellent' : health.score >= 60 ? 'good' : health.score >= 40 ? 'needs_work' : 'critical')} size="sm">
          Grade {health.grade}
        </Badge>
      </div>

      <div className="flex items-start gap-6">
        <ScoreRing score={health.score} color={getScoreRingColor(health.score)} />

        <div className="flex-1 space-y-2.5 min-w-0">
          {health.components.map((comp) => (
            <ComponentBar
              key={comp.name}
              label={comp.label}
              score={comp.rawScore}
              status={comp.status}
            />
          ))}
        </div>
      </div>

      {health.recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {health.recommendations.slice(0, 2).map((rec, idx) => (
              <div
                key={idx}
                className={clsx(
                  'text-xs px-3 py-2 rounded-lg',
                  rec.type === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : rec.type === 'critical'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                )}
              >
                {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/health"
        className="mt-3 flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
      >
        View Details <ArrowRightIcon className="h-3 w-3" />
      </Link>
    </Card>
  );
};

export default DashboardHealthWidget;
