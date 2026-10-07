import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { MainDashboard } from './components/MainDashboard';
import { LandingPage } from './components/LandingPage';
import { AudioDetection } from './components/AudioDetection';
import { AudioEnhancement } from './components/AudioEnhancement';
import { AwareSincere } from './components/AwareSincere';
import { Settings } from './components/Settings';
import { PlaceholderPage } from './components/PlaceholderPage';
import AudioWatermarking from './components/AudioWatermarking';
import { HistoryAnalytics } from './components/HistoryAnalytics';
import { ChatbotPage } from './components/ChatbotPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: 'audio-detection',
        Component: AudioDetection,
      },
      {
        path: 'audio-enhancement',
        Component: AudioEnhancement,
      },
      {
        path: 'watermarking',
        Component: AudioWatermarking,
      },
      {
        path: 'awareness',
        Component: AwareSincere,
      },
      {
        path: 'chatbot',
        Component: ChatbotPage,
      },
      {
        path: 'history',
        Component: HistoryAnalytics,
      },
      {
        path: 'settings',
        Component: Settings,
      },
      {
        path: '*',
        element: (
          <PlaceholderPage
            title="Page Not Found"
            description="The page you're looking for doesn't exist."
          />
        ),
      },
    ],
  },
]);
