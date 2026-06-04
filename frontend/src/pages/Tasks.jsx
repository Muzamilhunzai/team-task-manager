import { useEffect, useState } from 'react';
import SaaSLayout from '../components/SaaSLayout';
import { TaskList } from '../components/TaskList';
import { SearchFilter } from '../components/SearchFilter';
import api from '../api';
import { InviteMember } from '../components/InviteMember';
import { TeamList } from '../components/TeamList';
import { RemindersPanel } from '../components/RemindersPanel';
import { useAuth } from '../contexts/AuthContext';

export function Tasks() {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState({ type: 'team', value: null });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) fetchMembers(selectedTeam);
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (e) {
      console.error('Failed to fetch teams');
    }
  };

  const fetchMembers = async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      setMembers(response.data);
    } catch {
      setMembers([]);
    }
  };

  const getFilteredTeamId = () => {
    if (filter.type === 'team' && filter.value) return filter.value;
    return selectedTeam;
  };

  const getFilterParams = () => {
    if (filter.type === 'assignee' && filter.value) {
      return { assigneeId: filter.value };
    }
    return { teamId: getFilteredTeamId() };
  };

  return (
    <SaaSLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Tasks
        </h1>
        <p className="text-gray-600 dark:text-white/60 mt-1">
          Work items across your teams. Signed in as {user?.username}.
        </p>
      </div>

      <RemindersPanel key={refreshTrigger} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamList
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            onTeamChange={() => {
              fetchTeams();
              setRefreshTrigger((p) => p + 1);
            }}
          />
          {user?.role === 'admin' && <InviteMember />}
        </div>

        <div className="lg:col-span-2">
          <SearchFilter
            onSearch={() => {}}
            onFilterChange={setFilter}
            teams={teams}
            members={members}
          />

          <TaskList
            teamId={getFilteredTeamId()}
            refreshTrigger={refreshTrigger}
            filterParams={getFilterParams()}
          />
        </div>
      </div>
    </SaaSLayout>
  );
}


