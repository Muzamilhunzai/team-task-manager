import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaGoogle } from 'react-icons/fa';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(username, email, password, role);
    if (success) navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="bg-[#1e1e2f] text-white my-5 mx-auto w-full max-w-[400px] rounded-2xl shadow-2xl border border-white/10">
        <div className="p-8 flex flex-col items-center w-full">
          
          <h2 className="font-bold mb-2 uppercase tracking-widest text-2xl text-center">Join TeamTasker</h2>
          <p className="text-white/50 mb-8 text-center">Start managing your teams effectively</p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            
            <div className="mb-4 w-full px-4 relative">
              <FiUser className="absolute left-7 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-white border border-white/30 rounded-lg py-3 pl-12 pr-4 placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
                placeholder="Username"
                required
              />
            </div>

            <div className="mb-4 w-full px-4 relative">
              <FiMail className="absolute left-7 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-white border border-white/30 rounded-lg py-3 pl-12 pr-4 placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
                placeholder="Email address"
                required
              />
            </div>

            <div className="mb-4 w-full px-4 relative">
              <FiLock className="absolute left-7 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white border border-white/30 rounded-lg py-3 pl-12 pr-4 placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
                placeholder="Password"
                required
              />
            </div>

            <div className="mb-4 w-full px-4">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#1e1e2f] text-white border border-white/30 rounded-lg py-3 px-4 focus:outline-none focus:border-white/60 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
                required
              >
                <option value="user" className="bg-[#1e1e2f]">Simple User</option>
                <option value="admin" className="bg-[#1e1e2f]">Admin</option>
              </select>
              <p className="text-xs text-white/40 mt-2">
                {role === 'admin' 
                  ? 'Admins can create and assign tasks.' 
                  : 'Users can only view and update status of assigned tasks.'}
              </p>
            </div>

            <button 
              type="submit" 
              className="mx-2 px-8 py-3 border-2 border-white/80 text-white rounded-full text-lg font-medium hover:bg-white hover:text-[#1e1e2f] transition-all duration-300"
            >
              Create Account
            </button>

            

            <div className="text-center pt-9">
              <p className="mb-0 text-white/70">
                Already have an account?{' '}
                <Link to="/login" className="text-white/90 font-bold hover:text-white transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};