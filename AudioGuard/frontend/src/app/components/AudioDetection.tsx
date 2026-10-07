import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileAudio, Files, Video, CheckCircle, AlertTriangle, Zap, FileText, Phone, Sparkles, Radio, Activity, X, Music, Cpu, BarChart2, Waves, Scale, ChevronDown, Lock, Download, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Slider } from './ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { buildApiUrl, detectAudio, type ExplainabilityReport } from '../api';
import { ExplainabilityReportViewer } from './ExplainabilityReportViewer';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AudioFile {
  file: File;
  id: string;
  name: string;
  size: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  result?: DetectionResult;
  errorMessage?: string;
}

interface DetectionResult {
  status: 'Real' | 'Deepfake' | 'AI Generated';
  confidence: number;
  features: AudioFeatures;
  explainability?: ExplainabilityReport;
}

interface AudioFeatures {
  mfcc: number[];
  spectralCentroid: number;
  zeroCrossingRate: number;
  rmsEnergy: number;
  spectralRolloff: number;
  tempo: number;
  pitchConsistency: number;
}


// Client-side fallback removed to prevent synthetic values.

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

const ACCEPTED_AUDIO = '.wav,.mp3,.m4a,.flac,.aac,.ogg';

// ─── File Card ────────────────────────────────────────────────────────────────
//  Iski jagah yeh paste kar do:
function FileCard({ af, onRemove }: { af: AudioFile; onRemove: () => void }) {
  const statusColor = af.result?.status === 'Real' ? 'green' : af.result?.status === 'Deepfake' ? 'red' : 'orange';
  return (
    <motion.div
      className="flex items-center justify-between p-4 dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl backdrop-blur-sm"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 dark:text-purple-300 text-purple-700" />
        </div>
        <div className="min-w-0">
          <p className="dark:text-white text-[#2d1b4e] font-medium text-sm truncate max-w-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>{af.name}</p>
          <p className="dark:text-purple-300 text-purple-700/60 text-xs">{af.size}</p>
        </div>
      </div>



      <div className="flex items-center gap-3 shrink-0">
        {af.status === 'analyzing' && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Activity className="w-5 h-5 text-purple-400" />
          </motion.div>
        )}
        {af.result && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${statusColor}-500/30 text-${statusColor}-300`}>
            {af.result.status} {af.result.confidence}%
          </span>
        )}
        {af.status === 'pending' && <span className="text-xs dark:text-purple-300 text-purple-700/60">Ready</span>}
        {af.status === 'error' && <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded border border-red-500/20">{af.errorMessage || 'AI is not connected'}</span>}
        <button onClick={onRemove} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-purple-50/80 hover:bg-red-500/20 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 dark:text-purple-300 text-purple-700" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AudioDetection() {
  const [noiseReduction, setNoiseReduction] = useState([50]);
  const [quality, setQuality] = useState([75]);
  const [singleFile, setSingleFile] = useState<AudioFile | null>(null);
  const [batchFiles, setBatchFiles] = useState<AudioFile[]>([]);
  const [videoFile, setVideoFile] = useState<AudioFile | null>(null);
  const [activeTab, setActiveTab] = useState('single');
  const [dragOver, setDragOver] = useState(false);
  const [showExplainabilityReport, setShowExplainabilityReport] = useState(false);
  const [selectedExplainability, setSelectedExplainability] = useState<ExplainabilityReport | null>(null);
  const [legalStatus, setLegalStatus] = useState<string>("");
  const [showAgencyDialog, setShowAgencyDialog] = useState(false);
  const [pendingLegalReport, setPendingLegalReport] = useState<{ fileName: string; status: string; confidence: number } | null>(null);
  const [showEvidenceReview, setShowEvidenceReview] = useState(false);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [isGeneratingEvidence, setIsGeneratingEvidence] = useState(false);

  // 🔒 Watermarking States
  const [showWatermarkingModal, setShowWatermarkingModal] = useState(false);
  const [watermarkingStatus, setWatermarkingStatus] = useState<string>("");
  const [watermarkResult, setWatermarkResult] = useState<any>(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkSecretId, setWatermarkSecretId] = useState<string>("");

  const generateEvidenceReport = async (fileName: string, currentStatus: string, confidenceScore: number, selectedOrg: string) => {
    setIsGeneratingEvidence(true);
    try {
      const response = await fetch(buildApiUrl('/api/legal/generate-evidence'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: fileName,
          status: currentStatus,
          confidence: confidenceScore,
          organization: selectedOrg,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Failed to generate evidence (${response.status})`);
      }

      setEvidenceData(data);
      setShowEvidenceReview(true);
      setShowAgencyDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Evidence generation error:', message);
      setLegalStatus(`❌ Failed to generate evidence: ${message}`);
    } finally {
      setIsGeneratingEvidence(false);
    }
  };

  const sendLegalReport = async (fileName: string, currentStatus: string, confidenceScore: number, selectedOrg: string) => {
    if (currentStatus === 'Real') {
      setLegalStatus("🛡️ Legal action is not required for this verified authentic profile.");
      return;
    }

    setLegalStatus("Reporting...");
    try {
      const response = await fetch(buildApiUrl('/api/legal/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: fileName,
          status: currentStatus,
          confidence: confidenceScore,
          organization: selectedOrg,
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? 'Failed to submit legal report');
      }

      setLegalStatus(
        `✅ Report Submitted!\n\nCase ID: ${data.case_id}\nOrganization: ${selectedOrg}\n\n📄 Email Status: ${data.email_sent ? '✅ SENT' : '⚠️ QUEUED'}\n\n${data.email_draft}`
      );
      setShowAgencyDialog(false);
      setPendingLegalReport(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLegalStatus(`❌ Failed: ${message}`);
    }
  };

  const sendEvidenceReport = async (evidence: any) => {
    if (evidence.status === 'Real') {
      setLegalStatus("🛡️ Legal action is not required for this verified authentic profile.");
      setShowEvidenceReview(false);
      setEvidenceData(null);
      return;
    }

    setLegalStatus("Sending report...");
    try {
      const response = await fetch(buildApiUrl('/api/legal/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: evidence.case_id,
          status: evidence.status,
          confidence: evidence.confidence,
          organization: evidence.organization,
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? 'Failed to submit legal report');
      }

      setLegalStatus(
        `✅ Report Submitted!\n\nCase ID: ${data.case_id}\nOrganization: ${evidence.organization}\n\n📄 Email Status: ${data.email_sent ? '✅ SENT' : '⚠️ QUEUED'}\n\n${data.email_draft}`
      );
      setShowEvidenceReview(false);
      setEvidenceData(null);
      setPendingLegalReport(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLegalStatus(`❌ Failed: ${message}`);
    }
  };

  // 🔒 ─── WATERMARKING FUNCTIONS ─────────────────────────────────────────────
  const embedWatermark = async () => {
    const currentFile = singleFile || (batchFiles.length > 0 ? batchFiles[0] : null) || videoFile;
    if (!currentFile?.file) {
      setWatermarkingStatus('❌ Please upload an audio file first.');
      return;
    }

    setIsWatermarking(true);
    setWatermarkingStatus('🔒 Embedding watermark...');

    try {
      const formData = new FormData();
      formData.append('file', currentFile.file);
      formData.append('secret_id', watermarkSecretId || `watermark_${Date.now()}`);
      formData.append('sample_rate', '16000');

      const response = await fetch(buildApiUrl('/api/watermarking/embed'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to embed watermark');
      }

      setWatermarkResult(data);
      setWatermarkingStatus('✅ Watermark embedded successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Watermarking error:', error);
      setWatermarkingStatus(`❌ Watermarking failed: ${message}`);
    } finally {
      setIsWatermarking(false);
    }
  };

  const downloadWatermarkedAudio = async () => {
    if (!watermarkResult?.download_url) {
      setWatermarkingStatus('❌ No download URL available');
      return;
    }

    try {
      const response = await fetch(buildApiUrl(watermarkResult.download_url));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked_${watermarkResult.watermark_id}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setWatermarkingStatus('❌ Failed to download audio');
    }
  };

  const singleInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const makeAudioFile = (file: File): AudioFile => ({
    file, id: `${file.name}-${Date.now()}-${Math.random()}`,
    name: file.name, size: formatFileSize(file.size), status: 'pending',
  });

  const runDetection = useCallback(async (af: AudioFile, setter: (fn: (prev: AudioFile) => AudioFile) => void) => {
    setter(prev => ({ ...prev, status: 'analyzing' }));
    try {
      // ── Flask backend call ──────────────────────────────────────────────────
      const result = await detectAudio(af.file);
      setter(prev => ({ ...prev, status: 'done', result }));
    } catch (err: any) {
      console.error('Audio analysis error (Flask):', err);
      // No dummy features or fallback. Just show error.
      const errorMessage = err.message || 'AI is not connected or failed to process.';
      setter(prev => ({ ...prev, status: 'error', errorMessage: errorMessage }));
    }
  }, []);

  const handleSingleFile = (file: File) => {
    const af = makeAudioFile(file);
    setSingleFile(af);
    runDetection(af, fn => setSingleFile(prev => prev ? fn(prev) : prev));
  };

  const handleBatchFiles = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 20).map(makeAudioFile);
    setBatchFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(af => {
      runDetection(af, fn => setBatchFiles(prev => prev.map(f => f.id === af.id ? fn(f) : f)));
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    if (activeTab === 'single') handleSingleFile(files[0]);
    else if (activeTab === 'batch') handleBatchFiles(files);
    else if (activeTab === 'video') setVideoFile(makeAudioFile(files[0]));
  };

  const isAnalyzing = activeTab === 'single' ? singleFile?.status === 'analyzing'
    : activeTab === 'batch' ? batchFiles.some(f => f.status === 'analyzing') : false;

  const activeResult = activeTab === 'single' ? singleFile?.result
    : activeTab === 'batch' ? batchFiles.find(f => f.result)?.result : undefined;

  const handleShowExplainabilityReport = useCallback(() => {
    if (activeResult?.explainability) {
      setSelectedExplainability(activeResult.explainability);
      setShowExplainabilityReport(true);
    }
  }, [activeResult?.explainability]);

  // Auto-show explainability report when detection completes
  useEffect(() => {
    if (activeResult?.explainability && !showExplainabilityReport) {
      setSelectedExplainability(activeResult.explainability);
      setShowExplainabilityReport(true);
    }
  }, [activeResult?.explainability]);

  return (
    <div className="space-y-6">

      {/* ── Upload Section ── */}
      <motion.div className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-20 blur-xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} className="absolute w-2 h-2 bg-purple-400 rounded-full"
                style={{ left: `${15 + i * 17}%`, top: `${8 + i * 12}%` }}
                animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5 }} />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Upload Audio for Detection
              </h2>
            </div>

            <Tabs defaultValue="single" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 dark:bg-white/5 bg-purple-50/80 backdrop-blur-sm border dark:border-white/10 border-purple-200/60 p-1 rounded-xl">
                {[
                  { value: 'single', icon: <FileAudio className="w-4 h-4 mr-2" />, label: 'Single File' },
                  { value: 'batch', icon: <Files className="w-4 h-4 mr-2" />, label: 'Batch Upload' },
                  { value: 'video', icon: <Video className="w-4 h-4 mr-2" />, label: 'From Video' },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all">
                    {t.icon}{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Single File */}
              <TabsContent value="single" className="mt-6">
                <input ref={singleInputRef} type="file" accept={ACCEPTED_AUDIO} className="hidden"
                  onChange={e => e.target.files?.[0] && handleSingleFile(e.target.files[0])} />
                {!singleFile ? (
                  <motion.div
                    className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer group overflow-hidden transition-all ${dragOver ? 'border-pink-400/80 bg-pink-500/5' : 'border-purple-400/30 hover:border-pink-400/50'}`}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => singleInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4 group-hover:text-pink-400 transition-colors" />
                    </motion.div>
                    <p className="text-lg dark:text-purple-200 text-purple-800 mb-2 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      Drag & drop or <span className="text-pink-400 underline">browse</span> your audio file
                    </p>
                    <p className="text-sm dark:text-purple-300 text-purple-700/60">Supports: WAV, MP3, M4A, FLAC, AAC • Max 50MB</p>
                  </motion.div>
                ) : (
                  <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <FileCard
                      af={singleFile} onRemove={() => setSingleFile(null)} />
                    <button onClick={() => { setSingleFile(null); setTimeout(() => singleInputRef.current?.click(), 50); }}
                      className="w-full py-2 rounded-xl border border-purple-400/30 dark:text-purple-300 text-purple-700 text-sm hover:border-pink-400/50 hover:text-pink-300 transition-all">

                    </button>
                  </motion.div>
                )}
              </TabsContent>

              {/* Batch Upload */}
              <TabsContent value="batch" className="mt-6">
                <input ref={batchInputRef} type="file" accept={ACCEPTED_AUDIO} multiple className="hidden"
                  onChange={e => e.target.files && handleBatchFiles(e.target.files)} />
                <motion.div
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer group overflow-hidden transition-all mb-4 ${dragOver ? 'border-pink-400/80 bg-pink-500/5' : 'border-purple-400/30 hover:border-pink-400/50'}`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => batchInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <Files className="w-12 h-12 text-purple-400 mx-auto mb-3 group-hover:text-pink-400 transition-colors" />
                  <p className="text-lg dark:text-purple-200 text-purple-800 mb-1 font-medium">
                    Select multiple audio files from your computer
                  </p>
                  <p className="text-sm dark:text-purple-300 text-purple-700/60">Up to 20 files • Max 50MB each • Analyzed in parallel</p>
                </motion.div>
                {batchFiles.length > 0 && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {batchFiles.map(af => (
                      // changed lines 
                      <FileCard key={af.id} af={af} onRemove={() => setBatchFiles(prev => prev.filter(f => f.id !== af.id))} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* From Video */}
              <TabsContent value="video" className="mt-6">
                <input ref={videoInputRef} type="file" accept=".mp4,.avi,.mov,.mkv,.webm" className="hidden"
                  onChange={e => e.target.files?.[0] && setVideoFile(makeAudioFile(e.target.files[0]))} />
                <motion.div
                  className="relative border-2 border-dashed border-purple-400/30 rounded-2xl p-16 text-center hover:border-pink-400/50 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => videoInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <Video className="w-16 h-16 text-purple-400 mx-auto mb-4 group-hover:text-pink-400 transition-colors" />
                  <p className="text-lg dark:text-purple-200 text-purple-800 mb-2 font-medium">Extract & analyze audio from video</p>
                  <p className="text-sm dark:text-purple-300 text-purple-700/60">MP4, AVI, MOV, MKV • Max 100MB</p>
                </motion.div>
                {videoFile && (
                  <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <FileCard af={videoFile} onRemove={() => setVideoFile(null)} />

                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>

      {/* ── AI Preprocessing Controls ── */}
      <motion.div className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30 blur-xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Radio className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>AI Preprocessing</h2>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold dark:text-purple-200 text-purple-800">Neural Noise Reduction</label>
                <motion.span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
                  key={noiseReduction[0]} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
                  {noiseReduction[0]}%
                </motion.span>
              </div>
              <div className="relative">
                <Slider value={noiseReduction} onValueChange={setNoiseReduction} max={100} step={1} className="w-full" />
                <motion.div className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-sm"
                  style={{ width: `${noiseReduction[0]}%` }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold dark:text-purple-200 text-purple-800">AI Quality Enhancement</label>
                <motion.span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                  key={quality[0]} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
                  {quality[0]}%
                </motion.span>
              </div>
              <div className="relative">
                <Slider value={quality} onValueChange={setQuality} max={100} step={1} className="w-full" />
                <motion.div className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-sm"
                  style={{ width: `${quality[0]}%` }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
            </div>

            <motion.button
              disabled={isAnalyzing || (!singleFile && batchFiles.length === 0 && !videoFile)}
              className="relative w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white py-4 px-8 rounded-xl font-bold text-lg overflow-hidden group disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              whileHover={{ scale: isAnalyzing ? 1 : 1.02 }} whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
            >
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-200, 400] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
              <span className="relative flex items-center justify-center gap-3">
                {isAnalyzing ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Activity className="w-6 h-6" /></motion.div>Analyzing Audio Features...</>
                ) : (
                  <><Zap className="w-6 h-6" />Start Analysis</>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Feature Extraction Visualization ── */}
      <AnimatePresence>
        {(singleFile?.result || batchFiles.some(f => f.result)) && (() => {
          const feat = activeTab === 'batch'
            ? batchFiles.find(f => f.result)?.result?.features
            : singleFile?.result?.features;
          if (!feat) return null;
          return (
            <motion.div className="relative overflow-hidden rounded-2xl"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}>
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163,159,239,0.1) 10px, rgba(163,159,239,0.1) 20px)' }} />
              <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Cpu className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
                  </div>
                  <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Extracted Audio Features
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Waveform */}
                  <div className="relative bg-[#0a0015] rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">Waveform Analysis</span>
                    </div>
                    <div className="relative h-32 flex items-center gap-0.5">
                      {[...Array(120)].map((_, i) => {
                        const mfccVal = feat.mfcc[i % 13] ?? 0;
                        const h = Math.max(5, Math.min(95, Math.abs(Math.sin(i * 0.15 + mfccVal * 0.01)) * 60 + Math.abs(mfccVal) * 1.2 + 8));
                        return (
                          <motion.div key={i} className="flex-1 bg-green-400 rounded-full"
                            style={{ height: `${h}%`, boxShadow: '0 0 6px rgba(74,222,128,0.5)' }}
                            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.004, type: 'spring' }} />
                        );
                      })}
                    </div>
                  </div>

                  {/* MFCC Coefficients */}
                  <div className="relative bg-[#0a0015] rounded-xl p-6 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart2 className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold dark:text-purple-300 text-purple-700">MFCC Coefficients (13)</span>
                    </div>
                    <div className="flex items-end gap-1 h-20">
                      {feat.mfcc.map((v, i) => {
                        const h = Math.max(5, Math.min(95, Math.abs(v) * 4 + 5));
                        return (
                          <motion.div key={i} className="flex-1 rounded-t-sm"
                            style={{ height: `${h}%`, background: `hsl(${260 + i * 8}, 70%, 65%)`, boxShadow: `0 0 4px hsl(${260 + i * 8},70%,65%,0.5)` }}
                            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                            transition={{ delay: 0.3 + i * 0.04, type: 'spring' }} />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {feat.mfcc.map((_, i) => (
                        <span key={i} className="text-xs text-purple-400/60 flex-1 text-center">C{i + 1}</span>
                      ))}
                    </div>
                  </div>

                  {/* Feature Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Spectral Centroid', value: `${feat.spectralCentroid.toFixed(0)} Hz`, col: 'text-cyan-200', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label_col: 'dark:text-cyan-300 text-cyan-700/70' },
                      { label: 'Zero Crossing Rate', value: feat.zeroCrossingRate.toFixed(4), col: 'text-pink-200', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label_col: 'text-pink-300/70' },
                      { label: 'RMS Energy', value: feat.rmsEnergy.toFixed(4), col: 'text-green-200', bg: 'bg-green-500/10', border: 'border-green-500/20', label_col: 'text-green-300/70' },
                      { label: 'Spectral Rolloff', value: `${feat.spectralRolloff.toFixed(0)} Hz`, col: 'text-orange-200', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label_col: 'text-orange-300/70' },
                      { label: 'Estimated Tempo', value: `${feat.tempo.toFixed(1)} BPM`, col: 'text-yellow-200', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label_col: 'text-yellow-300/70' },
                      { label: 'Pitch Consistency', value: `${(feat.pitchConsistency * 100).toFixed(1)}%`, col: 'dark:text-purple-200 text-purple-800', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label_col: 'dark:text-purple-300 text-purple-700/70' },
                    ].map(({ label, value, col, bg, border, label_col }) => (
                      <motion.div key={label} className={`${bg} border ${border} rounded-xl p-4`}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                        <p className={`text-xs ${label_col} mb-1`}>{label}</p>
                        <p className={`text-xl font-bold ${col}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Analysis Summary */}
                  <div className="dark:bg-[#1e1435]/90 bg-white/90 rounded-xl p-6 border border-purple-900/30">
                    <h3 className="text-lg font-bold dark:text-white text-[#2d1b4e] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Analysis Summary & Insights
                    </h3>
                    <div className="space-y-2">
                      {[
                        `Spectral Centroid ${feat.spectralCentroid >= 800 && feat.spectralCentroid <= 3500 ? 'in natural speech range (800–3500 Hz)' : `outside speech range — anomaly at ${feat.spectralCentroid.toFixed(0)} Hz`}`,
                        `Pitch consistency ${(feat.pitchConsistency * 100).toFixed(1)}% — ${feat.pitchConsistency > 0.85 ? 'unnaturally high: possible AI synthesis' : feat.pitchConsistency > 0.5 ? 'natural human variance' : 'irregular: possible deepfake signature'}`,
                        `ZCR ${feat.zeroCrossingRate >= 0.04 && feat.zeroCrossingRate <= 0.18 ? 'consistent with human speech' : 'anomalous pattern: outside natural range'}`,
                        `Tempo ${feat.tempo.toFixed(1)} BPM — ${feat.tempo > 60 && feat.tempo < 200 ? 'normal speech rhythm' : 'unusual rhythm detected'}`,
                        `MFCC analysis: ${feat.mfcc.slice(0, 3).map(v => v.toFixed(2)).join(', ')} (C1–C3) — spectral envelope characterized`,
                      ].map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span style={{ fontFamily: 'Open Sans, sans-serif' }}>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Detection Result ── */}
      <AnimatePresence>
        {activeResult && (
          <motion.div className="relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <motion.div
              className={`absolute inset-0 blur-2xl ${activeResult.status === 'Real' ? 'bg-green-500' : activeResult.status === 'Deepfake' ? 'bg-red-500' : 'bg-orange-500'}`}
              animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
            <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>AI Detection Result</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  className={`relative col-span-2 p-8 rounded-2xl overflow-hidden ${activeResult.status === 'Real' ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-400/30' : activeResult.status === 'Deepfake' ? 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-2 border-red-400/30' : 'bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-2 border-orange-400/30'}`}
                  whileHover={{ scale: 1.02 }}>
                  <div className="flex items-center gap-6">
                    <motion.div
                      className={`w-24 h-24 rounded-2xl flex items-center justify-center ${activeResult.status === 'Real' ? 'bg-green-500/30' : activeResult.status === 'Deepfake' ? 'bg-red-500/30' : 'bg-orange-500/30'}`}
                      animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                      transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}>
                      {activeResult.status === 'Real'
                        ? <CheckCircle className="w-12 h-12 text-green-300" strokeWidth={2.5} />
                        : <AlertTriangle className="w-12 h-12 text-red-300" strokeWidth={2.5} />}
                    </motion.div>
                    <div>
                      <motion.h3 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        {activeResult.status}
                      </motion.h3>
                      <p className="dark:text-purple-200 text-purple-800 text-lg">AI Confidence Level</p>
                      <p className="dark:text-purple-300 text-purple-700/60 text-sm mt-1">Based on MFCC + spectral + temporal features</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-400/30 flex flex-col items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                  <motion.div className="text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    {activeResult.confidence}%
                  </motion.div>
                  <p className="dark:text-purple-200 text-purple-800 text-sm">Confidence Score</p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  onClick={handleShowExplainabilityReport}
                  disabled={!activeResult?.explainability}
                  className="relative bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: activeResult?.explainability ? 1.02 : 1 }}
                  whileTap={{ scale: activeResult?.explainability ? 0.98 : 1 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}>
                  <span className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    {activeResult?.explainability ? 'Forensic Report' : 'Generating Report...'}
                  </span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    setWatermarkSecretId(`watermark_${Date.now()}`);
                    setWatermarkResult(null);
                    setWatermarkingStatus('');
                    setShowWatermarkingModal(true);
                  }}
                  className="relative bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold z-50 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />Embed Watermark
                  </span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    const currentFile = singleFile || (batchFiles.length > 0 ? batchFiles[0] : null) || videoFile;
                    if (!currentFile?.result) {
                      setLegalStatus('Please upload and analyze an audio file first.');
                      return;
                    }
                    setPendingLegalReport({
                      fileName: currentFile.file.name,
                      status: currentFile.result.status,
                      confidence: currentFile.result.confidence || 0,
                    });
                    setShowAgencyDialog(true);
                  }}
                  className="relative bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 px-6 rounded-xl font-semibold z-50 cursor-pointer w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />Contact Authorities
                  </span>
                </motion.button>
                {legalStatus && (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-purple-500/30 bg-purple-900/20 px-3 py-2 text-xs dark:text-purple-100 text-purple-900 font-mono whitespace-pre-wrap">
                    {legalStatus}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Agency Selection Dialog ── */}
      {showAgencyDialog && pendingLegalReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <motion.div
            className="w-full max-w-md rounded-2xl border dark:border-white/10 border-purple-200/60 bg-[#140d24] p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-semibold dark:text-white text-[#2d1b4e]">Dispatch to Authorities</h3>
            <p className="mt-2 text-sm dark:text-purple-200 text-purple-800">
              Select the agency to receive this forensic report.
            </p>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => pendingLegalReport && generateEvidenceReport(pendingLegalReport.fileName, pendingLegalReport.status, pendingLegalReport.confidence, 'FIA Cybercrime')}
                disabled={isGeneratingEvidence}
                className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-left text-white transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">FIA Cybercrime</div>
                <div className="text-sm text-red-200">Pakistan cybercrime enforcement</div>
              </button>
              <button
                onClick={() => pendingLegalReport && generateEvidenceReport(pendingLegalReport.fileName, pendingLegalReport.status, pendingLegalReport.confidence, 'NFA')}
                disabled={isGeneratingEvidence}
                className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left dark:text-white text-[#2d1b4e] transition hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">NFA</div>
                <div className="text-sm text-amber-200">National Forensic Agency</div>
              </button>
            </div>
            <button
              onClick={() => {
                setShowAgencyDialog(false);
                setPendingLegalReport(null);
                setLegalStatus('Report cancelled.');
              }}
              className="mt-4 w-full rounded-xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-2 text-sm dark:text-purple-100 text-purple-900 transition dark:hover:bg-white/10 hover:bg-purple-100"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* ── Evidence Review Modal ── */}
      {showEvidenceReview && evidenceData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 overflow-y-auto">
          <motion.div
            className="w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-[#140d24] p-6 shadow-2xl my-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold dark:text-white text-[#2d1b4e]">📋 Evidence Review</h3>
              <button
                onClick={() => setShowEvidenceReview(false)}
                className="dark:text-purple-300 text-purple-700 dark:hover:text-white text-[#2d1b4e] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm dark:text-purple-200 text-purple-800 mb-4">
              Case ID: <span className="font-mono font-semibold text-cyan-400">{evidenceData.case_id}</span>
            </p>

            {/* Evidence Draft Display */}
            <div className="max-h-96 overflow-y-auto rounded-xl border border-purple-500/20 bg-black/40 p-4 mb-4">
              <pre className="text-xs dark:text-purple-100 text-purple-900 font-mono whitespace-pre-wrap break-words">
                {evidenceData.evidence_draft}
              </pre>
            </div>

            {/* Evidence Points */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold dark:text-white text-[#2d1b4e] mb-2">Key Evidence:</h4>
              <div className="space-y-1">
                {evidenceData.evidence_points && evidenceData.evidence_points.map((point: string, idx: number) => (
                  <div key={idx} className="text-xs dark:text-purple-200 text-purple-800 flex gap-2">
                    <span className="text-purple-400 shrink-0">•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEvidenceReview(false);
                  setEvidenceData(null);
                  setPendingLegalReport(null);
                  setLegalStatus('Report cancelled.');
                }}
                className="flex-1 rounded-xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-2 text-sm dark:text-purple-100 text-purple-900 transition dark:hover:bg-white/10 hover:bg-purple-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await sendEvidenceReport(evidenceData);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600"
              >
                ✅ Send Report
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Batch Results Table ── */}
      <AnimatePresence>
        {activeTab === 'batch' && batchFiles.some(f => f.status === 'done') && (
          <motion.div className="relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-8">
              <h2 className="text-xl font-bold dark:text-white text-[#2d1b4e] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Batch Analysis Results
              </h2>
              <div className="space-y-2">
                {batchFiles.map(af => (
                  <motion.div key={af.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${af.result?.status === 'Real' ? 'border-green-500/30 bg-green-500/10' : af.result?.status === 'Deepfake' ? 'border-red-500/30 bg-red-500/10' : 'border-orange-500/30 bg-orange-500/10'}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Music className="w-5 h-5 dark:text-purple-300 text-purple-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="dark:text-white text-[#2d1b4e] font-medium text-sm truncate max-w-xs">{af.name}</p>
                        <p className="dark:text-purple-300 text-purple-700/60 text-xs">{af.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {af.status === 'analyzing' && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Activity className="w-5 h-5 text-purple-400" />
                        </motion.div>
                      )}
                      {af.result && (
                        <>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${af.result.status === 'Real' ? 'bg-green-500/30 text-green-300' : af.result.status === 'Deepfake' ? 'bg-red-500/30 text-red-300' : 'bg-orange-500/30 text-orange-300'}`}>
                            {af.result.status}
                          </span>
                          <span className="dark:text-purple-200 text-purple-800 text-sm font-bold">{af.result.confidence}%</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Explainability Report Viewer Guard Condition */}

      {/* 🔒 ── WATERMARKING MODAL ── */}
      {showWatermarkingModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 px-4">
          <motion.div
            className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950 to-slate-900 p-8 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl font-semibold dark:text-white text-[#2d1b4e]">🔒 Embed Watermark</h3>
            </div>

            <p className="text-sm text-blue-200 mb-6">
              Add an invisible cryptographic signature to protect this audio and verify authenticity.
            </p>

            {!watermarkResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Watermark ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={watermarkSecretId}
                    onChange={(e) => setWatermarkSecretId(e.target.value)}
                    placeholder="e.g., evidence_2026_001"
                    className="w-full dark:bg-white/10 bg-purple-100 border border-blue-500/30 rounded-lg px-4 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-cyan-400 text-sm"
                  />
                  <p className="text-xs text-blue-300/60 mt-1">Auto-generated if left blank</p>
                </div>

                {watermarkingStatus && (
                  <div className={`p-3 rounded-lg text-sm ${watermarkingStatus.includes('✅') ? 'bg-green-500/20 text-green-300' : watermarkingStatus.includes('❌') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {watermarkingStatus}
                  </div>
                )}

                <motion.button
                  onClick={embedWatermark}
                  disabled={isWatermarking}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isWatermarking ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        <Activity className="w-4 h-4" />
                      </motion.div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      Embed Watermark Now
                    </span>
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-400">Watermark Embedded!</p>
                      <div className="mt-2 space-y-1 text-sm text-green-200">
                        <p>ID: <span className="font-mono">{watermarkResult.watermark_id}</span></p>
                        <p>Confidence: <span className="font-mono">{(watermarkResult.confidence * 100).toFixed(1)}%</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={downloadWatermarkedAudio}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:text-white text-[#2d1b4e] font-bold py-3 px-4 rounded-lg transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download Watermarked Audio
                  </span>
                </motion.button>
              </div>
            )}

            <button
              onClick={() => {
                setShowWatermarkingModal(false);
                setWatermarkResult(null);
                setWatermarkingStatus('');
                setWatermarkSecretId('');
              }}
              className="mt-4 w-full rounded-xl border dark:border-white/10 border-purple-200/60 dark:bg-white/5 bg-purple-50/80 px-4 py-2 text-sm text-blue-200 transition dark:hover:bg-white/10 hover:bg-purple-100"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {selectedExplainability && (
        <ExplainabilityReportViewer
          report={selectedExplainability}
          isOpen={showExplainabilityReport}
          onClose={() => setShowExplainabilityReport(false)}
        />
      )}
    </div>
  );
}
