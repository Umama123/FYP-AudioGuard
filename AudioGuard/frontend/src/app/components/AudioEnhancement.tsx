import { useState, useRef } from 'react';
import { Upload, Download, Save, Wand2, Sparkles, BarChart3, Files, X, Music, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { enhanceAudio, buildApiUrl } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: string;
  status: 'pending' | 'enhancing' | 'done' | 'error';
  improvement?: { quality: number; noiseReduction: number; clarityBoost: number };
  originalUrl?: string;
  enhancedUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

const ACCEPTED_AUDIO = '.wav,.mp3,.m4a,.flac,.aac,.ogg';

// ─── File Row ─────────────────────────────────────────────────────────────────
function FileRow({ uf, onRemove }: { uf: UploadedFile; onRemove: () => void }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-4 dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-orange-500/30 to-pink-500/30 rounded-lg flex items-center justify-center shrink-0">
        <Music className="w-5 h-5 text-orange-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="dark:text-white text-[#2d1b4e] font-medium text-sm truncate">{uf.name}</p>
        <p className="dark:text-purple-300 text-purple-700/60 text-xs">{uf.size}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {uf.status === 'enhancing' && <span className="text-xs text-orange-300">Processing...</span>}
        {uf.status === 'done' && <span className="text-xs text-green-300">Enhanced</span>}
        {uf.status === 'pending' && <span className="text-xs dark:text-purple-300 text-purple-700/60">Ready</span>}
        <button onClick={onRemove} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-purple-50/80 hover:bg-red-500/20 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 dark:text-purple-300 text-purple-700" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AudioEnhancement() {
  const [activeTab, setActiveTab] = useState('single');
  const [dragOver, setDragOver] = useState(false);

  // Single file state
  const [singleFile, setSingleFile] = useState<UploadedFile | null>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);

  const makeFile = (file: File): UploadedFile => ({
    file, id: `${file.name}-${Date.now()}`,
    name: file.name, size: formatFileSize(file.size), status: 'pending',
  });

  const handleSingleFile = (file: File) => {
    setSingleFile(makeFile(file));
  };

  const runSingleEnhancement = async () => {
    if (!singleFile || singleFile.status === 'enhancing') return;
    setSingleFile(prev => prev ? { ...prev, status: 'enhancing' } : prev);

    try {
      // Pass default parameters to the backend implicitly
      const result = await enhanceAudio(singleFile.file, {
        quality: 75,
        denoiseStrength: 60,
        epochs: 10,
        learningRate: 30,
      });
      setSingleFile(prev => prev ? { 
        ...prev, 
        status: 'done', 
        improvement: result.improvement,
        originalUrl: result.originalUrl,
        enhancedUrl: result.enhancedUrl
      } : prev);
    } catch (err: any) {
      console.error('Enhancement error:', err);
      const errMsg = err.response?.data?.error || err.message || "Failed to process audio.";
      alert(`Backend Error: ${errMsg}`);
      setSingleFile(prev => prev ? { ...prev, status: 'error' } : prev);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length && activeTab === 'single') handleSingleFile(files[0]);
  };

  const isEnhancing = singleFile?.status === 'enhancing';
  const isDone = singleFile?.status === 'done';

  return (
    <div className="space-y-6">
      {/* Header & Upload Section */}
      <motion.div className="relative overflow-hidden rounded-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-20 blur-2xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
              <Wand2 className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Audio Enhancement
              </h2>
              <p className="dark:text-purple-300 text-purple-700/60 text-sm">Upload an audio file to remove noise and enhance clarity.</p>
            </div>
          </div>

          <Tabs defaultValue="single" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 dark:bg-white/5 bg-purple-50/80 backdrop-blur-sm border dark:border-white/10 border-purple-200/60 p-1 rounded-xl mb-6">
              <TabsTrigger value="single" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all">
                <Music className="w-4 h-4 mr-2" />Single File
              </TabsTrigger>
              <TabsTrigger value="batch" disabled className="opacity-50">
                <Files className="w-4 h-4 mr-2" />Batch Upload (Coming Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <input ref={singleInputRef} type="file" accept={ACCEPTED_AUDIO} className="hidden"
                onChange={e => e.target.files?.[0] && handleSingleFile(e.target.files[0])} />
              
              {!singleFile ? (
                <motion.div
                  className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer group overflow-hidden transition-all ${dragOver ? 'border-orange-400/80 bg-orange-500/5' : 'border-purple-400/30 hover:border-orange-400/50'}`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => singleInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <Upload className="w-20 h-20 text-purple-400 mx-auto mb-4 group-hover:text-orange-400 transition-colors" />
                  <p className="text-xl dark:text-purple-200 text-purple-800 mb-2 font-semibold">Drop your audio file or <span className="text-orange-400 underline">browse</span></p>
                  <p className="text-sm dark:text-purple-300 text-purple-700/60">WAV, MP3, M4A, FLAC, AAC</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <FileRow uf={singleFile} onRemove={() => setSingleFile(null)} />
                  
                  {!isDone && (
                    <motion.button
                      onClick={runSingleEnhancement}
                      disabled={isEnhancing}
                      className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-70"
                      whileHover={{ scale: isEnhancing ? 1 : 1.02 }} whileTap={{ scale: isEnhancing ? 1 : 0.98 }}
                    >
                      {isEnhancing ? (
                        <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><BarChart3 className="w-6 h-6" /></motion.div> Enhancing Audio...</>
                      ) : (
                        <><Sparkles className="w-6 h-6" /> Enhance Audio</>
                      )}
                    </motion.button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* ── Playback & Results Comparison ── */}
      <AnimatePresence>
        {isDone && singleFile?.improvement && (
          <motion.div className="relative overflow-hidden rounded-2xl mt-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 opacity-20 blur-2xl" />
            <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Enhancement Results
              </h2>

              {/* Native Audio Players */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Original Audio */}
                <div className="bg-gray-800/40 border border-gray-600/30 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                  <h3 className="text-lg font-bold text-gray-300 mb-6">Original Audio</h3>
                  {singleFile.originalUrl ? (
                    <div className="w-full max-w-sm rounded-full overflow-hidden border border-gray-600/50 shadow-inner">
                      <audio controls className="w-full bg-gray-900" src={buildApiUrl(singleFile.originalUrl)} />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Not available</p>
                  )}
                </div>

                {/* Enhanced Audio */}
                <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-6 flex items-center gap-2">
                    AI Enhanced <Sparkles className="w-5 h-5 text-yellow-400" />
                  </h3>
                  {singleFile.enhancedUrl ? (
                    <div className="w-full max-w-sm rounded-full overflow-hidden border border-purple-500/50 shadow-inner ring-2 ring-purple-500/20">
                      <audio controls className="w-full bg-gray-900" src={buildApiUrl(singleFile.enhancedUrl)} />
                    </div>
                  ) : (
                    <p className="text-purple-400/50 text-sm">Not available</p>
                  )}
                </div>
              </div>

              {/* Simple 3 Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'SNR Boost', value: `+${singleFile.improvement.quality}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Noise Floor Drop', value: `${singleFile.improvement.noiseReduction}%`, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { label: 'Spectral Bandwidth', value: `+${singleFile.improvement.clarityBoost}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((metric) => (
                  <div key={metric.label} className={`${metric.bg} rounded-xl p-6 text-center border border-white/5 shadow-md hover:scale-105 transition-transform`}>
                    <p className="text-xs font-semibold dark:text-white text-[#2d1b4e]/60 mb-2 uppercase tracking-wider">{metric.label}</p>
                    <p className={`text-3xl font-black ${metric.color}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              {singleFile.enhancedUrl && (
                <a
                  href={buildApiUrl(singleFile.enhancedUrl)}
                  download={`enhanced_${singleFile.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-green-500 to-cyan-600 dark:text-white text-[#2d1b4e] py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  <Save className="w-6 h-6" /> Download Enhanced Audio <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
