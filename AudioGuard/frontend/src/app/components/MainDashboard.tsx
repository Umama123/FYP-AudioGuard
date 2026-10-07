import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Shield, CheckCircle, Bell, FileText, Users, Activity, Zap, ArrowRight, Play, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Progress } from './ui/progress';

const recentActivities = [
  { file: 'call_recording_march_08.wav', result: 'Deepfake', action: 'Reported to Security', date: 'Mar 08, 2026', status: 'danger', duration: '2:34' },
  { file: 'meeting_recording_final.mp3', result: 'Real', action: 'None', date: 'Mar 07, 2026', status: 'success', duration: '45:12' },
  { file: 'voice_message_client.wav', result: 'AI Generated', action: 'Flagged for Review', date: 'Mar 07, 2026', status: 'warning', duration: '0:58' },
  { file: 'interview_session_03.wav', result: 'Real', action: 'None', date: 'Mar 06, 2026', status: 'success', duration: '28:45' },
  { file: 'suspicious_call_report.mp3', result: 'Deepfake', action: 'Reported to Security', date: 'Mar 06, 2026', status: 'danger', duration: '1:23' },
  { file: 'podcast_episode_12.mp3', result: 'Real', action: 'None', date: 'Mar 05, 2026', status: 'success', duration: '52:18' },
];

const awarenessTips = [
  'How scammers use cloned voices in phone calls',
  'How to verify suspicious audio messages',
  'Best practices to protect your voice identity',
  'Signs of AI-generated speech patterns',
];

export function MainDashboard() {
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* HERO SECTION */}
      <section className="min-h-[70vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center w-full">
          {/* Left Side - Hero Message */}
          <div className="lg:col-span-3 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 
                className="text-6xl lg:text-7xl font-bold dark:text-white text-[#2d1b4e] leading-tight mb-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Protect Your Voice.
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Trust Every Audio.
                </span>
              </h1>
              
              <p 
                className="text-2xl dark:text-purple-200 text-purple-800 leading-relaxed mb-8 max-w-2xl font-semibold"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                Detect deepfakes, preserve authenticity with watermarking, and review evidence from one intelligent workspace.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-10 py-5 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center gap-3"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 mt-10 pt-8 border-t dark:border-white/10 border-purple-200/60">
                <div>
                  <div className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>99.2%</div>
                  <div className="text-sm dark:text-purple-300 text-purple-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>Accuracy Rate</div>
                </div>
                <div className="h-12 w-px dark:bg-white/10 bg-purple-100"></div>
                <div>
                  <div className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>1M+</div>
                  <div className="text-sm dark:text-purple-300 text-purple-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>Audios Analyzed</div>
                </div>
                <div className="h-12 w-px dark:bg-white/10 bg-purple-100"></div>
                <div>
                  <div className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>&lt;2s</div>
                  <div className="text-sm dark:text-purple-300 text-purple-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>Analysis Time</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Floating 3D Teaser Card */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 50, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="relative"
              animate={{ 
                y: [0, -10, 0],
                rotateY: [0, 2, 0],
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-cyan-500/15 blur-3xl"></div>
              
              <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-xl border dark:border-white/20 border-purple-300/60 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
                  </div>
                  <div>
                    <p className="text-sm dark:text-purple-300 text-purple-700 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      Total Audio Scans
                    </p>
                    <p className="text-xs text-purple-400/60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      Last 30 days
                    </p>
                  </div>
                </div>
                
                <motion.h3 
                  className="text-6xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-white bg-clip-text text-transparent mb-4" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  1,234
                </motion.h3>
                
                <div className="flex items-center gap-2 text-sm mb-6">
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 font-medium">
                    ↑ 23.5%
                  </span>
                  <span className="dark:text-purple-300 text-purple-700/60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    vs last month
                  </span>
                </div>

                {/* Mini chart */}
                <div className="flex items-end gap-1 h-20">
                  {[45, 60, 55, 70, 65, 80, 75, 90, 85, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-500 via-pink-500 to-cyan-400 rounded-t"
                      style={{ height: `${height}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + i * 0.05, type: 'spring' }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* OUR SERVICE SECTION */}
      <section>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="relative bg-gradient-to-br dark:from-[#0f0720]/80 dark:to-[#1a0b2e]/80 from-white/80 to-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <h4 className="text-sm dark:text-purple-300 text-purple-700 font-medium mb-4">Our Service</h4>
            <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e] mb-3">Workflow Automation</h3>
            <p className="text-sm dark:text-purple-300 text-purple-700 mb-6">Automate repetitive audio workflows to save time and reduce errors.</p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold">Get Started</button>
          </div>

          <div className="relative bg-gradient-to-br dark:from-[#0f0720]/80 dark:to-[#1a0b2e]/80 from-white/80 to-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <h4 className="text-sm dark:text-purple-300 text-purple-700 font-medium mb-4">Our Service</h4>
            <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e] mb-3">Scalable AI Solutions</h3>
            <p className="text-sm dark:text-purple-300 text-purple-700 mb-4">Deploy models that scale with your needs.</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 bg-purple-500 rounded" />
              <div className="w-6 h-6 bg-pink-500 rounded" />
              <div className="w-6 h-6 bg-cyan-400 rounded" />
            </div>
          </div>

          <div className="relative bg-gradient-to-br dark:from-[#0f0720]/80 dark:to-[#1a0b2e]/80 from-white/80 to-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <h4 className="text-sm dark:text-purple-300 text-purple-700 font-medium mb-4">Our Service</h4>
            <h3 className="text-xl font-bold dark:text-white text-[#2d1b4e] mb-3">Cost Optimization</h3>
            <p className="text-sm dark:text-purple-300 text-purple-700 mb-6">Cut operational costs by automating manual steps and optimizing inference.</p>
            <button className="px-4 py-2 rounded-lg border dark:border-white/10 border-purple-200/60 text-white dark:bg-white/5 bg-purple-50/80">Get Started</button>
          </div>
        </div>
      </section>

      {/* METRICS ROW - 12-Column Grid - 4 Uniform Cards */}
      <section>
        <div className="grid grid-cols-12 gap-6">
          {/* Total Scans - 3 cols */}
          <motion.div
            className="col-span-12 md:col-span-6 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 h-full hover:border-purple-700/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
                </div>
              </div>
              
              <h3 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                1,234
              </h3>
              <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Total Scans
              </p>
            </div>
          </motion.div>

          {/* Deepfakes Detected - 3 cols */}
          <motion.div
            className="col-span-12 md:col-span-6 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 h-full hover:border-purple-700/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
                </div>
              </div>
              
              <h3 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                87
              </h3>
              <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Deepfakes Detected
              </p>
            </div>
          </motion.div>

          {/* Verified Real - 3 cols */}
          <motion.div
            className="col-span-12 md:col-span-6 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 h-full hover:border-purple-700/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
                </div>
              </div>
              
              <h3 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                1,147
              </h3>
              <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Verified Real
              </p>
            </div>
          </motion.div>

          {/* Active Users - 3 cols */}
          <motion.div
            className="col-span-12 md:col-span-6 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 h-full hover:border-purple-700/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
                </div>
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              <h3 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                47
              </h3>
              <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Active Users Now
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT AREA - 12-Column Grid */}
      <section>
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT COLUMN - 8 cols - System Status & Recent Activities */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    System Status
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <span className="text-sm text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>API Status</span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30">
                        Operational
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>Response Time</span>
                    <div className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      1.2s
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>Server Load</span>
                      <span className="text-sm font-semibold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Recent Activities
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400 px-3 py-1.5 bg-purple-900/30 rounded-lg border border-purple-800/30 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>

                <div className="space-y-2">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      className="relative"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      onHoverStart={() => setHoveredActivity(index)}
                      onHoverEnd={() => setHoveredActivity(null)}
                    >
                      <div className="relative dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 border border-white/5 dark:hover:border-white/20 hover:border-purple-300/60 rounded-xl p-4 transition-all cursor-pointer">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Status Dot */}
                          <div className="col-span-1 flex justify-center">
                            <span className={`w-3 h-3 rounded-full ${
                              activity.status === 'danger' ? 'bg-red-400' : 
                              activity.status === 'success' ? 'bg-green-400' : 'bg-orange-400'
                            }`}></span>
                          </div>

                          {/* File Name */}
                          <div className="col-span-5">
                            <p className="text-sm dark:text-purple-100 text-purple-900 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                              {activity.file}
                            </p>
                            <p className="text-xs text-purple-400/60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                              {activity.duration}
                            </p>
                          </div>

                          {/* Result */}
                          <div className="col-span-2">
                            <span
                              className={`text-sm font-medium ${
                                activity.status === 'danger' ? 'text-red-300' : 
                                activity.status === 'success' ? 'text-green-300' : 'text-orange-300'
                              }`}
                              style={{ fontFamily: 'Open Sans, sans-serif' }}
                            >
                              {activity.result}
                            </span>
                          </div>

                          {/* Action */}
                          <div className="col-span-3">
                            <p className="text-sm dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                              {activity.action}
                            </p>
                          </div>

                          {/* Date */}
                          <div className="col-span-1 text-right">
                            <p className="text-xs dark:text-purple-300 text-purple-700/60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                              {activity.date.split(',')[0]}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Waveform on Hover */}
                      <AnimatePresence>
                        {hoveredActivity === index && (
                          <motion.div
                            className="relative mt-2 dark:bg-white/5 bg-purple-50/80 border dark:border-white/10 border-purple-200/60 rounded-xl p-4 backdrop-blur-sm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-4">
                              <button className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 dark:text-white text-[#2d1b4e] ml-0.5" />
                              </button>
                              
                              {/* Mini Waveform */}
                              <div className="flex-1 flex items-center gap-0.5 h-12">
                                {[...Array(60)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className={`flex-1 rounded-full ${
                                      activity.status === 'danger' ? 'bg-red-400' : 
                                      activity.status === 'success' ? 'bg-green-400' : 'bg-orange-400'
                                    }`}
                                    style={{ height: `${Math.random() * 70 + 30}%` }}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ delay: i * 0.01 }}
                                  />
                                ))}
                              </div>
                              
                              <span className="text-xs dark:text-purple-300 text-purple-700 font-mono" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                                {activity.duration}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR - 4 cols - Emergency Contact & Awareness Tips */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Emergency Contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative dark:bg-[#2d1a1f]/90 bg-red-50/90 backdrop-blur-sm border border-red-900/40 rounded-2xl p-6 hover:border-red-700/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
                  </div>
                  <h2 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Emergency Contact
                  </h2>
                </div>

                <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Report cyber crimes to Pakistan authorities
                </p>

                <div className="space-y-3">
                  <motion.a
                    href="tel:9911"
                    className="block p-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 hover:border-red-700/60 rounded-xl transition-all"
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                          Emergency Hotline
                        </p>
                        <p className="text-sm font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          9911
                        </p>
                      </div>
                    </div>
                  </motion.a>

                  <motion.a
                    href="tel:1991"
                    className="block p-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 hover:border-red-700/60 rounded-xl transition-all"
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                          FIA Cyber Crime
                        </p>
                        <p className="text-sm font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          1991
                        </p>
                      </div>
                    </div>
                  </motion.a>

                  <motion.a
                    href="mailto:complaint@nr3c.gov.pk"
                    className="block p-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 hover:border-red-700/60 rounded-xl transition-all"
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                          Email Report
                        </p>
                        <p className="text-xs font-semibold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          complaint@nr3c.gov.pk
                        </p>
                      </div>
                    </div>
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Awareness Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-purple-700/40 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 dark:text-white text-[#2d1b4e]" />
                  </div>
                  <h2 className="text-lg font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Awareness Tips
                  </h2>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {awarenessTips.map((tip, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 transition-all cursor-pointer border border-transparent hover:border-orange-400/20"
                      style={{ fontFamily: 'Open Sans, sans-serif' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 3 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 mt-2"></div>
                      <span className="text-sm dark:text-purple-200 text-purple-800">{tip}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold transition-all text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
