import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Circle,
  Database,
  ExternalLink,
  LoaderCircle,
  Newspaper,
  Radar,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  getIntelligenceReport,
  runIntelligencePipeline,
  getCompletedArticles,
  setArticleCompletion,
  logArticleOpened,
  type IntelligenceReport,
  type IntelligenceRunMode,
} from '../api';

function formatGeneratedAt(value: string | null): string {
  return value ?? 'Not generated yet';
}

function formatScore(value: number | null): string {
  return typeof value === 'number' ? value.toFixed(2) : 'n/a';
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      className={`relative overflow-hidden rounded-2xl dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 p-6 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm dark:text-purple-200/70 text-purple-800/70 mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border dark:border-white/10 border-purple-200/60 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-cyan-200" />
        </div>
      </div>
      <div className="relative">{children}</div>
    </motion.section>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 backdrop-blur-xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
        </div>
      </div>
      <div className="text-3xl font-bold dark:text-white text-[#2d1b4e] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {value}
      </div>
      <p className="text-sm dark:text-purple-200/70 text-purple-800/70" style={{ fontFamily: 'Open Sans, sans-serif' }}>
        {label}
      </p>
    </motion.div>
  );
}

function ActionButton({
  label,
  onClick,
  variant = 'primary',
  loading = false,
}: {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}) {
  const classes = variant === 'primary'
    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 dark:text-white text-[#2d1b4e] shadow-lg shadow-purple-900/30'
    : 'dark:bg-white/10 bg-purple-100 hover:bg-white/15 dark:text-purple-100 text-purple-900 border border-white/15';

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${classes}`}
      style={{ fontFamily: 'Open Sans, sans-serif' }}
    >
      {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      {label}
    </button>
  );
}

function MarkReviewedButton({
  completed,
  onToggle,
}: {
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${
        completed
          ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25'
          : 'dark:bg-white/5 bg-purple-50/80 dark:text-purple-200/70 text-purple-800/70 dark:border-white/10 border-purple-200/60 dark:hover:bg-white/10 hover:bg-purple-100'
      }`}
      style={{ fontFamily: 'Open Sans, sans-serif' }}
    >
      {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
      {completed ? 'Reviewed' : 'Mark reviewed'}
    </button>
  );
}

export function AwareSincere() {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRun, setActiveRun] = useState<IntelligenceRunMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedUrls, setCompletedUrls] = useState<Set<string>>(new Set());

  const loadCompletedArticles = async () => {
    try {
      const { articles } = await getCompletedArticles();
      setCompletedUrls(new Set(articles.map((a) => a.article_url)));
    } catch {
      // Non-critical: the page still works without the completed-article overlay.
    }
  };

  const toggleArticleCompletion = async (url: string, title: string, source: string) => {
    if (!url) return;
    const wasCompleted = completedUrls.has(url);

    // Optimistic update
    setCompletedUrls((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(url);
      else next.add(url);
      return next;
    });

    try {
      await setArticleCompletion(url, title, source, !wasCompleted);
    } catch {
      // Revert on failure
      setCompletedUrls((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(url);
        else next.delete(url);
        return next;
      });
    }
  };

  const handleOpenArticle = (url: string, title: string, source: string) => {
    if (!url) return;
    logArticleOpened(url, title, source);
  };

  const loadLatestReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextReport = await getIntelligenceReport();
      setReport(nextReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the Aware & Sincere dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const runWorkflow = async (mode: IntelligenceRunMode) => {
    setActiveRun(mode);
    setError(null);

    try {
      const nextReport = await runIntelligencePipeline(mode);
      setReport(nextReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh intelligence right now.');
    } finally {
      setActiveRun(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLatestReport();
    void loadCompletedArticles();
  }, []);

  return (
    <div className="space-y-6">
      <motion.section
        className="relative overflow-hidden rounded-3xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 via-purple-500/20 to-pink-500/20 blur-2xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-3xl p-8 lg:p-10">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full dark:bg-white/10 bg-purple-100 border dark:border-white/10 border-purple-200/60 text-cyan-200 text-sm mb-5">
                <Sparkles className="w-4 h-4" />
                Real-citation intelligence brief
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold dark:text-white text-[#2d1b4e] leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Aware &amp; Sincere
              </h1>
              <p className="text-lg dark:text-purple-100 text-purple-900/85 mt-4 max-w-2xl leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Monitor emerging deepfake, voice-cloning, and synthetic identity threats through a professional intelligence view built directly on your backend pipeline output.
              </p>
              <div className="flex flex-wrap gap-4 mt-6 text-sm dark:text-purple-200/75 text-purple-800/75" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <span className="px-3 py-1.5 rounded-full dark:bg-white/10 bg-purple-100 border dark:border-white/10 border-purple-200/60">Last generated: {formatGeneratedAt(report?.generatedAt ?? null)}</span>
                <span className="px-3 py-1.5 rounded-full dark:bg-white/10 bg-purple-100 border dark:border-white/10 border-purple-200/60">Status: {report?.status ?? (isLoading ? 'loading' : 'unknown')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ActionButton
                label={activeRun === 'report' ? 'Refreshing report...' : 'Refresh report'}
                onClick={() => void runWorkflow('report')}
                variant="secondary"
                loading={activeRun === 'report'}
              />
              <ActionButton
                label={activeRun === 'full' ? 'Running full pipeline...' : 'Run full pipeline'}
                onClick={() => void runWorkflow('full')}
                loading={activeRun === 'full'}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <Panel title="Connection Issue" subtitle="The dashboard could not complete the latest request." icon={AlertTriangle}>
          <p className="text-sm text-rose-100/90 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {error}
          </p>
        </Panel>
      ) : null}

      {isLoading ? (
        <Panel title="Loading intelligence" subtitle="Gathering the latest brief from the backend." icon={LoaderCircle}>
          <div className="flex items-center gap-3 dark:text-purple-100 text-purple-900/80">
            <LoaderCircle className="w-5 h-5 animate-spin" />
            <span style={{ fontFamily: 'Open Sans, sans-serif' }}>Fetching the latest Aware &amp; Sincere report...</span>
          </div>
        </Panel>
      ) : null}

      {!isLoading && report?.status === 'unavailable' ? (
        <Panel title="Service unavailable" subtitle="The route is wired, but the intelligence dependencies are not ready in the current backend environment." icon={ShieldAlert}>
          <p className="text-sm dark:text-purple-100 text-purple-900/85 leading-relaxed mb-5" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {report.message}
          </p>
          <p className="text-sm dark:text-purple-200 text-purple-800/65" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Install the Aware &amp; Sincere Python requirements, then rerun the pipeline from this screen.
          </p>
        </Panel>
      ) : null}

      {!isLoading && report?.status === 'empty' ? (
        <Panel title="No intelligence brief yet" subtitle="The frontend is connected and waiting for the first generated report." icon={BookOpenText}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-dashed border-white/15 dark:bg-white/5 bg-purple-50/80 p-5">
              <p className="text-base dark:text-purple-100 text-purple-900/90 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {report.message || 'Run the report refresh or the full pipeline to populate the intelligence dashboard with professional briefings.'}
              </p>
            </div>
            <div className="rounded-2xl border dark:border-white/10 border-purple-200/60 bg-[#171028]/70 p-5 space-y-3">
              <div className="text-sm dark:text-purple-200/70 text-purple-800/70" style={{ fontFamily: 'Open Sans, sans-serif' }}>Recommended first step</div>
              <div className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Run full pipeline</div>
              <p className="text-sm dark:text-purple-100 text-purple-900/75 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                This ingests sources, filters deepfake-related content, updates the vector store, and generates the first report for this page.
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      {!isLoading && report?.status === 'ready' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            <StatCard label="Articles Retrieved" value={report.stats.articlesRetrieved} accent="from-cyan-500 to-blue-600" icon={Newspaper} />
            <StatCard label="Sources Referenced" value={report.stats.sourceCount} accent="from-purple-500 to-pink-600" icon={Radar} />
            <StatCard label="Vector DB Entries" value={report.stats.dbTotal} accent="from-emerald-500 to-cyan-600" icon={Database} />
            <StatCard label="Themes Clustered" value={report.stats.themeCount} accent="from-amber-500 to-orange-600" icon={ShieldCheck} />
            <StatCard label="Reviewed by You" value={completedUrls.size} accent="from-pink-500 to-rose-600" icon={CheckCircle2} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <Panel title="Executive overview" subtitle="Directly extracted from the latest intelligence brief." icon={Sparkles} className="xl:col-span-3">
              <p className="text-base dark:text-purple-100 text-purple-900/85 leading-relaxed mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {report.overview.summary}
              </p>
              <div className="space-y-3">
                {report.overview.topStories.map((story) => (
                  <div
                    key={story.url}
                    className="group flex items-center justify-between gap-4 rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-3 dark:hover:bg-white/10 hover:bg-purple-100 transition-colors"
                  >
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1"
                      onClick={() => handleOpenArticle(story.url, story.title, story.source)}
                    >
                      <div className="text-sm dark:text-white text-[#2d1b4e] font-semibold group-hover:text-cyan-200 transition-colors truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {story.title}
                      </div>
                      <div className="text-xs dark:text-purple-200 text-purple-800/65 mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        {story.source}
                      </div>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      <MarkReviewedButton
                        completed={completedUrls.has(story.url)}
                        onToggle={() => void toggleArticleCompletion(story.url, story.title, story.source)}
                      />
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleOpenArticle(story.url, story.title, story.source)}
                      >
                        <ExternalLink className="w-4 h-4 dark:text-purple-200 text-purple-800/55 group-hover:text-cyan-200 transition-colors" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Key insights" subtitle="Verbatim signal lines from retrieved sources." icon={BookOpenText} className="xl:col-span-2">
              <div className="space-y-4 max-h-[29rem] overflow-y-auto pr-1">
                {report.keyInsights.map((insight, index) => (
                  <div key={`${insight.url}-${index}`} className="rounded-2xl border dark:border-white/10 border-purple-200/60 bg-[#171028]/70 p-4">
                    <p className="text-sm text-purple-50/90 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      {insight.text}
                    </p>
                    {insight.url ? (
                      <a
                        href={insight.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-cyan-200 mt-3 hover:text-cyan-100 transition-colors"
                        onClick={() => handleOpenArticle(insight.url, insight.title || insight.url, '')}
                      >
                        {insight.title || 'View source'}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Emerging threats" subtitle="Threat signals extracted from the current brief." icon={AlertTriangle}>
              <div className="space-y-3">
                {report.threats.map((threat, index) => (
                  <div key={`${threat}-${index}`} className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4 text-sm dark:text-rose-50/90 text-black leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {threat}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Prevention & mitigation" subtitle="Action-oriented guidance surfaced from the same sources." icon={ShieldCheck}>
              <div className="space-y-3">
                {report.prevention.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm dark:text-emerald-50/90 text-black leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {item}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Intelligence by theme" subtitle="Clustered reporting, with relevance scores and article excerpts." icon={Radar}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {report.themes.map((theme) => (
                <div key={theme.label} className="rounded-2xl border dark:border-white/10 border-purple-200/60 bg-[#171028]/70 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {theme.label}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/15 text-xs text-cyan-200">
                      {theme.articles.length} items
                    </span>
                  </div>
                  <div className="space-y-4">
                    {theme.articles.slice(0, 3).map((article) => (
                      <div key={`${theme.label}-${article.url}`} className="rounded-2xl border border-white/8 dark:bg-white/5 bg-purple-50/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold dark:text-white text-[#2d1b4e] hover:text-cyan-200 transition-colors"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                              onClick={() => handleOpenArticle(article.url, article.title, article.source)}
                            >
                              {article.title}
                            </a>
                            <div className="text-xs dark:text-purple-200 text-purple-800/60 mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                              {article.source} · {article.date || 'Unknown date'}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full dark:bg-white/10 bg-purple-100 text-xs dark:text-purple-100 text-purple-900 shrink-0">
                            {formatScore(article.score)}
                          </span>
                        </div>
                        {article.snippet ? (
                          <p className="text-sm dark:text-purple-100 text-purple-900/75 leading-relaxed mt-3" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                            {article.snippet}
                          </p>
                        ) : null}
                        <div className="mt-3">
                          <MarkReviewedButton
                            completed={completedUrls.has(article.url)}
                            onToggle={() => void toggleArticleCompletion(article.url, article.title, article.source)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Referenced sources" subtitle="Source table extracted from the generated report." icon={ExternalLink}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="dark:text-purple-200 text-purple-800/60 border-b dark:border-white/10 border-purple-200/60">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Article</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sources.slice(0, 10).map((source) => (
                    <tr key={`${source.index}-${source.url}`} className="border-b border-white/5 last:border-b-0">
                      <td className="py-3 dark:text-purple-100 text-purple-900/70">{source.index}</td>
                      <td className="py-3 pr-4">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 dark:text-white text-[#2d1b4e] hover:text-cyan-200 transition-colors"
                          style={{ fontFamily: 'Open Sans, sans-serif' }}
                          onClick={() => handleOpenArticle(source.url, source.title, source.source)}
                        >
                          {source.title}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="py-3 dark:text-purple-100 text-purple-900/75">{source.source}</td>
                      <td className="py-3 dark:text-purple-100 text-purple-900/75">{source.date}</td>
                      <td className="py-3 dark:text-purple-100 text-purple-900/75">{formatScore(source.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}