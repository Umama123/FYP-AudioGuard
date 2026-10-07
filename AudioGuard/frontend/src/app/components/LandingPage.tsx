import { motion } from 'motion/react';
import {
  ShieldCheck,
  Sparkles,
  Radio,
  Fingerprint,
  ScanSearch,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BadgeCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const featureCards = [
  {
    title: 'Deepfake Detection',
    description: 'Analyze voice samples with explainable AI outputs and clear confidence scoring.',
    icon: ScanSearch,
  },
  {
    title: 'Watermark Protection',
    description: 'Embed hidden signatures into audio and verify authenticity with detection workflows.',
    icon: Fingerprint,
  },
  {
    title: 'Audio Enhancement',
    description: 'Enhance audio quality with denoising, reconstruction, and fine-tuned refinement.',
    icon: Sparkles,
  },
];

const stats = [
  { label: 'Protected Audios', value: '12k+' },
  { label: 'Active Workflows', value: '24/7' },
  { label: 'Detection Accuracy', value: '99.2%' },
];

export function LandingPage() {
  return (
    <div className="space-y-10 pb-10">
      <section id="home" className="relative overflow-hidden rounded-[2rem] border dark:border-white/10 border-purple-200/60 dark:bg-[#12091f]/90 bg-white/90 p-8 shadow-2xl dark:shadow-purple-950/30 shadow-purple-200/50 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_35%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-sm dark:text-purple-200 text-purple-800">
              <ShieldCheck className="h-4 w-4" />
              AI-powered audio authenticity platform
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight dark:text-white text-[#2d1b4e] sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Protect your voice. <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Trust every audio file.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg dark:text-purple-200/80 text-purple-800/80">
              AudioGuard brings deepfake detection, watermarking, enhancement, and awareness tools together in one modern workspace for media verification and protection.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/audio-detection" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02]">
                Launch the app <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/15 dark:bg-white/5 bg-purple-50/80 px-6 py-3 font-semibold dark:text-purple-100 text-purple-900 transition dark:hover:bg-white/10 hover:bg-purple-100">
                Explore features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-3">
                  <p className="text-2xl font-bold dark:text-white text-[#2d1b4e]">{item.value}</p>
                  <p className="text-sm dark:text-purple-200/70 text-purple-800/70">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="rounded-[1.75rem] border border-purple-400/20 bg-gradient-to-br dark:from-[#1e1435]/90 dark:to-[#0f172a]/90 from-white/90 to-purple-50/90 p-6 shadow-xl dark:shadow-purple-950/30 shadow-purple-200/50">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                  <Cpu className="h-6 w-6 dark:text-white text-[#2d1b4e]" />
                </div>
                <div>
                  <p className="text-sm dark:text-purple-300 text-purple-700">Live defense stack</p>
                  <p className="text-xl font-semibold dark:text-white text-[#2d1b4e]">Realtime audio intelligence</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {["Explainable detection reports", "Protected watermark workflows", "Adaptive enhancement pipeline"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-3 text-sm dark:text-purple-100 text-purple-900">
                    <CheckCircle2 className="h-4 w-4 dark:text-cyan-300 text-cyan-700" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="about" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border dark:border-white/10 border-purple-200/60 dark:bg-[#1a0f2e]/80 bg-white/80 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] dark:text-purple-300 text-purple-700">About us</p>
          <h2 className="mt-3 text-3xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Built for investigators, teams, and creators who need trustworthy audio.
          </h2>
          <p className="mt-4 dark:text-purple-200/80 text-purple-800/80">
            AudioGuard combines forensic-style analysis with a streamlined interface so you can validate, protect, and enhance audio in one secure workflow.
          </p>
        </div>
        <div className="rounded-[1.5rem] border dark:border-white/10 border-purple-200/60 bg-[#12091f]/80 p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 p-3">
              <BadgeCheck className="h-6 w-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <p className="text-xl font-semibold dark:text-white text-[#2d1b4e]">Why teams use AudioGuard</p>
              <p className="text-sm dark:text-purple-200/70 text-purple-800/70">Reliable verification with human-readable evidence.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {['Evidence-first reporting', 'Secure watermarking', 'Fast workflow switching'].map((item) => (
              <div key={item} className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-3 text-sm dark:text-purple-100 text-purple-900">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="rounded-[1.5rem] border dark:border-white/10 border-purple-200/60 dark:bg-[#140b25]/75 bg-white/75 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] dark:text-purple-300 text-purple-700">Features</p>
            <h2 className="mt-2 text-3xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Everything you need for trusted audio workflows.
            </h2>
          </div>
          <Link to="/watermarking" className="text-sm font-semibold dark:text-cyan-300 text-cyan-700 transition hover:text-cyan-200">
            View watermarking tools →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <motion.div key={title} whileHover={{ y: -4, scale: 1.01 }} className="rounded-[1.25rem] border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Icon className="h-6 w-6 dark:text-white text-[#2d1b4e]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold dark:text-white text-[#2d1b4e]">{title}</h3>
              <p className="mt-3 text-sm leading-6 dark:text-purple-200/75 text-purple-800/75">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border dark:border-white/10 border-purple-200/60 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] dark:text-purple-300 text-purple-700">Ready to begin?</p>
            <h2 className="mt-2 text-3xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Start protecting your audio today.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/audio-detection" className="rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:scale-[1.02]">
              Open detection workspace
            </Link>
            <Link to="/settings" className="rounded-full border dark:border-white/20 border-purple-300/60 dark:bg-white/5 bg-purple-50/80 px-6 py-3 font-semibold text-white transition dark:hover:bg-white/10 hover:bg-purple-100">
              Adjust your preferences
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
