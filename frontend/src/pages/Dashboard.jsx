import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SaaSLayout from '../components/SaaSLayout';
import { RemindersPanel } from '../components/RemindersPanel';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

// ───────────────────────────── Utility functions ─────────────────────────────

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${num}`;
}

/** Convert an ISO date string or timestamp to a human‑readable relative time. */
function timeAgo(dateInput) {
  const now = Date.now();
  const then = new Date(dateInput).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return new Date(then).toLocaleDateString();
}

/** Return a friendly label like "Tomorrow", "In 3 days", etc. */
function formatDueLabel(dateInput) {
  const now = new Date();
  const due = new Date(dateInput);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return due.toLocaleDateString();
}

/** Classify urgency based on due date. */
function urgencyFromDueDate(dateInput) {
  const now = Date.now();
  const due = new Date(dateInput).getTime();
  const diffHours = (due - now) / (1000 * 60 * 60);
  if (diffHours <= 24) return 'urgent';
  if (diffHours <= 72) return 'soon';
  return 'safe';
}

// ───────────────────────────── Visual components ─────────────────────────────

function StatusBadge({ status }) {
  const map = {
    completed: { label: 'Done', cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200' },
    'in-progress': { label: 'In progress', cls: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-200' },
    blocked: { label: 'Blocked', cls: 'bg-red-500/15 border-red-500/25 text-red-200' },
    overdue: { label: 'Overdue', cls: 'bg-amber-500/15 border-amber-500/25 text-amber-200' },
  };
  const v = map[status] || { label: 'Open', cls: 'bg-white/5 border-white/10 text-white/70' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${v.cls}`}>
      {v.label}
    </span>
  );
}

function MiniSparkLine({ values, className = '' }) {
  const w = 140;
  const h = 34;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1e-9, max - min);

  const pts = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return [x, y];
    })
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tm_spark_g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#tm_spark_g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductivityAreaChart({ series }) {
  const w = 640;
  const h = 220;
  const padL = 14;
  const padR = 12;
  const padT = 16;
  const padB = 18;

  const values = series.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1e-9, max - min);

  const xAt = (i) => padL + (i * (w - padL - padR)) / (series.length - 1);
  const yAt = (v) => padT + (1 - (v - min) / range) * (h - padT - padB);

  const linePts = series.map((d, i) => [xAt(i), yAt(d.value)]);
  const dLine = linePts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      const [px, py] = linePts[i - 1];
      const cx = ((px + x) / 2).toFixed(2);
      const cy = ((py + y) / 2).toFixed(2);
      return `Q ${px.toFixed(2)} ${py.toFixed(2)} ${cx} ${cy}`;
    })
    .join(' ');

  const dArea = `${dLine} L ${xAt(series.length - 1).toFixed(2)} ${(h - padB).toFixed(2)} L ${xAt(0).toFixed(2)} ${(h - padB).toFixed(2)} Z`;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const t = i / yTicks;
    const y = padT + t * (h - padT - padB);
    const v = max - t * range;
    return { y, v };
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between gap-4 px-2">
        <div>
          <div className="text-sm text-white/60">Productivity</div>
          <div className="text-lg font-semibold text-white tracking-tight">Tasks completed over time</div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-xs text-white/50">This week</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
            <span className="text-xs text-white/70">Smooth curve</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Productivity chart">
          <defs>
            <linearGradient id="tm_area_g" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#4f46e5" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#8b5cf6" stopOpacity="0.85" />
              <stop offset="1" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="tm_area_f" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="1" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={t.y} x2={w - padR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 6} y={t.y + 4} fontSize="11" fill="rgba(255,255,255,0.35)" textAnchor="end">
                {Math.round(t.v)}
              </text>
            </g>
          ))}

          <path d={dArea} fill="url(#tm_area_f)" />
          <path d={dLine} fill="none" stroke="url(#tm_area_g)" strokeWidth="2.6" strokeLinecap="round" />

          {linePts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#1b1b2f" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx={x} cy={y} r="2" fill="#a78bfa" />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between px-2">
        <div className="text-xs text-white/50">7d</div>
        <div className="text-xs text-white/50">Higher is better</div>
      </div>
    </div>
  );
}

// ───────────────────────────── Main Dashboard ─────────────────────────────

export function Dashboard() {
  const { user } = useAuth();

  // Raw API data states
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [productivitySeries, setProductivitySeries] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        api.get('/dashboard/tasks/stats'),
        api.get('/dashboard/projects/stats'),
        api.get('/dashboard/teams/stats'),
        api.get('/dashboard/tasks/recent'),
        api.get('/dashboard/tasks/upcoming-deadlines'),
        api.get('/dashboard/tasks/productivity?range=7days'),
        api.get('/dashboard/projects/progress'),
        api.get('/dashboard/teams/activity'),
      ]);

      const pick = (idx) => {
        const r = results[idx];
        return r && r.status === 'fulfilled' ? r.value.data : null;
      };

      const tasksStats = pick(0);
      const projectsStats = pick(1);
      const teamsStats = pick(2);
      const recent = pick(3) || [];
      const deadlines = pick(4) || [];
      const productivity = pick(5) || [];
      const progress = pick(6) || [];
      const activity = pick(7) || [];

      // Check if essential stats failed
      if (!tasksStats && !projectsStats && !teamsStats) {
        setError('Failed to load dashboard data. Please try again.');
        return;
      }

      setStats({ tasksStats, projectsStats, teamsStats });
      setRecentTasks(Array.isArray(recent) ? recent : []);
      setUpcomingDeadlines(Array.isArray(deadlines) ? deadlines : []);
      setProductivitySeries(Array.isArray(productivity) ? productivity : []);
      setProjectProgress(Array.isArray(progress) ? progress : []);
      setTeamActivity(Array.isArray(activity) ? activity : []);
    } catch (e) {
      setError('An unexpected error occurred while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────── Derived metrics from real API data ────────
  const totalTasks = stats?.tasksStats?.totalTasks ?? 0;
  const completedTasks = stats?.tasksStats?.completedTasks ?? 0;
  const activeProjects = stats?.projectsStats?.activeProjects ?? 0;
  const teamMembers = stats?.teamsStats?.teamMembers ?? 0;

  // Completion rate
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Momentum: percentage growth of tasks completed this week compared to last week
  const momentum = useMemo(() => {
    const vals = productivitySeries.map((d) => d.tasks);
    if (vals.length < 2) return 0;
    const first = vals[0];
    const last = vals[vals.length - 1];
    if (first === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - first) / first) * 100);
  }, [productivitySeries]);

  // Risk index: derived from overdue tasks and urgent deadlines
  const riskIndex = useMemo(() => {
    const overdueCount = recentTasks.filter(
      (t) => t.status === 'overdue' || t.status === 'blocked'
    ).length;
    const urgentCount = upcomingDeadlines.filter(
      (d) => urgencyFromDueDate(d.dueDate) === 'urgent'
    ).length;
    const soonCount = upcomingDeadlines.filter(
      (d) => urgencyFromDueDate(d.dueDate) === 'soon'
    ).length;
    return overdueCount * 12 + urgentCount * 8 + soonCount * 4; // scale 0-40
  }, [recentTasks, upcomingDeadlines]);

  // Operational health label
  const operationalHealth = riskIndex > 22 ? 'Degraded' : 'Healthy';

  // KPI cards with dynamic trend if available
  const kpiCards = useMemo(() => {
    const trends = stats?.tasksStats?.trends || {};
    return [
      {
        label: 'Total Tasks',
        value: totalTasks,
        trend: typeof trends.tasks === 'number' ? trends.tasks : null,
      },
      {
        label: 'Completed Tasks',
        value: completedTasks,
        trend: typeof trends.completed === 'number' ? trends.completed : null,
      },
      {
        label: 'Active Projects',
        value: activeProjects,
        trend: typeof stats?.projectsStats?.activeProjectsTrend === 'number' ? stats.projectsStats.activeProjectsTrend : null,
      },
      {
        label: 'Team Members',
        value: teamMembers,
        trend: typeof stats?.teamsStats?.teamMembersTrend === 'number' ? stats.teamsStats.teamMembersTrend : null,
      },
    ];
  }, [totalTasks, completedTasks, activeProjects, teamMembers, stats]);

  // Transform upcoming deadlines with computed urgency and label
  const formattedDeadlines = useMemo(() => {
    return upcomingDeadlines.map((d) => ({
      ...d,
      urgency: urgencyFromDueDate(d.dueDate),
      dueLabel: formatDueLabel(d.dueDate),
    }));
  }, [upcomingDeadlines]);

  // Transform recent tasks to include relative time
  const formattedRecent = useMemo(() => {
    return recentTasks.map((t) => ({
      ...t,
      updatedAgo: t.updatedAt ? timeAgo(t.updatedAt) : 'unknown',
    }));
  }, [recentTasks]);

  // Transform team activity with avatar gradients
  const formattedActivity = useMemo(() => {
    const colors = [
      'from-indigo-400 to-violet-400',
      'from-cyan-400 to-blue-500',
      'from-emerald-400 to-teal-400',
      'from-amber-400 to-orange-400',
      'from-fuchsia-400 to-purple-500',
    ];
    return teamActivity.map((a, idx) => ({
      id: a.id ?? `act_${idx}`,
      user: a.userName || a.user || a.name || 'Unknown',
      action: a.action || a.type || 'performed an action',
      minsAgo: a.timeAgoMinutes ?? a.minsAgo ?? a.timeAgo ?? 0,
      avatarGrad: colors[idx % colors.length],
    }));
  }, [teamActivity]);

  // Productivity chart data
  const chartSeries = useMemo(
    () =>
      productivitySeries.map((d) => ({
        label: d.date || '',
        value: d.tasks ?? 0,
      })),
    [productivitySeries],
  );

  // Sparkline values (last 8 entries)
  const sparkValues = useMemo(() => chartSeries.slice(-8).map((d) => d.value), [chartSeries]);

  const heroSubtitle = user?.role
    ? `Your ${user.role} workspace — dashboards update in real time.`
    : 'Your workspace — dashboards update in real time.';

  // ────── Loading and error states ──────
  if (loading) {
    return (
      <SaaSLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/20" />
        </div>
      </SaaSLayout>
    );
  }

  if (error) {
    return (
      <SaaSLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-white/70">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-2xl bg-indigo-500/20 border border-white/10 px-4 py-2 text-white hover:bg-indigo-500/30"
          >
            Retry
          </button>
        </div>
      </SaaSLayout>
    );
  }

  const gridHover = 'hover:scale-[1.02] transition-all duration-300';

  return (
    <SaaSLayout>
      {/* HERO */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-purple-500/20 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/30 via-violet-400/20 to-purple-500/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-indigo-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                <span className="text-xs text-white/70 uppercase tracking-wider">SaaS Dashboard</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Welcome back,
                <span className="ml-2 bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                  {user?.username || 'User'}
                </span>
              </h1>
              <p className="mt-2 text-white/70 max-w-2xl">{heroSubtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/tasks"
                className={`group ${gridHover} px-6 py-3 rounded-2xl bg-white text-[#1e1e2f] font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <span className="relative z-10">View Tasks</span>
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
              </Link>
              <Link
                to="/projects"
                className={`group ${gridHover} px-6 py-3 rounded-2xl border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all duration-300`}
              >
                Projects
              </Link>
            </div>
          </div>

          {/* Live data badges */}
          <div className="relative mt-6 flex flex-wrap gap-3 items-center">
            <div className="rounded-3xl border border-white/10 bg-[#1b1b2f]/70 backdrop-blur-xl px-4 py-3">
              <div className="text-xs text-white/50">Today's momentum</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{momentum}%</span>
                <span className="text-xs text-emerald-200/90">
                  +{Math.max(0, momentum / 2).toFixed(0)} tasks
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1b1b2f]/70 backdrop-blur-xl px-4 py-3">
              <div className="text-xs text-white/50">Risk index</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{riskIndex}</span>
                <span className={`text-xs ${riskIndex > 22 ? 'text-amber-200/90' : 'text-emerald-200/90'}`}>
                  {riskIndex > 22 ? 'Watchlist' : 'Stable'}
                </span>
              </div>
            </div>

            <div className="hidden md:block ml-auto">
              <MiniSparkLine values={sparkValues} className="opacity-90" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-xl p-5 ${gridHover} group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-sm text-white/60">{kpi.label}</div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <div className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
                  {formatCompact(kpi.value)}
                </div>
                {kpi.trend !== null && kpi.trend !== undefined && (
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <span className="text-emerald-200 font-semibold text-xs">
                      +{kpi.trend.toFixed(1)}%
                    </span>
                    <span className="ml-2 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 flex items-center justify-center border border-white/10">
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M4 12l5-5 3 3 4-7" stroke="rgba(134,239,172,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 12h12" stroke="rgba(134,239,172,0.55)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400"
                  style={{
                    width: `${clamp(
                      ((kpi.trend ?? 0) / 10) * 100,
                      10,
                      92,
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-white/50">vs last week</div>
            </div>
          </div>
        ))}
      </div>

      <RemindersPanel />

      {/* MAIN GRID */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <ProductivityAreaChart series={chartSeries} />

          {/* Recent + Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm text-white/60">Operations</div>
                  <div className="text-lg font-semibold text-white tracking-tight">Recent tasks</div>
                </div>
                <Link
                  to="/tasks"
                  className={`text-sm text-white/70 hover:text-white transition-colors ${gridHover} py-2 px-3 rounded-xl border border-white/10 bg-white/5`}
                >
                  Open
                </Link>
              </div>

              <div className="space-y-2">
                {formattedRecent.map((t, i) => (
                  <div
                    key={t.id}
                    className={`group rounded-2xl border border-white/10 bg-[#252538]/70 p-3.5 hover:bg-[#252538] hover:border-white/20 transition-all duration-300 ${i === 0 ? 'ring-1 ring-indigo-400/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate group-hover:text-white/95">
                          {t.title}
                        </div>
                        <div className="text-xs text-white/50 mt-1">Updated {t.updatedAgo}</div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm text-white/60">Projects</div>
                  <div className="text-lg font-semibold text-white tracking-tight">Project progress</div>
                </div>
                <div className="text-xs text-white/50">Smooth transitions</div>
              </div>

              <div className="space-y-4">
                {projectProgress.map((p, idx) => (
                  <div key={p.name} className={`rounded-2xl border border-white/10 bg-[#252538]/60 p-4 ${gridHover}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-xs text-white/50 mt-1">Release readiness</div>
                      </div>
                      <div className="text-sm font-bold text-white/90 tabular-nums">{p.progress}%</div>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 transition-all duration-700"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                      <span>Start</span>
                      <span>{idx % 2 === 0 ? 'In review' : 'Deploying'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-sm text-white/60">Deadlines</div>
                <div className="text-lg font-semibold text-white tracking-tight">Upcoming</div>
              </div>
              <div className="text-xs text-white/50">Color-coded urgency</div>
            </div>

            <div className="space-y-3">
              {formattedDeadlines.map((d) => {
                const urgencyMap = {
                  urgent: { bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-200', dot: 'bg-red-400' },
                  soon: { bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-200', dot: 'bg-amber-400' },
                  safe: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-200', dot: 'bg-emerald-400' },
                };
                const u = urgencyMap[d.urgency] || urgencyMap.safe;

                return (
                  <div key={d.id} className={`group rounded-2xl border ${u.bg} ${u.border} p-4 bg-[#252538]/40 hover:bg-[#252538] transition-all duration-300 ${gridHover}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`font-semibold truncate ${u.text} group-hover:opacity-95`}>{d.title}</div>
                        <div className="text-xs text-white/50 mt-1">{d.dueLabel}</div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${u.dot} shadow-[0_0_0_4px_rgba(255,255,255,0.06)]`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
              Tip: prioritize urgent items first to reduce risk.
            </div>
          </div>

          {/* Team Activity */}
          <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-sm text-white/60">Team</div>
                <div className="text-lg font-semibold text-white tracking-tight">Team activity</div>
              </div>
              <div className="text-xs text-white/50">Timeline</div>
            </div>

            <div className="relative pl-3">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-gradient-to-b from-indigo-300/30 via-violet-300/20 to-purple-300/10" />
              <div className="space-y-3">
                {formattedActivity.map((a) => (
                  <div key={a.id} className={`relative pl-4 group ${gridHover}`}>
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white/10 border border-white/10">
                      <div className={`w-full h-full rounded-full bg-gradient-to-r ${a.avatarGrad}`} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#252538]/40 p-3.5 hover:bg-[#252538] transition-all duration-300">
                      <div className="text-sm font-semibold text-white">
                        <span className="text-white/90">{a.user}</span>
                        <span className="text-white/70 font-medium"> {a.action}</span>
                      </div>
                      <div className="text-xs text-white/50 mt-1">{a.minsAgo} minutes ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Insights (live) */}
          <div className="rounded-3xl border border-white/10 bg-[#1b1b2f] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-sm text-white/60">Insights</div>
                <div className="text-lg font-semibold text-white tracking-tight">Quick insights</div>
              </div>
              <div className="text-xs text-white/50">Live feel</div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className={`${gridHover} rounded-2xl border border-white/10 bg-[#252538]/55 p-4`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">Completion rate</div>
                  <div className="text-sm font-bold text-white tabular-nums">{completionRate}%</div>
                </div>
                <div className="mt-3 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 transition-all duration-700"
                    style={{ width: `${clamp(completionRate, 0, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-white/45">Higher completion drives throughput.</div>
              </div>

              <div className={`${gridHover} rounded-2xl border border-white/10 bg-[#252538]/55 p-4`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">Momentum</div>
                  <div className="text-sm font-bold text-white tabular-nums">{momentum}%</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400/90 via-violet-400/90 to-purple-400/90" style={{ width: `${clamp(Math.abs(momentum) * 3, 10, 100)}%` }} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-white/45">Keep daily check-ins on track.</div>
              </div>

              <div className={`${gridHover} rounded-2xl border border-white/10 bg-[#252538]/55 p-4`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">Operational health</div>
                  <div className="text-sm font-bold text-white tabular-nums">{operationalHealth}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => {
                    const v = i === 0
                      ? clamp(100 - riskIndex * 2, 0, 100)
                      : i === 1
                      ? clamp(60 - riskIndex, 0, 60)
                      : clamp(35 - riskIndex / 2, 0, 35);
                    return (
                      <div key={i} className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 transition-all duration-700"
                          style={{ width: `${clamp(v, 0, 100)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-white/45">Address watchlist items early.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dense CTA row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/tasks"
          className={`rounded-3xl border border-white/10 bg-[#1b1b2f] p-5 hover:bg-[#1b1b2f]/90 hover:border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.3)] ${gridHover} flex items-center justify-between gap-4`}
        >
          <div>
            <div className="text-sm text-white/60">Quick start</div>
            <div className="mt-1 font-semibold text-white">Triage tasks</div>
            <div className="text-xs text-white/50 mt-1">{formattedRecent[0]?.title ?? 'No tasks'}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-400/20 via-violet-400/15 to-purple-400/20 border border-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        <Link
          to="/projects"
          className={`rounded-3xl border border-white/10 bg-[#1b1b2f] p-5 hover:bg-[#1b1b2f]/90 hover:border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.3)] ${gridHover} flex items-center justify-between gap-4`}
        >
          <div>
            <div className="text-sm text-white/60">Progress tracking</div>
            <div className="mt-1 font-semibold text-white">Review milestones</div>
            <div className="text-xs text-white/50 mt-1">{projectProgress[0]?.name ?? 'No projects'}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-400/20 via-violet-400/15 to-purple-400/20 border border-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 19V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 19V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Link>

        <div className={`rounded-3xl border border-white/10 bg-[#1b1b2f] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.3)] ${gridHover}`}>
          <div>
            <div className="text-sm text-white/60">Team health</div>
            <div className="mt-1 font-semibold text-white">Collaboration pulse</div>
            <div className="text-xs text-white/50 mt-1">{teamMembers} members • {activeProjects} active projects</div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border border-white/10 bg-gradient-to-br ${
                    i % 3 === 0
                      ? 'from-indigo-400/20 to-violet-400/20'
                      : i % 3 === 1
                        ? 'from-emerald-400/20 to-teal-400/20'
                        : 'from-amber-400/20 to-orange-400/20'
                  } ${i === 0 ? '' : '-ml-1'}`}
                />
              ))}
            </div>
            <div className="text-xs text-white/50">Updated moments ago</div>
          </div>
        </div>
      </div>
    </SaaSLayout>
  );
}