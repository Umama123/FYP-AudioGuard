import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AudioWaveform,
  Fingerprint,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  History,
  Settings,
} from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../../assets/010e535a3ede7b6e0fd53f1aacebe6121333f744.png';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'detection', label: 'Audio Detection', icon: AudioWaveform, path: '/audio-detection' },
  { id: 'watermarking', label: 'Audio Watermarking', icon: Fingerprint, path: '/watermarking' },
  { id: 'enhancement', label: 'Audio Enhancement', icon: RefreshCw, path: '/audio-enhancement' },
  { id: 'awareness', label: 'Aware & Sincere', icon: AlertTriangle, path: '/awareness' },
  { id: 'chatbot', label: 'Support Chatbot', icon: MessageSquare, path: '/chatbot' },
  { id: 'history', label: 'History & Analytics', icon: History, path: '/history' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 z-40 flex flex-col border-r dark:border-white/10 border-purple-200/60 bg-[#090611]/95 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(192,132,252,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_40%)] pointer-events-none" />

      <div className="relative flex items-center gap-3 px-6 py-6 border-b dark:border-white/10 border-purple-200/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <img src={logoImage} alt="AudioGuard" className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-purple-500/20" />
          <div>
            <p className="text-sm font-semibold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>AudioGuard</p>
            <p className="text-xs dark:text-purple-300 text-purple-700/70">Defense console</p>
          </div>
        </motion.div>
      </div>

      <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.id} to={item.path} className="block">
              <motion.div
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isActive ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-lg shadow-purple-500/10 border border-purple-500/20' : 'text-white/70 dark:hover:bg-white/5 bg-purple-50/80 dark:hover:text-white text-[#2d1b4e]'}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full ${isActive ? 'bg-gradient-to-b from-purple-400 to-pink-500' : 'bg-transparent group-hover:bg-purple-400/60'}`} />
                <Icon className={`w-4 h-4 ${isActive ? 'dark:text-purple-200 text-purple-800' : 'dark:text-white text-[#2d1b4e]/60 group-dark:hover:text-white text-[#2d1b4e]'}`} />
                <span className="text-sm font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="relative px-4 pb-6">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-4">
          <p className="text-sm font-semibold dark:text-white text-[#2d1b4e]">Threat intelligence</p>
          <p className="mt-1 text-xs dark:text-purple-200/80 text-purple-800/80">Realtime audio protection and forensic review.</p>
        </div>
      </div>
    </aside>
  );
}