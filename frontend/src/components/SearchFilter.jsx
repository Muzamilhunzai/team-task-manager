import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

export const SearchFilter = ({ onSearch, onFilterChange, teams, members }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('team');
  const [filterValue, setFilterValue] = useState('');

  const handleSearch = (value) => {
    setSearch(value);
    onSearch(value);
  };

  const handleFilterChange = (type, value) => {
    setFilterType(type);
    setFilterValue(value);
    onFilterChange({ type, value: value ? parseInt(value) : null });
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-glass pl-10 w-full"
          />
        </div>
        
        <div className="flex gap-3 items-center">
          <FiFilter className="text-white/60" />
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value, filterValue)}
            className="input-glass px-3 py-2"
          >
            <option value="team">Filter by Team</option>
            <option value="assignee">Filter by Assignee</option>
          </select>
          
          <select
            value={filterValue}
            onChange={(e) => handleFilterChange(filterType, e.target.value)}
            className="input-glass px-3 py-2"
          >
            <option value="">All</option>
            {filterType === 'team' && teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
            {filterType === 'assignee' && members.map(member => (
              <option key={member.id} value={member.id}>{member.username}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};