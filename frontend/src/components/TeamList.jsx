import { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AddMemberModal from './AddMemberModal';
import { useAuth } from '../contexts/AuthContext';  // ✅ Moved to top

export const TeamList = ({ selectedTeam, onSelectTeam, onTeamChange }) => {
  const [teams, setTeams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(null);
  const { user } = useAuth();  // ✅ Now works

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', { name: newTeamName, description: newTeamDesc });
      toast.success('Team created!');
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDesc('');
      fetchTeams();
      onTeamChange?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create team');
    }
  };

  const deleteTeam = async (teamId) => {
    if (!confirm('Delete this team? All tasks will be lost.')) return;
    try {
      await api.delete(`/teams/${teamId}`);
      toast.success('Team deleted');
      fetchTeams();
      if (selectedTeam === teamId) onSelectTeam(null);
      onTeamChange?.();
    } catch (error) {
      toast.error(error.response?.data?.error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Teams</h2>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="btn-secondary flex items-center gap-2">
              <FiPlus /> New Team
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {teams.map(team => (
            <div
              key={team.id}
              className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                selectedTeam === team.id ? 'bg-purple-600/50 border border-purple-400' : 'bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => onSelectTeam(team.id)}
            >
              <div className="flex-1">
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-white/50">{team.description || 'No description'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMembersModal(team); }}
                  className="p-2 hover:bg-white/10 rounded-lg"
                  title="Manage Members"
                >
                  <FiUsers />
                </button>
                {isAdmin && team.created_by === user?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                    title="Delete Team"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-white/50 text-center py-8">
              {isAdmin ? "No teams yet. Create your first team!" : "You are not a member of any teams yet."}
            </p>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Create New Team</h3>
            <form onSubmit={createTeam}>
              <input
                type="text"
                placeholder="Team Name"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                className="input-glass mb-3"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newTeamDesc}
                onChange={e => setNewTeamDesc(e.target.value)}
                className="input-glass mb-4"
                rows="3"
              />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembersModal && (
        <AddMemberModal team={showMembersModal} onClose={() => setShowMembersModal(null)} onMemberAdded={fetchTeams} />
      )}
    </>
  );
};