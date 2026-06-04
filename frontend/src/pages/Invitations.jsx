import { useState, useEffect } from 'react';
import SaaSLayout from '../components/SaaSLayout';
import api from '../api';
import toast from 'react-hot-toast';
import { FiMail, FiCheck, FiX, FiClock, FiSend } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export function Invitations() {
  const { user } = useAuth();
  const [myInvites, setMyInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRes = await api.get('/invitations/my');
      setMyInvites(myRes.data);

      if (isAdmin) {
        const sentRes = await api.get('/invitations/sent');
        setSentInvites(sentRes.data);
      }
    } catch (err) {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/invitations/${id}/${action}`);
      toast.success(`Invitation ${action}ed`);
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${action} invitation`);
    }
  };

  if (loading) {
    return (
      <SaaSLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/20" />
        </div>
      </SaaSLayout>
    );
  }

  return (
    <SaaSLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Invitations</h1>
        <p className="text-white/60 mt-1">Manage your team requests and sent invitations.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Requests for User */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FiMail className="text-indigo-400" /> Pending Requests
          </h2>
          <div className="space-y-4">
            {myInvites.map((invite) => (
              <div key={invite.id} className="glass-card p-5 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{invite.team_name}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      Invited by <span className="text-indigo-300 font-medium">{invite.sender_name}</span>
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                      <FiClock /> {new Date(invite.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(invite.id, 'accept')}
                      className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-all border border-emerald-500/20"
                      title="Accept"
                    >
                      <FiCheck size={20} />
                    </button>
                    <button
                      onClick={() => handleAction(invite.id, 'decline')}
                      className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all border border-red-500/20"
                      title="Decline"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {myInvites.length === 0 && (
              <div className="glass-card p-8 text-center text-white/40 border-dashed">
                No pending invitations at the moment.
              </div>
            )}
          </div>
        </div>

        {/* Sent Invitations Tracker for Admins */}
        {isAdmin && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiSend className="text-violet-400" /> Sent Invitations
            </h2>
            <div className="space-y-4">
              {sentInvites.map((invite) => (
                <div key={invite.id} className="glass-card p-5">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="font-bold text-white">{invite.email}</h3>
                      <p className="text-white/50 text-sm">Team: {invite.team_name}</p>
                    </div>
                    <div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-bold border
                        ${invite.status === 'ACCEPTED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                          invite.status === 'DECLINED' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'}
                      `}>
                        {invite.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {sentInvites.length === 0 && (
                <div className="glass-card p-8 text-center text-white/40 border-dashed">
                  You haven't sent any invitations yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SaaSLayout>
  );
}
