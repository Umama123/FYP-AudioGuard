import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  RefreshCcw,
  ChevronDown,
  Check,
  LoaderCircle,
  Newspaper,
  Fingerprint,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getAnalyticsSummary, type AnalyticsSummary, type ActivityStatus } from '../api';

// ---------------------------------------------------------------------------
// Static presentation config (no data here — only styling lookups)
// ---------------------------------------------------------------------------

const statusStyles: Record<ActivityStatus, { text: string; dot: string }> = {
  authentic: { text: 'text-green-300', dot: 'bg-green-400' },
  deepfake: { text: 'text-red-300', dot: 'bg-red-400' },
  suspicious: { text: 'text-orange-300', dot: 'bg-orange-400' },
  enhanced: { text: 'dark:text-cyan-300 text-cyan-700', dot: 'bg-cyan-400' },
  awareness: { text: 'dark:text-purple-300 text-purple-700', dot: 'bg-purple-400' },
};

const actionStyles: Record<string, string> = {
  'Legal redirection': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Reported to Security': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Flagged for Review': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Quality Enhanced': 'bg-cyan-500/20 dark:text-cyan-300 text-cyan-700 border-cyan-500/30',
  Reviewed: 'bg-purple-500/20 dark:text-purple-300 text-purple-700 border-purple-500/30',
  Opened: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  None: 'dark:bg-white/5 bg-purple-50/80 text-gray-400 dark:border-white/10 border-purple-200/60',
};

const rangeOptions: { label: string; days: number }[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SimpleDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 border dark:border-white/10 border-purple-200/60 rounded-lg text-sm dark:text-purple-200 text-purple-800 transition-all"
        style={{ fontFamily: 'Open Sans, sans-serif' }}
      >
        {value}
        <ChevronDown className="w-4 h-4 dark:text-purple-300 text-purple-700" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#241a3d] border border-purple-900/40 rounded-xl shadow-xl z-20 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm dark:hover:bg-white/10 hover:bg-purple-100 transition-colors flex items-center justify-between ${
                opt === value ? 'text-white' : 'dark:text-purple-300 text-purple-700'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              {opt}
              {opt === value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 border dark:border-white/10 border-purple-200/60 rounded-lg text-sm dark:text-purple-200 text-purple-800 transition-all"
      style={{ fontFamily: 'Open Sans, sans-serif' }}
    >
      {icon}
      {label}
    </button>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-5 hover:border-purple-700/40 transition-all">
      <p className="text-xs text-gray-400 font-medium mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${accent}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {value}
        </span>
      </div>
      {sub ? (
        <p className="text-[11px] text-gray-500 mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HistoryAnalytics() {
  const [rangeLabel, setRangeLabel] = useState('Last 30 days');
  const rangeDays = rangeOptions.find((r) => r.label === rangeLabel)?.days ?? 30;

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async (days: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsSummary(days);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary(rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const totals = summary?.totals;
  const safetyScore = summary?.safetyScore;
  const threatPrevention = summary?.threatPrevention;
  const enhancement = summary?.enhancement;
  const upgrades = summary?.upgrades ?? [];
  const trend = summary?.trend ?? [];
  const activityLog = summary?.activityLog ?? [];

  const hasAnyData = (totals?.totalAnalyzed ?? 0) > 0 || (totals?.filesEnhanced ?? 0) > 0 || (totals?.awarenessLinksOpened ?? 0) > 0;
  const scoreDelta = safetyScore?.deltaPercent ?? 0;
  const upgradeChartData = upgrades.map((u) => ({ ...u, shortName: u.name.split(' ')[0] }));

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1
            className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            History &amp; Analytics
          </h1>
          <p className="dark:text-purple-300 text-purple-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Real, live data from your Audio Detection, Audio Enhancement, and Aware &amp; Sincere activity.
          </p>
        </div>
        <IconButton
          icon={isLoading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
          label="Refresh"
          onClick={() => void loadSummary(rangeDays)}
        />
      </motion.div>

      {error ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-200" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Couldn't load analytics from the backend: {error}. Make sure the AudioGuard API server is running.
        </div>
      ) : null}

      {!error && !isLoading && !hasAnyData ? (
        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-sm dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          <Newspaper className="w-4 h-4 shrink-0" />
          No activity logged yet. Run a detection in Audio Detection, an enhancement in Audio Enhancement, or open an
          article in Aware &amp; Sincere — this dashboard updates automatically from real usage.
        </div>
      ) : null}

      {/* QUICK SUMMARY STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile label="Total Audios Analyzed" value={totals?.totalAnalyzed ?? 0} accent="dark:text-white text-[#2d1b4e]" />
        <StatTile label="Real Voices" value={totals?.real ?? 0} accent="text-green-300" />
        <StatTile label="Deepfakes Detected" value={totals?.deepfake ?? 0} accent="text-red-300" />
        <StatTile label="AI Generated" value={totals?.aiGenerated ?? 0} accent="text-orange-300" />
        <StatTile label="Audios Enhanced" value={totals?.filesEnhanced ?? 0} accent="dark:text-cyan-300 text-cyan-700" />
        <StatTile label="Aware & Sincere Links Opened" value={totals?.awarenessLinksOpened ?? 0} accent="dark:text-purple-300 text-purple-700" />
      </section>

      {/* TOP METRIC CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Global Security Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Global Security Score
            </p>
            <span
              className={`text-xs font-semibold rounded-lg px-2 py-1 flex items-center gap-1 border ${
                scoreDelta >= 0
                  ? 'text-green-300 bg-green-500/10 border-green-500/20'
                  : 'text-red-300 bg-red-500/10 border-red-500/20'
              }`}
            >
              {scoreDelta >= 0 ? '↗' : '↘'} {scoreDelta >= 0 ? '+' : ''}
              {scoreDelta} pts
            </span>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {safetyScore?.value ?? 0}
            </span>
            <span className="text-gray-400 mb-1">/ {safetyScore?.max ?? 1000}</span>
            <span className="ml-auto text-xs font-medium dark:text-purple-200 text-purple-800 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
              {safetyScore?.label ?? 'No Data Yet'}
            </span>
          </div>
          <div className="h-16 -mx-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safetyScore?.sparkline ?? []}>
                <defs>
                  <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#c084fc" strokeWidth={2} fill="url(#secGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Deepfake Threat Prevention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Deepfake Threat Prevention
            </p>
            <div className="w-9 h-9 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center justify-center">
              <ShieldOff className="w-4 h-4 text-red-300" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {threatPrevention?.blocked ?? 0}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Deepfake / AI-generated audios flagged ({threatPrevention?.blockedInRange ?? 0} in {rangeLabel.toLowerCase()})
          </p>
          <div className="h-14 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={threatPrevention?.sparkline ?? []}>
                <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Audio Enhancement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Audio Enhancement
            </p>
            <div className="w-9 h-9 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Fingerprint className="w-4 h-4 dark:text-purple-300 text-purple-700" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {enhancement?.count ?? 0}
            </span>
            <span className="text-gray-400 mb-1">Files</span>
            <span className="ml-auto text-xs font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1">
              {enhancement?.coveragePercent ?? 0}% coverage
            </span>
          </div>
          <div className="mt-5">
            <div className="w-full h-2 dark:bg-white/10 bg-purple-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, enhancement?.coveragePercent ?? 0)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* CHARTS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Authenticity History Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Authenticity History Trends
            </h2>
            <div className="flex items-center gap-2">
              <SimpleDropdown value={rangeLabel} options={rangeOptions.map((r) => r.label)} onChange={setRangeLabel} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full bg-[#60a5fa]" />
              <span className="text-xs dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>Real Person's Voice</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full bg-[#e879f9]" />
              <span className="text-xs dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>Deepfake</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full bg-[#22d3ee]" />
              <span className="text-xs dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>AI</span>
            </div>
          </div>

          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="rgba(216,180,254,0.5)"
                  tick={{ fill: '#c4b5fd', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  label={{ value: rangeLabel, position: 'insideBottom', offset: -2, fill: '#c4b5fd', fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(216,180,254,0.5)"
                  tick={{ fill: '#c4b5fd', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: 'File Processing', angle: -90, position: 'insideLeft', fill: '#c4b5fd', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#241a3d',
                    border: '1px solid rgba(147,51,234,0.3)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                />
                <Line type="monotone" dataKey="real" name="Real" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 3, fill: '#60a5fa' }} />
                <Line type="monotone" dataKey="deepfake" name="Deepfake" stroke="#e879f9" strokeWidth={2.5} dot={{ r: 3, fill: '#e879f9' }} />
                <Line type="monotone" dataKey="ai" name="AI" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3, fill: '#22d3ee' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Preventative Score Upgrades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Preventative Score Upgrades
            </h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={upgradeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="rgba(216,180,254,0.5)"
                  tick={{ fill: '#c4b5fd', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  stroke="rgba(216,180,254,0.5)"
                  tick={{ fill: '#c4b5fd', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  label={{ value: 'Engagement Metrics', angle: -90, position: 'insideLeft', fill: '#c4b5fd', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: '#241a3d',
                    border: '1px solid rgba(147,51,234,0.3)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  formatter={(value, _name, props) => [`${value}%`, props?.payload?.name ?? '']}
                />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* ACTIVITY LOG */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Comprehensive Activity Log
          </h2>
          <IconButton
            icon={isLoading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            label="Refresh"
            onClick={() => void loadSummary(rangeDays)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-white/10 border-purple-200/60">
                {['Source Type', 'Classification', 'Action Taken', 'Confidence Score', 'Timestamp'].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {isLoading ? 'Loading activity…' : 'No activity logged yet.'}
                  </td>
                </tr>
              ) : (
                activityLog.map((row, i) => (
                  <motion.tr
                    key={`${row.source}-${row.timestamp}-${i}`}
                    className="border-b border-white/5 dark:hover:bg-white/5 bg-purple-50/80 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(0.35 + i * 0.03, 1) }}
                  >
                    <td className="py-4 pr-4 text-sm dark:text-purple-100 text-purple-900" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      {row.source}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusStyles[row.status]?.dot ?? 'bg-gray-400'}`} />
                        <span
                          className={`text-sm font-medium ${statusStyles[row.status]?.text ?? 'text-gray-300'}`}
                          style={{ fontFamily: 'Open Sans, sans-serif' }}
                        >
                          {row.classification}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                          actionStyles[row.action] ?? 'dark:bg-white/5 bg-purple-50/80 text-gray-300 dark:border-white/10 border-purple-200/60'
                        }`}
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        {row.action === 'Legal redirection' && <ShieldCheck className="w-3 h-3" />}
                        {row.action}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-sm dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {row.confidence}
                    </td>
                    <td className="py-4 pr-4 text-sm text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      {row.timestamp}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
