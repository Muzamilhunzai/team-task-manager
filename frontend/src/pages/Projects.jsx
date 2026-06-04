import SaaSLayout from '../components/SaaSLayout';

export function Projects() {
  return (
    <SaaSLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Projects
        </h1>
        <p className="text-gray-600 dark:text-white/60 mt-1">Projects will group tasks in the next iteration.</p>
      </div>

      <div className="glass-card p-8">
        <div className="text-white/70">Coming soon.</div>
        <div className="text-white/50 text-sm mt-2">
          This page is a placeholder for the work-management domain expansion.
        </div>
      </div>
    </SaaSLayout>
  );
}

