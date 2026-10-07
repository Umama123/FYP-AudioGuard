import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-20 blur-xl"></div>
      
      <div className="relative dark:bg-[#1e1435]/90 bg-white/90 backdrop-blur-2xl border border-purple-900/30 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50">
          <Construction className="w-10 h-10 dark:text-white text-[#2d1b4e]" />
        </div>
        <h1 className="text-3xl font-semibold dark:text-white text-[#2d1b4e] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {title}
        </h1>
        <p className="dark:text-purple-200/70 text-purple-800/70" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}
