import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaGoogle } from 'react-icons/fa';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/');
  };

  const handleDemoLogin = async (role) => {
    
    const demo = role === 'admin'
      ? { email: 'admin-demo@example.com', password: 'password123' }
      : { email: 'demo@example.com', password: 'password123' };

    setEmail(demo.email);
    setPassword(demo.password);

    const success = await login(demo.email, demo.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="bg-[#1e1e2f] text-white my-5 mx-auto w-full max-w-[400px] rounded-2xl shadow-2xl border border-white/10">
        <div className="p-8 flex flex-col items-center w-full">
          
          <h2 className="font-bold mb-2 uppercase tracking-widest text-2xl">Login</h2>
          <p className="text-white/50 mb-8 text-center">Please enter your login and password!</p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            
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

            <div className="w-full px-4 mb-6 text-right">
              <Link to="/forgot-password" className="text-sm text-white/50 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="w-full flex gap-3 pb-9">
              <button 
                type="button"
                onClick={() => handleDemoLogin('user')}
                className="flex-1 px-6 py-3 border-2 border-white/30 text-white/90 rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300"
              >
                Demo as User
              </button>
              <button 
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex-1 px-6 py-3 border-2 border-white/80 text-white rounded-full text-lg font-medium hover:bg-white hover:text-[#1e1e2f] transition-all duration-300"
              >
                Demo as Admin
              </button>
            </div>

            <button 
              type="submit" 
              className="mx-2 w-full px-8 py-3 border-2 border-white/80 text-white rounded-full text-lg font-medium hover:bg-white hover:text-[#1e1e2f] transition-all duration-300"
            >
              Login
            </button>

            <div className="text-center pt-9">
              <p className="mb-9 text-white/70">
                Don't have an account?{' '}
                <Link to="/register" className="text-white/90 font-bold hover:text-white transition-colors">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};