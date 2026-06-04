import { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../api';
import { format, parseISO } from 'date-fns';

export const RemindersPanel = () => {
  const [reminders, setReminders] = useState({ dueSoon: [], overdue: [] });
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && reminders.dueSoon.length === 0 && reminders.overdue.length === 0) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-white/5 rounded"></div>
          <div className="h-10 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (reminders.dueSoon.length === 0 && reminders.overdue.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 mb-6 border-l-4 border-yellow-500/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FiClock className="text-yellow-400" /> Task Reminders
        </h3>
        <button 
          onClick={fetchReminders}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
          title="Refresh reminders"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-6">
        {}
        {reminders.overdue.length > 0 && (
          <div>
            <h4 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiAlertCircle /> Overdue
            </h4>
            <div className="space-y-2">
              {reminders.overdue.map(task => (
                <div key={task.id} className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="text-xs text-red-300/70">{task.team_name}</p>
                  </div>
                  <p className="text-xs font-mono text-red-400">
                    {format(parseISO(task.due_date), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {reminders.dueSoon.length > 0 && (
          <div>
            <h4 className="text-yellow-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiClock /> Due Soon (Next 24h)
            </h4>
            <div className="space-y-2">
              {reminders.dueSoon.map(task => (
                <div key={task.id} className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="text-xs text-yellow-300/70">{task.team_name}</p>
                  </div>
                  <p className="text-xs font-mono text-yellow-400">
                    {format(parseISO(task.due_date), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
