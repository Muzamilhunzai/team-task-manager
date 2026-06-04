import SaaSLayout from '../components/SaaSLayout';

export function Settings() {
  return (
    <SaaSLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-white/60 mt-1">Profile, notifications, and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="text-white/70">Coming soon.</div>
          <div className="text-white/50 text-sm mt-2">Settings UI will be expanded in a later phase.</div>
        </div>

        <div className="glass-card p-6">
          <div className="text-sm text-white/60">Theme</div>
          <div className="text-white/80 mt-2 text-sm">Theme toggle is available in the top bar.</div>
        </div>
      </div>
    </SaaSLayout>
  );
}

