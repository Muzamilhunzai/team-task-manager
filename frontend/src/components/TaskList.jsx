import { useState, useEffect } from 'react';
import api from '../api';
import { FiEdit2, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import TaskModal from './TaskModal';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export const TaskList = ({ teamId, refreshTrigger }) => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [teamId, refreshTrigger]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = teamId ? `/tasks?teamId=${teamId}` : '/tasks';
      const response = await api.get(url);
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task ${newStatus}`);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'declined': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDueStatus = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    if (isAfter(now, due)) return { icon: FiAlertCircle, color: 'text-red-400', text: 'Overdue' };
    if (differenceInDays(due, now) <= 1) return { icon: FiClock, color: 'text-orange-400', text: 'Due soon' };
    return null;
  };

  if (loading) {
    return <div className="glass-card p-8 text-center">Loading tasks...</div>;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all duration-300 flex items-center gap-2 group"
          >
            <FiPlus className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Task</span>
          </button>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map(task => {
          const DueIcon = getDueStatus(task.due_date);
          return (
            <div key={task.id} className="glass-card p-4 hover:bg-white/5 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {DueIcon && (
                      <span className={`flex items-center gap-1 text-xs ${DueIcon.color}`}>
                        <DueIcon.icon size={12} /> {DueIcon.text}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-white/70 text-sm mb-2">{task.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-white/50">
                    <span>Assignee: {task.assignee_name || 'Unassigned'}</span>
                    {task.due_date && (
                      <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                    )}
                    <span>Team: {task.team_name || `Team ${task.team_id}`}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 transition-all">
                  {}
                  {!isAdmin && task.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(task.id, 'accepted')}
                        className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 flex items-center gap-1 text-xs"
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(task.id, 'declined')}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 flex items-center gap-1 text-xs"
                      >
                        <FiX /> Decline
                      </button>
                    </>
                  )}

                  {!isAdmin && task.status === 'accepted' && (
                    <button
                      onClick={() => updateStatus(task.id, 'in_progress')}
                      className="p-2 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-lg text-yellow-400 flex items-center gap-1 text-xs"
                    >
                      <FiClock /> Start
                    </button>
                  )}

                  {!isAdmin && task.status === 'in_progress' && (
                    <button
                      onClick={() => updateStatus(task.id, 'completed')}
                      className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 flex items-center gap-1 text-xs"
                    >
                      <FiCheckCircle /> Complete
                    </button>
                  )}

                  {}
                  {isAdmin && task.created_by === user.id && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400"
                        title="Edit Task"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                        title="Delete Task"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="glass-card p-8 text-center text-white/50">
            {isAdmin ? "No tasks yet. Create your first task!" : "No tasks assigned to you yet."}
          </div>
        )}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          teamId={teamId}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}

      {showCreateModal && (
        <TaskModal
          task={null}
          teamId={teamId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTasks();
          }}
        />
      )}
    </>
  );
};