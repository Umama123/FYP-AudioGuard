import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Download, CheckCircle, AlertCircle, Loader, Lock,
  Sparkles, Music, FileAudio, Shield, Activity, Play, Pause,
  Volume2, RefreshCw, Search, X,
} from 'lucide-react';
import { resolveBaseUrl } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatermarkExplainability {
  description: string;
  frequency_band: string;
  pattern_length: number;
  correlation: number;
  detection_threshold: number;
}

interface WatermarkResult {
  status: string;
  watermark_detected?: boolean;
  correlation?: number;
  snr_db?: number;
  payload_integrity?: number;
  extracted_id?: string;
  explainability?: WatermarkExplainability;
  download_url?: string;
  watermark_id?: string;
  output_path?: string;
  saved_to?: string;
  message?: string;
  original_duration?: number;
  original_sample_rate?: number;
  output_sample_rate?: number;
  file_size_mb?: number;
  method?: string;
  audio_duration?: number;
  sample_rate?: number;
}

const ACCEPTED_AUDIO = '.wav,.mp3,.m4a,.flac,.aac,.ogg';
// ─── Mini Audio Player ────────────────────────────────────────────────────────

interface AudioPlayerProps {
  src: string;
  label: string;
  accent?: string; // tailwind gradient class fragment
}

function AudioPlayer({ src, label, accent = 'from-purple-500 to-pink-500' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onTime = () => setProgress(el.currentTime);
    const onLoad = () => setDuration(el.duration);
    el.addEventListener('ended', onEnd);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onLoad);
    return () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onLoad);
    };
  }, [src]);

  // Reset when src changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [src]);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="rounded-xl border dark:border-white/10 border-purple-200/60 bg-black/30 p-4 space-y-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <Volume2 className="w-4 h-4 dark:text-purple-300 text-purple-700 shrink-0" />
        <p className="text-sm font-medium dark:text-white text-[#2d1b4e] truncate">{label}</p>
      </div>

      {/* Waveform bars animation */}
      <div className="flex items-end gap-[3px] h-8">
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 30 + Math.sin(i * 0.9) * 20 + Math.cos(i * 0.5) * 15;
          return (
            <motion.div
              key={i}
              className={`rounded-full bg-gradient-to-t ${accent} opacity-70`}
              style={{ width: 3, height: `${h}%` }}
              animate={playing ? { scaleY: [1, 1.5 + Math.random() * 0.5, 0.8, 1.3, 1] } : { scaleY: 1 }}
              transition={{ duration: 0.6 + i * 0.03, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 dark:bg-white/10 bg-purple-100 rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) {
            audioRef.current.currentTime = ratio * duration;
          }
        }}>
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${accent} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={toggle}
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
        >
          {playing
            ? <Pause className="w-4 h-4 dark:text-white text-[#2d1b4e]" />
            : <Play className="w-4 h-4 dark:text-white text-[#2d1b4e] ml-0.5" />}
        </button>
        <span className="text-xs text-slate-400 tabular-nums">
          {fmt(progress)} / {fmt(duration || 0)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AudioWatermarking() {
  const [activeTab, setActiveTab] = useState<'embed' | 'detect'>('embed');

  // Embed state
  const [embedFile, setEmbedFile] = useState<File | null>(null);
  const [embedPreviewUrl, setEmbedPreviewUrl] = useState<string | null>(null);
  const [secretId, setSecretId] = useState('');
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedResult, setEmbedResult] = useState<WatermarkResult | null>(null);
  const [watermarkedAudioUrl, setWatermarkedAudioUrl] = useState<string | null>(null);
  const [embedDragOver, setEmbedDragOver] = useState(false);
  const embedInputRef = useRef<HTMLInputElement>(null);

  // Detect state
  const [detectFile, setDetectFile] = useState<File | null>(null);
  const [detectPreviewUrl, setDetectPreviewUrl] = useState<string | null>(null);
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectResult, setDetectResult] = useState<WatermarkResult | null>(null);
  const [detectDragOver, setDetectDragOver] = useState(false);
  const detectInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setEmbedFileWithPreview = (file: File | null) => {
    setEmbedFile(file);
    if (embedPreviewUrl) URL.revokeObjectURL(embedPreviewUrl);
    setEmbedPreviewUrl(file ? URL.createObjectURL(file) : null);
    setEmbedResult(null);
    setWatermarkedAudioUrl(null);
  };

  const setDetectFileWithPreview = (file: File | null) => {
    setDetectFile(file);
    if (detectPreviewUrl) URL.revokeObjectURL(detectPreviewUrl);
    setDetectPreviewUrl(file ? URL.createObjectURL(file) : null);
    setDetectResult(null);
  };

  const resetEmbed = () => {
    setEmbedFileWithPreview(null);
    setSecretId('');
    if (embedInputRef.current) embedInputRef.current.value = '';
  };

  const resetDetect = () => {
    setDetectFileWithPreview(null);
    if (detectInputRef.current) detectInputRef.current.value = '';
  };

  // ── Submit: Embed ─────────────────────────────────────────────────────────

  const handleEmbedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!embedFile) return;

    setEmbedLoading(true);
    setEmbedResult(null);
    setWatermarkedAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', embedFile);
      formData.append('secret_id', secretId || `watermark_${Date.now()}`);

      const baseUrl = resolveBaseUrl();
      const response = await fetch(`${baseUrl}/api/watermarking/embed`, {
        method: 'POST',
        body: formData,
      });

      const data: WatermarkResult = await response.json();
      setEmbedResult(data);

      // If success, fetch the watermarked file as a blob URL so we can play it
      if (data.status === 'success' && data.download_url) {
        try {
          const audioResp = await fetch(`${baseUrl}${data.download_url}`);
          const blob = await audioResp.blob();
          const url = URL.createObjectURL(blob);
          setWatermarkedAudioUrl(url);
        } catch (_) {
          // audio preview failed silently – download still available
        }
      }
    } catch (error) {
      setEmbedResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to embed watermark',
      });
    } finally {
      setEmbedLoading(false);
    }
  };

  // ── Submit: Detect ────────────────────────────────────────────────────────

  const handleDetectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectFile) return;

    setDetectLoading(true);
    setDetectResult(null);

    try {
      const formData = new FormData();
      formData.append('file', detectFile);

      const baseUrl = resolveBaseUrl();
      const response = await fetch(`${baseUrl}/api/watermarking/detect`, {
        method: 'POST',
        body: formData,
      });

      const data: WatermarkResult = await response.json();
      setDetectResult(data);
    } catch (error) {
      setDetectResult({
        status: 'error',
        watermark_detected: false,
        message: error instanceof Error ? error.message : 'Failed to detect watermark',
      });
    } finally {
      setDetectLoading(false);
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = async (url: string) => {
    try {
      const baseUrl = resolveBaseUrl();
      const response = await fetch(`${baseUrl}${url}`);
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `watermarked_${embedFile?.name || 'audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(dlUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (embedPreviewUrl) URL.revokeObjectURL(embedPreviewUrl);
      if (detectPreviewUrl) URL.revokeObjectURL(detectPreviewUrl);
      if (watermarkedAudioUrl) URL.revokeObjectURL(watermarkedAudioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header card ── */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-20 blur-xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Audio Watermarking
              </h2>
              <p className="text-sm dark:text-purple-200/80 text-purple-800/80">
                Upload an audio file → embed a hidden signature → listen to & download the protected copy.
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 dark:bg-white/5 bg-purple-50/80 backdrop-blur-sm rounded-xl max-w-xs border dark:border-white/10 border-purple-200/60 mb-6">
            {(['embed', 'detect'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-slate-300 dark:hover:text-white text-[#2d1b4e]'
                }`}
              >
                {tab === 'embed' ? <Lock className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {tab === 'embed' ? 'Embed' : 'Detect'}
              </button>
            ))}
          </div>

          {/* ════════════ EMBED TAB ════════════ */}
          <AnimatePresence mode="wait">
            {activeTab === 'embed' && (
              <motion.div
                key="embed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6"
              >
                {/* Left: Upload + controls */}
                <div className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-5 h-5 dark:text-purple-300 text-purple-700" />
                      <h3 className="text-lg font-semibold dark:text-white text-[#2d1b4e]">Input Audio</h3>
                    </div>
                    {embedFile && (
                      <button onClick={resetEmbed} className="text-slate-400 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    ref={embedInputRef}
                    type="file"
                    accept={ACCEPTED_AUDIO}
                    className="hidden"
                    onChange={(e) => setEmbedFileWithPreview(e.target.files?.[0] || null)}
                  />

                  {/* Drop zone */}
                  <motion.div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer group overflow-hidden transition-all ${
                      embedDragOver ? 'border-pink-400/80 bg-pink-500/5' : 'border-purple-400/30 hover:border-pink-400/50'
                    }`}
                    whileHover={{ scale: 1.005 }}
                    onClick={() => embedInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setEmbedDragOver(true); }}
                    onDragLeave={() => setEmbedDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setEmbedDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) setEmbedFileWithPreview(file);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3 group-hover:text-pink-400 transition-colors" />
                    {embedFile ? (
                      <p className="text-base text-green-300 font-medium">{embedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-base dark:text-purple-200 text-purple-800 mb-1 font-medium">Drag & drop or click to browse</p>
                        <p className="text-xs dark:text-purple-300 text-purple-700/60">WAV · MP3 · M4A · FLAC · AAC · OGG</p>
                      </>
                    )}
                  </motion.div>

                  {/* Input audio preview */}
                  {embedPreviewUrl && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="text-xs dark:text-purple-300 text-purple-700/70 mb-2 flex items-center gap-1">
                        <Music className="w-3 h-3" /> Original Audio Preview
                      </p>
                      <AudioPlayer src={embedPreviewUrl} label={embedFile?.name || 'Input audio'} accent="from-purple-500 to-pink-500" />
                    </motion.div>
                  )}

                  {/* Parameters */}
                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium dark:text-purple-200 text-purple-800 mb-1.5">Watermark ID</label>
                      <input
                        type="text"
                        value={secretId}
                        onChange={(e) => setSecretId(e.target.value)}
                        placeholder="e.g. evidence_2026_001"
                        className="w-full dark:bg-white/10 bg-purple-100 border dark:border-white/10 border-purple-200/60 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-pink-400 transition-colors"
                      />
                    </div>
                  </div>

                  <form onSubmit={handleEmbedSubmit}>
                    <motion.button
                      type="submit"
                      disabled={!embedFile || embedLoading}
                      className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: !embedFile || embedLoading ? 1 : 1.01 }}
                      whileTap={{ scale: !embedFile || embedLoading ? 1 : 0.98 }}
                    >
                      {embedLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Embedding Watermark…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-5 h-5" /> Embed Watermark
                        </span>
                      )}
                    </motion.button>
                  </form>
                </div>

                {/* Right: Info + Output */}
                <div className="space-y-4">
                  {/* How it works */}
                  <div className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 dark:text-cyan-300 text-cyan-700" />
                      <h3 className="text-lg font-semibold dark:text-white text-[#2d1b4e]">How It Works</h3>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      {[
                        '1. Your audio is uploaded to the backend.',
                        '2. A hidden DSSS (Direct Sequence Spread Spectrum) watermark is woven into the waveform.',
                        '3. The watermarked copy is saved & returned for playback.',
                        '4. Download the protected file from the result below.',
                      ].map((step) => (
                        <div key={step} className="rounded-xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 p-3">{step}</div>
                      ))}
                    </div>
                  </div>

                  {/* Output audio player (shown after success) */}
                  <AnimatePresence>
                    {watermarkedAudioUrl && embedResult?.status === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <h3 className="text-base font-semibold dark:text-white text-[#2d1b4e]">Watermarked Output</h3>
                        </div>

                        <AudioPlayer
                          src={watermarkedAudioUrl}
                          label={`watermarked_${embedFile?.name || 'audio'}.wav`}
                          accent="from-green-400 to-emerald-500"
                        />

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {embedResult.watermark_id && (
                            <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 dark:text-purple-200 text-purple-800 font-mono">
                              ID: {embedResult.watermark_id}
                            </span>
                          )}
                          {embedResult.file_size_mb !== undefined && (
                            <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                              {embedResult.file_size_mb} MB
                            </span>
                          )}
                          {embedResult.correlation !== undefined && (
                            <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                              Correlation: {embedResult.correlation.toFixed(3)}
                            </span>
                          )}
                          {embedResult.snr_db !== undefined && (
                            <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                              SNR: {embedResult.snr_db.toFixed(1)} dB
                            </span>
                          )}
                          {embedResult.payload_integrity !== undefined && (
                            <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                              Payload Integrity: {embedResult.payload_integrity.toFixed(0)}%
                            </span>
                          )}
                          {embedResult.output_sample_rate && (
                            <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                              {(embedResult.output_sample_rate / 1000).toFixed(1)} kHz
                            </span>
                          )}
                          {embedResult.method && (
                            <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 dark:text-cyan-300 text-cyan-700">
                              {embedResult.method}
                            </span>
                          )}
                        </div>

                        {embedResult.explainability && (
                          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-slate-100 text-xs space-y-1">
                            <p className="font-semibold dark:text-white text-[#2d1b4e]">Watermark Explainability</p>
                            <p>{embedResult.explainability.description}</p>
                            <p>Band: {embedResult.explainability.frequency_band}</p>
                            <p>Correlation: {embedResult.explainability.correlation.toFixed(3)}</p>
                            <p>Threshold: {embedResult.explainability.detection_threshold.toFixed(2)}</p>
                          </div>
                        )}

                        {/* Download button */}
                        {embedResult.download_url && (
                          <motion.button
                            onClick={() => void handleDownload(embedResult.download_url!)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold dark:text-white text-[#2d1b4e] shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-shadow"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="w-4 h-4" />
                            Download Watermarked File
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error banner */}
                  <AnimatePresence>
                    {embedResult?.status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold dark:text-white text-[#2d1b4e]">Watermarking Failed</p>
                          <p className="text-xs text-slate-300 mt-1">{embedResult.message}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ════════════ DETECT TAB ════════════ */}
            {activeTab === 'detect' && (
              <motion.div
                key="detect"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6"
              >
                {/* Left: Upload + submit */}
                <div className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 dark:text-cyan-300 text-cyan-700" />
                      <h3 className="text-lg font-semibold dark:text-white text-[#2d1b4e]">Upload Audio to Inspect</h3>
                    </div>
                    {detectFile && (
                      <button onClick={resetDetect} className="text-slate-400 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    ref={detectInputRef}
                    type="file"
                    accept={ACCEPTED_AUDIO}
                    className="hidden"
                    onChange={(e) => setDetectFileWithPreview(e.target.files?.[0] || null)}
                  />

                  {/* Drop zone */}
                  <motion.div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer group overflow-hidden transition-all ${
                      detectDragOver ? 'border-cyan-400/80 bg-cyan-500/5' : 'border-cyan-400/30 hover:border-cyan-400/60'
                    }`}
                    whileHover={{ scale: 1.005 }}
                    onClick={() => detectInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDetectDragOver(true); }}
                    onDragLeave={() => setDetectDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDetectDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) setDetectFileWithPreview(file);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Search className="w-10 h-10 text-cyan-400 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                    {detectFile ? (
                      <p className="text-base text-green-300 font-medium">{detectFile.name}</p>
                    ) : (
                      <>
                        <p className="text-base text-cyan-200 mb-1 font-medium">Drop audio to check for watermarks</p>
                        <p className="text-xs dark:text-cyan-300 text-cyan-700/60">WAV · MP3 · M4A · FLAC · AAC · OGG</p>
                      </>
                    )}
                  </motion.div>

                  {/* Detect audio preview */}
                  {detectPreviewUrl && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="text-xs dark:text-cyan-300 text-cyan-700/70 mb-2 flex items-center gap-1">
                        <Music className="w-3 h-3" /> Audio Preview
                      </p>
                      <AudioPlayer src={detectPreviewUrl} label={detectFile?.name || 'Input audio'} accent="from-cyan-400 to-blue-500" />
                    </motion.div>
                  )}

                  <form onSubmit={handleDetectSubmit}>
                    <motion.button
                      type="submit"
                      disabled={!detectFile || detectLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: !detectFile || detectLoading ? 1 : 1.01 }}
                      whileTap={{ scale: !detectFile || detectLoading ? 1 : 0.98 }}
                    >
                      {detectLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Scanning…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Search className="w-5 h-5" /> Detect Watermark
                        </span>
                      )}
                    </motion.button>
                  </form>
                </div>

                {/* Right: Detect result */}
                <div className="space-y-4">
                  {/* Idle hint */}
                  {!detectResult && !detectLoading && (
                    <div className="rounded-2xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 p-6 h-full flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div>
                        <p className="dark:text-white text-[#2d1b4e] font-semibold mb-1">Watermark Scanner</p>
                        <p className="text-sm text-slate-400">Upload an audio file and click <em>Detect Watermark</em> to analyse its spectral signature.</p>
                      </div>
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {detectLoading && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6 flex flex-col items-center justify-center gap-4">
                      <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-sm text-cyan-200">Analysing spectral patterns…</p>
                    </div>
                  )}

                  {/* Detection result */}
                  <AnimatePresence>
                    {detectResult && !detectLoading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className={`rounded-2xl border p-6 space-y-4 ${
                          detectResult.status === 'error'
                            ? 'border-red-500/30 bg-red-500/10'
                            : detectResult.watermark_detected
                            ? 'border-green-500/30 bg-green-500/10'
                            : 'border-yellow-500/30 bg-yellow-500/10'
                        }`}
                      >
                        {detectResult.status === 'error' ? (
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold dark:text-white text-[#2d1b4e]">Scan Failed</p>
                              <p className="text-sm text-slate-300 mt-1">{detectResult.message}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              {detectResult.watermark_detected
                                ? <CheckCircle className="w-7 h-7 text-green-400 shrink-0" />
                                : <AlertCircle className="w-7 h-7 text-yellow-400 shrink-0" />}
                              <div>
                                <p className="text-lg font-bold dark:text-white text-[#2d1b4e]">
                                  {detectResult.watermark_detected ? '✅ Watermark Detected' : '⚠️ No Watermark Found'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{detectResult.message}</p>
                              </div>
                            </div>

                            {/* Metrics Area */}
                            {detectResult.correlation !== undefined && (
                              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                <div className="dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl p-3">
                                  <div className="text-xs text-slate-400 mb-1">Correlation</div>
                                  <div className="text-lg font-mono font-semibold dark:text-white text-[#2d1b4e]">
                                    {detectResult.correlation.toFixed(3)}
                                  </div>
                                </div>
                                <div className="dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl p-3">
                                  <div className="text-xs text-slate-400 mb-1">SNR</div>
                                  <div className="text-lg font-mono font-semibold dark:text-white text-[#2d1b4e]">
                                    {detectResult.snr_db?.toFixed(1) || '—'} dB
                                  </div>
                                </div>
                                <div className="dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl p-3">
                                  <div className="text-xs text-slate-400 mb-1">Integrity</div>
                                  <div className="text-lg font-mono font-semibold dark:text-white text-[#2d1b4e]">
                                    {detectResult.payload_integrity?.toFixed(0) || '0'}%
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Meta chips */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {detectResult.audio_duration !== undefined && (
                                <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                                  Duration: {detectResult.audio_duration.toFixed(1)}s
                                </span>
                              )}
                              {detectResult.sample_rate && (
                                <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                                  {(detectResult.sample_rate / 1000).toFixed(1)} kHz
                                </span>
                              )}
                              {detectResult.extracted_id && (
                                <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 dark:text-cyan-300 text-cyan-700 font-mono">
                                  {detectResult.extracted_id}
                                </span>
                              )}
                              {detectResult.correlation !== undefined && (
                                <span className="rounded-lg border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-2.5 py-1 text-slate-300">
                                  Correlation: {detectResult.correlation.toFixed(3)}
                                </span>
                              )}
                            </div>
                            {detectResult.explainability && (
                              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-slate-100 text-xs space-y-1">
                                <p className="font-semibold dark:text-white text-[#2d1b4e]">Watermark Explainability</p>
                                <p>{detectResult.explainability.description}</p>
                                <p>Band: {detectResult.explainability.frequency_band}</p>
                                <p>Correlation: {detectResult.explainability.correlation.toFixed(3)}</p>
                                <p>Threshold: {detectResult.explainability.detection_threshold.toFixed(2)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {detectResult && !detectLoading && (
                    <button
                      onClick={resetDetect}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 py-2 text-sm text-slate-300 dark:hover:text-white text-[#2d1b4e] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Scan Another File
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
