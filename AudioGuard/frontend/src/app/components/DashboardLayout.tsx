import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { ChatbotWidget } from './ChatbotWidget';
import { GradientBackground } from './GradientBackground';

export function DashboardLayout() {
  return (
    <div className="min-h-screen relative overflow-x-hidden dark:bg-slate-950 bg-[#f9f5ff] dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GradientBackground />
      </div>

      <div className="relative z-20">
        <TopBar />
      </div>

      <main className="min-h-screen pt-24 pb-24 px-4 sm:px-6 md:px-8 relative z-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      <div className="relative z-30">
        <ChatbotWidget />
      </div>
    </div>
  );
}