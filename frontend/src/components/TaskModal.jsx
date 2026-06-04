import { useState, useEffect } from 'react';
import api from '../api';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function TaskModal({ task, teamId, onClose, onSuccess }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    due_date: '',
    assignee_id: '',
    team_id: teamId
  });
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchTeams();
    }
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        due_date: task.due_date ? task.due_date.slice(0, 16) : '',
        assignee_id: task.assignee_id || '',
        team_id: task.team_id || teamId
      });
    }
  }, [task, teamId, isAdmin]);

  useEffect(() => {
    if (formData.team_id && isAdmin) {
      fetchMembers(formData.team_id);
    }
  }, [formData.team_id, isAdmin]);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams');
    }
  };

  const fetchMembers = async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      setMembers(response.data);
    } catch (error) {
      setMembers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only admins can edit task details');
      return;
    }
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, formData);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', formData);
        toast.success('Task created');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save task');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{task ? (isAdmin ? 'Edit Task' : 'Task Details') : 'Create Task'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><FiX /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="input-glass"
            required
            disabled={!isAdmin}
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="input-glass"
            rows="3"
            disabled={!isAdmin}
          />
          
          {isAdmin && (
            <select
              value={formData.team_id}
              onChange={e => setFormData({...formData, team_id: parseInt(e.target.value), assignee_id: ''})}
              className="input-glass"
              required
            >
              <option value="">Select Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          )}
          
          {isAdmin && (
            <select
              value={formData.assignee_id}
              onChange={e => setFormData({...formData, assignee_id: e.target.value ? parseInt(e.target.value) : null})}
              className="input-glass"
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.username}</option>
              ))}
            </select>
          )}
          
          <input
            type="datetime-local"
            value={formData.due_date}
            onChange={e => setFormData({...formData, due_date: e.target.value})}
            className="input-glass"
            disabled={!isAdmin}
          />
          
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
            className="input-glass"
            disabled={!isAdmin}
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <div className="flex gap-3 pt-4">
            {isAdmin && <button type="submit" className="btn-primary flex-1">Save</button>}
            <button type="button" onClick={onClose} className={isAdmin ? "btn-secondary" : "btn-primary w-full"}>
              {isAdmin ? 'Cancel' : 'Close'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}