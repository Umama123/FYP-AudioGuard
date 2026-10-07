import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Menu, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/#about' },
  { label: 'Features', path: '/#features' },
];

const featureLinks = [
  { label: 'Detection', path: '/audio-detection' },
  { label: 'Watermarking', path: '/watermarking' },
  { label: 'Enhancement', path: '/audio-enhancement' },
  { label: 'Awareness', path: '/awareness' },
  { label: 'Support Chatbot', path: '/chatbot' },
  { label: 'History & Analytics', path: '/history' },
  { label: 'Settings', path: '/settings' },
];

export function TopBar() {
  const location = useLocation();
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      setIsDark(false);
    } else {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-purple-200/50 dark:border-white/10 bg-[#f9f5ff]/90 dark:bg-[#0b0712]/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-2 shadow-lg shadow-purple-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900 dark:text-white">AudioGuard</p>
            <p className="text-xs text-purple-700/70 dark:text-purple-300/70">Authenticity platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path.includes('#') && location.pathname === '/');
            if (item.label === 'Features') {
              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setIsFeaturesOpen((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-purple-200 text-purple-900 dark:bg-white/10 dark:text-white' : 'text-purple-800 dark:text-purple-200/80 hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-white/10 dark:hover:text-white'}`}
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition ${isFeaturesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFeaturesOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-purple-200 dark:border-white/10 bg-white/95 dark:bg-[#140b25]/95 p-2 shadow-2xl shadow-purple-200/50 dark:shadow-purple-950/40">
                      {featureLinks.map((link) => {
                        const isLinkActive = location.pathname === link.path;
                        return (
                          <Link
                            key={link.label}
                            to={link.path}
                            onClick={() => setIsFeaturesOpen(false)}
                            className={`block rounded-xl px-3 py-2 text-sm transition ${isLinkActive ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-900 dark:text-white' : 'text-purple-800 dark:dark:text-purple-100 text-purple-900/80 hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-white/10 dark:hover:text-white'}`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-purple-200 text-purple-900 dark:bg-white/10 dark:text-white' : 'text-purple-800 dark:text-purple-200/80 hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-white/10 dark:hover:text-white'}`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <div className="h-6 w-px bg-purple-300 dark:bg-white/20 mx-2"></div>
          
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-900 dark:text-white border border-purple-300 dark:border-white/10 hover:bg-purple-200 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2.5 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-white/10 transition border border-purple-300 dark:border-white/10 bg-purple-50 dark:bg-white/5"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="rounded-full border border-purple-200 dark:border-white/10 bg-purple-50 dark:bg-white/5 p-2.5 text-purple-900 dark:dark:text-purple-100 text-purple-900">
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
