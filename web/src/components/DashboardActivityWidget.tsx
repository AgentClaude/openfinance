import { useQuery } from '@apollo/client';
import { GET_ACTIVITY_FEED } from '@/graphql/queries';
import { Link } from 'react-router-dom';
import { ACTION_ICONS } from '@/constants/activityConstants';

interface ActivityEvent {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DashboardActivityWidget() {
  const { data, loading } = useQuery(GET_ACTIVITY_FEED, {
    variables: { limit: 8 },
    fetchPolicy: 'cache-and-network',
  });

  const events: ActivityEvent[] = data?.activityFeed || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <Link to="/activity" className="text-xs text-brand-700 dark:text-brand-400 hover:underline">
          View All
        </Link>
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No recent activity.</p>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">{ACTION_ICONS[event.action] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  <span className="font-medium">{event.user.name || event.user.email.split('@')[0]}</span>
                  {' '}
                  {event.description}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                {timeAgo(event.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
