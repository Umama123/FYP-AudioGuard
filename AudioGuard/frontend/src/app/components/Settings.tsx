import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Shield, 
  Lock, 
  Bell, 
  Database, 
  Settings as SettingsIcon, 
  Key,
  Radio,
  Activity,
  Mail,
  Building,
  Upload,
  Eye,
  History,
  LogOut,
  Download,
  Trash2,
  Globe,
  Zap,
  Link as LinkIcon
} from 'lucide-react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-600'
      }`}
    >
      <motion.span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
        animate={{ x: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function Settings() {
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [autoNormalize, setAutoNormalize] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [detectionAlerts, setDetectionAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [allowStorage, setAllowStorage] = useState(false);
  
  const [detectionMode, setDetectionMode] = useState('balanced');
  const [enhancementQuality, setEnhancementQuality] = useState('enhanced');
  const [autoDeleteDays, setAutoDeleteDays] = useState('30');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('english');
  const [layoutDensity, setLayoutDensity] = useState('comfortable');

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold dark:text-white text-[#2d1b4e] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Settings
        </h1>
        <p className="dark:text-purple-200 text-purple-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          Manage your account preferences and security settings
        </p>
      </motion.div>

      {/* 1. Profile Settings Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <User className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Profile Settings
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Manage your account information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Profile Avatar */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-purple-500/50 mb-4">
                JD
              </div>
              <button className="flex items-center gap-2 dark:text-purple-300 text-purple-700 dark:hover:text-purple-200 text-purple-800 transition-colors text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <Upload className="w-4 h-4" />
                Upload Picture
              </button>
            </div>

            {/* Editable Fields */}
            <div className="lg:col-span-9 space-y-4">
              <div>
                <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                />
              </div>

              <div>
                <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="email"
                    defaultValue="john.doe@company.com"
                    className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Organization / Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type="text"
                      defaultValue="AudioGuard Inc."
                      className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      style={{ fontFamily: 'Open Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Role
                  </label>
                  <select
                    defaultValue="admin"
                    className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  className="px-6 py-3 rounded-xl border border-purple-500/50 dark:text-purple-200 text-purple-800 font-semibold hover:bg-purple-500/10 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Edit Profile
                </motion.button>
                <motion.button
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Security Settings Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/50">
              <Shield className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Security Settings
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Protect your account with enhanced security features
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <motion.button
                className="w-full flex items-center justify-between group"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Change Password
                  </span>
                </div>
                <span className="text-purple-400 group-dark:hover:text-purple-300 text-purple-700">→</span>
              </motion.button>
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <p className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Two-Factor Authentication
                  </p>
                  <p className="dark:text-purple-300 text-purple-700 text-sm">Add an extra layer of security</p>
                </div>
              </div>
              <ToggleSwitch enabled={twoFactorAuth} onChange={setTwoFactorAuth} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Login Alerts
                  </p>
                  <p className="dark:text-purple-300 text-purple-700 text-sm">Get notified of new sign-ins</p>
                </div>
              </div>
              <ToggleSwitch enabled={loginAlerts} onChange={setLoginAlerts} />
            </div>

            <div className="dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <motion.button
                className="w-full flex items-center justify-between group"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-purple-400" />
                  <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Login Activity History
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400 group-dark:hover:text-purple-300 text-purple-700" />
                  <span className="text-purple-400 group-dark:hover:text-purple-300 text-purple-700 text-sm">View History</span>
                </div>
              </motion.button>
            </div>

            <div className="dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <motion.button
                className="w-full flex items-center justify-between group"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-orange-400" />
                  <div className="text-left">
                    <p className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      Active Sessions
                    </p>
                    <p className="dark:text-purple-300 text-purple-700 text-sm">3 devices currently active</p>
                  </div>
                </div>
                <span className="text-orange-400 group-hover:text-orange-300 text-sm font-semibold">
                  Logout from others
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Audio Processing Preferences Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Radio className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Audio Processing Preferences
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Configure how the system processes audio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <Zap className="w-4 h-4 text-cyan-400" />
                Default Detection Mode
              </label>
              <select
                value={detectionMode}
                onChange={(e) => setDetectionMode(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="fast">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="high-accuracy">High Accuracy</option>
              </select>
            </div>

            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <Activity className="w-4 h-4 text-cyan-400" />
                Enhancement Quality
              </label>
              <select
                value={enhancementQuality}
                onChange={(e) => setEnhancementQuality(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="standard">Standard</option>
                <option value="enhanced">Enhanced</option>
                <option value="studio">Studio Quality</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Noise Reduction
                </span>
              </div>
              <ToggleSwitch enabled={noiseReduction} onChange={setNoiseReduction} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Auto Normalize Volume
                </span>
              </div>
              <ToggleSwitch enabled={autoNormalize} onChange={setAutoNormalize} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Notification Settings Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50">
              <Bell className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Notification Settings
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Choose what notifications you want to receive
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Email Notifications
                </span>
              </div>
              <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Detection Result Alerts
                </span>
              </div>
              <ToggleSwitch enabled={detectionAlerts} onChange={setDetectionAlerts} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-blue-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  System Updates
                </span>
              </div>
              <ToggleSwitch enabled={systemUpdates} onChange={setSystemUpdates} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-orange-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Security Alerts
                </span>
              </div>
              <ToggleSwitch enabled={securityAlerts} onChange={setSecurityAlerts} />
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Weekly Analytics Report
                </span>
              </div>
              <ToggleSwitch enabled={weeklyReport} onChange={setWeeklyReport} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5. Data & Privacy Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
              <Database className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Data & Privacy
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Control your data and privacy settings
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Auto Delete Audio Files after:
              </label>
              <select
                value={autoDeleteDays}
                onChange={(e) => setAutoDeleteDays(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="flex items-center justify-between dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-400" />
                <div>
                  <p className="dark:text-white text-[#2d1b4e] font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Allow Audio Storage for Model Improvement
                  </p>
                  <p className="dark:text-purple-300 text-purple-700 text-sm">Help us improve detection accuracy</p>
                </div>
              </div>
              <ToggleSwitch enabled={allowStorage} onChange={setAllowStorage} />
            </div>

            <div className="flex gap-4">
              <motion.button
                className="flex-1 px-6 py-3 rounded-xl border border-green-500/50 text-green-300 font-semibold hover:bg-green-500/10 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                Export My Data
              </motion.button>
            </div>

            {/* Warning Box for Delete Account */}
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Danger Zone
                  </p>
                  <p className="text-red-300/70 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    This action is irreversible. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
              <motion.button
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-5 h-5" />
                Delete Account
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. System Preferences Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <SettingsIcon className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                System Preferences
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Customize your dashboard experience
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <Globe className="w-4 h-4 text-purple-400" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Dashboard Layout Density
              </label>
              <select
                value={layoutDensity}
                onChange={(e) => setLayoutDensity(e.target.value)}
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 7. API Integration Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 opacity-20 blur-xl"></div>
        
        <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
              <Key className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                API & Integrations
              </h2>
              <p className="dark:text-purple-300 text-purple-700 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Connect external services and manage API access
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                API Key
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value="sk_live_••••••••••••••••••••"
                  readOnly
                  className="flex-1 dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white focus:outline-none"
                  style={{ fontFamily: 'Open Sans, monospace' }}
                />
                <motion.button
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 dark:text-white text-[#2d1b4e] font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Generate New
                </motion.button>
              </div>
            </div>

            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-2 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <LinkIcon className="w-4 h-4 text-orange-400" />
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://your-domain.com/webhook"
                className="w-full dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-orange-500/50 transition-colors"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              />
            </div>

            <div>
              <label className="block dark:text-purple-200 text-purple-800 mb-3 text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                External Integrations
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Slack', 'Discord', 'Zapier', 'Webhook'].map((integration) => (
                  <motion.div
                    key={integration}
                    className="dark:bg-white/5 bg-purple-50/80 rounded-xl p-4 border border-purple-900/20 flex flex-col items-center justify-center gap-2 cursor-pointer dark:hover:bg-white/10 hover:bg-purple-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LinkIcon className="w-6 h-6 text-orange-400" />
                    <span className="dark:text-white text-[#2d1b4e] text-sm font-semibold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      {integration}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
