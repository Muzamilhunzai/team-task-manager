import { useState, useEffect } from 'react';
import api from '../api';
import { FiX, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function AddMemberModal({ team, onClose, onMemberAdded }) {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchMembers();
  }, [team]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/teams/${team.id}/members`);
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to fetch members');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      
      await api.post(`/teams/${team.id}/members`, { email });
      toast.success('Member added!');
      setEmail('');
      fetchMembers();
      onMemberAdded?.();
    } catch (error) {
      if (error.response?.status === 404) {
        
        if (confirm('User not found. Send a team invitation instead?')) {
          try {
            await api.post('/invitations', { email, teamId: team.id });
            toast.success('Invitation sent!');
            setEmail('');
          } catch (invError) {
            toast.error(invError.response?.data?.error || 'Failed to send invitation');
          }
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to add member');
      }
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/teams/${team.id}/members/${userId}`);
      toast.success('Member removed');
      fetchMembers();
      onMemberAdded?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const isAdmin = user?.role === 'admin';
  const canManage = isAdmin && team.created_by === user?.id;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Team Members - {team.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><FiX /></button>
        </div>

        {canManage && (
          <form onSubmit={addMember} className="mb-6">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-glass flex-1"
                required
              />
              <button type="submit" className="btn-primary flex items-center gap-2">
                <FiUserPlus /> Add
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">Note: If user doesn't exist, you can send an invitation.</p>
          </form>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {members.map(member => (
            <div key={member.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{member.username}</div>
                <div className="text-sm text-white/50">{member.email}</div>
              </div>
              {canManage && member.id !== user?.id && (
                <button onClick={() => removeMember(member.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400">
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
