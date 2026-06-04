import { useState, useEffect } from 'react';
import { FiMail, FiSend, FiLoader } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';

export const InviteMember = () => {
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/teams');
        setTeams(res.data);
        if (res.data.length > 0) setTeamId(res.data[0].id);
      } catch (err) {
        console.error('Failed to fetch teams');
      }
    };
    fetchTeams();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !teamId) return;

    setLoading(true);
    try {
      const response = await api.post('/invitations', { email, teamId });
      toast.success(response.data.message || 'Invitation sent!');
      setEmail('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Failed to send invitation';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <FiMail className="text-purple-400 text-xl" />
        </div>
        <h3 className="text-xl font-bold">Invite Member</h3>
      </div>
      
      <p className="text-white/60 text-sm mb-4">
        Enter an email to send a team invitation.
      </p>

      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Recipient Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Select Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full bg-[#1e1e2f] text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            required
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading || !email || !teamId}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <FiSend />
              Send Invitation
            </>
          )}
        </button>
      </form>
    </div>
  );
};
