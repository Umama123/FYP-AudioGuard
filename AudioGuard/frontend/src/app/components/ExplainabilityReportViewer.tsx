import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, TrendingUp, Zap, Map, BookOpen, BarChart3 } from 'lucide-react';
import type { ExplainabilityReport } from '../api';

interface ExplainabilityReportViewerProps {
  report: ExplainabilityReport;
  isOpen: boolean;
  onClose: () => void;
}

export function ExplainabilityReportViewer({ report, isOpen, onClose }: ExplainabilityReportViewerProps) {
  if (!isOpen || !report) return null;

  const confidence = report.detection_result?.confidence ?? 0;
  const status = report.detection_result?.status ?? 'Unknown';
  const isDeepfake = status === 'Deepfake';
  const isAI = status === 'AI Generated';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#1e1435]/95 backdrop-blur-2xl border border-purple-900/40 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md border-b border-purple-900/40 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Explainability Report
                </h2>
                <p className="dark:text-purple-300 text-purple-700 text-sm mt-1">Why & Where AI Detection Occurred</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg dark:bg-white/10 bg-purple-100 hover:bg-red-500/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 dark:text-purple-300 text-purple-700" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-8 py-8 space-y-8">
              {/* Detection Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-6 rounded-xl border-2 ${
                  isDeepfake
                    ? 'border-red-500/40 bg-red-500/10'
                    : isAI
                    ? 'border-orange-500/40 bg-orange-500/10'
                    : 'border-green-500/40 bg-green-500/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isDeepfake
                        ? 'bg-red-500/30'
                        : isAI
                        ? 'bg-orange-500/30'
                        : 'bg-green-500/30'
                    }`}
                  >
                    {isDeepfake || isAI ? (
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          isDeepfake ? 'text-red-400' : 'text-orange-400'
                        }`}
                      />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Detection: <span className={isDeepfake ? 'text-red-300' : isAI ? 'text-orange-300' : 'text-green-300'}>
                        {status}
                      </span>
                    </p>
                    <p className="dark:text-purple-200 text-purple-800 mt-2">
                      <span className="font-semibold dark:text-white text-[#2d1b4e]">{confidence}%</span> confidence level based on acoustic and spectral analysis
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Why It's AI - Key Findings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Why It's {status}
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.findings && report.findings.length > 0 ? (
                    report.findings.map((finding, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        className="relative p-4 rounded-lg dark:bg-white/5 bg-purple-50/80 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                      >
                        <p className="dark:text-purple-100 text-purple-900 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                          {finding}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="dark:text-purple-300 text-purple-700/60">No specific findings available</p>
                  )}
                </div>
              </motion.div>

              {/* Where It's Detected - Anomaly Regions */}
              {report.anomaly_regions && report.anomaly_regions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Map className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Where It's Detected
                    </h3>
                    <span className="text-sm dark:text-cyan-300 text-cyan-700 bg-cyan-500/10 px-3 py-1 rounded-full">
                      {report.anomaly_regions.length} regions
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.anomaly_regions.map((region, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + idx * 0.05 }}
                        className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold dark:text-cyan-300 text-cyan-700">
                            Region {idx + 1}
                          </p>
                          <span className="text-xs bg-cyan-500/20 dark:text-cyan-300 text-cyan-700 px-2 py-1 rounded">
                            {region.duration_seconds.toFixed(2)}s duration
                          </span>
                        </div>
                        <p className="text-sm dark:text-purple-200 text-purple-800">
                          <span className="dark:text-cyan-300 text-cyan-700 font-semibold">
                            {region.start_time_seconds.toFixed(2)}s
                          </span>
                          {' → '}
                          <span className="dark:text-cyan-300 text-cyan-700 font-semibold">
                            {region.end_time_seconds.toFixed(2)}s
                          </span>
                        </p>
                        <div className="mt-2 h-2 bg-purple-900/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                            style={{
                              width: `${Math.min(region.anomaly_intensity * 100, 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs dark:text-purple-300 text-purple-700/60 mt-1">
                          Anomaly intensity: {(region.anomaly_intensity * 100).toFixed(1)}%
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Metrics */}
              {report.metrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Analysis Metrics
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <MetricCard
                      label="Anomaly Regions"
                      value={report.metrics.total_anomaly_regions}
                      unit="detected"
                      color="from-purple-500 to-pink-500"
                    />
                    <MetricCard
                      label="Average Entropy"
                      value={report.metrics.average_entropy.toFixed(2)}
                      unit="bits"
                      color="from-blue-500 to-cyan-500"
                      subtitle="Lower = more structured"
                    />
                    <MetricCard
                      label="Entropy Std Dev"
                      value={report.metrics.entropy_std.toFixed(2)}
                      unit=""
                      color="from-pink-500 to-rose-500"
                    />
                    <MetricCard
                      label="Avg Discontinuity"
                      value={report.metrics.average_discontinuity.toFixed(2)}
                      unit=""
                      color="from-orange-500 to-red-500"
                      subtitle="Higher = unnatural jumps"
                    />
                    <MetricCard
                      label="Discontinuity Std"
                      value={report.metrics.discontinuity_std.toFixed(2)}
                      unit=""
                      color="from-green-500 to-emerald-500"
                    />
                    <MetricCard
                      label="Anomaly Coverage"
                      value={report.metrics.anomaly_coverage_percent.toFixed(1)}
                      unit="%"
                      color="from-yellow-500 to-orange-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* Spectrograms */}
              {report.visualization && report.visualization.image_base64 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Spectral Analysis
                    </h3>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-white/5 bg-purple-50/80 border border-indigo-500/20 overflow-auto">
                    <img
                      src={`data:image/png;base64,${report.visualization.image_base64}`}
                      alt="Spectrogram Analysis"
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm dark:text-purple-300 text-purple-700/60 mt-3">{report.visualization.description}</p>
                  </div>
                </motion.div>
              )}

              {/* Forensic CAM Visualization */}
              {report.forensic_visualization && report.forensic_visualization.image_base64 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Forensic Class Activation Map
                    </h3>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-white/5 bg-purple-50/80 border border-red-500/20 overflow-auto">
                    <img
                      src={`data:image/png;base64,${report.forensic_visualization.image_base64}`}
                      alt="Forensic CAM"
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm dark:text-purple-300 text-purple-700/60 mt-3">{report.forensic_visualization.description}</p>
                  </div>
                </motion.div>
              )}

              {/* Recommendations */}
              {report.recommendations && report.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Recommendations
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.65 + idx * 0.05 }}
                        className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-100"
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        {rec}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  subtitle?: string;
}

function MetricCard({ label, value, unit, color, subtitle }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-lg bg-gradient-to-br ${color} bg-opacity-10 border border-opacity-30 border-white`}
    >
      <p className="text-xs dark:text-purple-300 text-purple-700/60 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {value}
        <span className="text-sm dark:text-purple-300 text-purple-700 font-normal ml-1">{unit}</span>
      </p>
      {subtitle && <p className="text-xs dark:text-purple-300 text-purple-700/70 mt-1">{subtitle}</p>}
    </motion.div>
  );
}
