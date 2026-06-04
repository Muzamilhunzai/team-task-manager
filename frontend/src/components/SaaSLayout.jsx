import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiChartPie,
  HiCollection,
  HiCube,
  HiUsers,
  HiMail,
  HiCog,
  HiSearch,
  HiSun,
  HiMoon
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: HiChartPie },
  { key: 'tasks', label: 'Tasks', href: '/tasks', icon: HiCollection },
  { key: 'projects', label: 'Projects', href: '/projects', icon: HiCube },
  { key: 'teams', label: 'Teams', href: '/teams', icon: HiUsers },
  { key: 'invitations', label: 'Invitations', href: '/invitations', icon: HiMail },
  { key: 'settings', label: 'Settings', href: '/settings', icon: HiCog }
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('tm_dark_mode');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tm_dark_mode', String(dark));
  }, [dark]);

  return { dark, setDark };
}

export default function SaaSLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, setDark } = useDarkMode();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeKey = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    const match = navItems.find((x) => x.href === path);
    return match?.key ?? 'dashboard';
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = () => {
    setSearchOpen(false);
    setMobileNavOpen(false);
    navigate('/dashboard');
    setSearchValue('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-0 z-50 md:z-auto h-screen w-72 overflow-y-auto bg-[#1e1e2f]/95 backdrop-blur border-r border-white/10 transition-transform duration-200 md:translate-x-0 flex flex-col ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="TeamTasker"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-lg text-white">TeamTasker</div>
                <div className="text-xs text-white/50">SaaS workspace</div>
              </div>
            </Link>
          </div>

          <div className="px-3 mt-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mx-1 mb-1 ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                      : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 mt-auto">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#252538] border border-white/10">
              <div className="flex items-center gap-3">
                <img 
                  src={user?.avatar_url} 
                  alt={user?.username} 
                  className="w-8 h-8 rounded-full object-cover bg-white/10"
                />
                <div>
                  <div className="text-sm font-semibold text-white truncate w-24">{user?.username}</div>
                  <div className="text-xs text-white/50 capitalize">{user?.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top Navbar */}
          <div className="sticky top-0 z-30 bg-[#1e1e2f]/80 backdrop-blur border-b border-white/10">
            <div className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </svg>
                </button>

                <div className="hidden sm:block">
                  <div className="text-xs text-white/50 uppercase tracking-wider">Workspace</div>
                  <div className="text-lg font-semibold text-white">Task Manager</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
                >
                  <HiSearch className="w-4 h-4" />
                  Search tasks
                </button>

                <button
                  onClick={() => setDark((v) => !v)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                  aria-label="Toggle dark mode"
                >
                  {dark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
                </button>

                {/* Custom Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    <img
                      src={user?.avatar_url}
                      alt={user?.username}
                      className="w-8 h-8 rounded-full object-cover bg-white/10 border border-white/10"
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1e1e2f] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-sm font-semibold text-white">{user?.username}</div>
                        <div className="text-xs text-white/50 capitalize">{user?.role}</div>
                      </div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e1e2f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Search</h3>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full bg-[#252538] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                />
              </div>
              <p className="text-xs text-white/40">
                Search is UI-only in this upgrade (current backend doesn't provide a generic search endpoint).
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
              <button
                onClick={() => setSearchOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSearchSubmit}
                className="px-4 py-2 rounded-lg text-sm bg-white text-[#1e1e2f] font-medium hover:bg-white/90 transition-all"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}