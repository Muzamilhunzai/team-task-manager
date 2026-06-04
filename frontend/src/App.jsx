import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useState } from "react";

import {
  FiGrid,
  FiCheckSquare,
  FiFolder,
  FiUsers,
  FiMail,
  FiSettings,
  FiLogOut,
  FiMenu
} from "react-icons/fi";

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Projects } from './pages/Projects';
import { Teams } from './pages/Teams';
import { Invitations } from './pages/Invitations';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { ProtectedRoute } from './components/ProtectedRoute';
import SaaSLayout from './components/SaaSLayout';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/invitations" element={<Invitations />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  );
}

/*
  Legacy layout code kept below intentionally (not rendered) to minimize risk of breaking
  other components while we fix routing/loading-screen issues.
*/
function AppLayout() {
  const auth = useAuth(); // SAFE ACCESS (prevents crash)
  const user = auth?.user;
  const logout = auth?.logout;

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  const links = [
    { label: "Dashboard", path: "/dashboard", icon: <FiGrid /> },
    { label: "My Tasks", path: "/tasks", icon: <FiCheckSquare /> },
    { label: "Projects", path: "/projects", icon: <FiFolder /> },
    { label: "Team", path: "/teams", icon: <FiUsers /> },
    { label: "Invitations", path: "/invitations", icon: <FiMail /> },
    { label: "Settings", path: "/settings", icon: <FiSettings /> }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      
      {/* BACKDROP FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-50
          top-0 left-0
          h-screen w-72
          bg-zinc-900 border-r border-zinc-800
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="h-16 px-6 flex items-center border-b border-zinc-800">
          <h1 className="text-xl font-bold">TeamTasker 98</h1>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? "bg-indigo-600" : "hover:bg-zinc-800"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <FiMenu size={22} />
            </button>

            <h2 className="font-semibold">Workspace</h2>
          </div>

          <div className="flex items-center gap-4">
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {user?.username || "User"}
              </div>
              <div className="text-xs text-zinc-400 capitalize">
                {user?.role || "member"}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-zinc-800"
            >
              <FiLogOut />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}