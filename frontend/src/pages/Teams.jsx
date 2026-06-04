import { useState } from 'react';
import SaaSLayout from '../components/SaaSLayout';
import { TeamList } from '../components/TeamList';

export function Teams() {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <SaaSLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Teams
        </h1>
      </div>
      <TeamList
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
        onTeamChange={() => {}}
      />
    </SaaSLayout>
  );
}


