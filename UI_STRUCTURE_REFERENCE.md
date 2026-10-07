# AudioGuard UI Structure Reference

This document captures the current frontend UI structure of AudioGuard so it can be recreated elsewhere with the same layout, navigation, visual language, and page composition.

## 1. Project Overview

- App type: React + TypeScript + Vite
- Routing: React Router
- Styling: Tailwind CSS + custom utility classes
- Motion: Framer Motion via motion/react
- UI primitives: custom components under src/app/components/ui
- Main shell: website-style top navigation, scrollable content area, floating chatbot widget, and a landing-page hero with About/Features sections

## 2. Core Application Structure

### Entry points
- [AudioGuard_flask 4_new/frontend/src/main.tsx](AudioGuard_flask%204_new/frontend/src/main.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/App.tsx](AudioGuard_flask%204_new/frontend/src/app/App.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/routes.tsx](AudioGuard_flask%204_new/frontend/src/app/routes.tsx)

### Main component tree
```text
App
└── RouterProvider
    └── DashboardLayout
        ├── GradientBackground
        ├── TopBar
        ├── Main content area (Outlet)
        └── ChatbotWidget
```

## 3. Global Layout System

### 3.1 DashboardLayout
Source: [AudioGuard_flask 4_new/frontend/src/app/components/DashboardLayout.tsx](AudioGuard_flask%204_new/frontend/src/app/components/DashboardLayout.tsx)

Layout behavior:
- Full-screen dark background with animated gradient orbs
- Website-style top navigation bar with Home/About/Features links
- Features dropdown groups the application pages under one entry
- Main content area uses centered content and top padding
- Floating chatbot widget anchored bottom-right

Visual structure:
```text
<div className="min-h-screen relative overflow-x-hidden bg-slate-950 text-white">
  <div className="absolute inset-0 z-0 pointer-events-none">
    <GradientBackground />
  </div>
  <div className="relative z-20">
    <TopBar />
  </div>
  <main className="pt-24 pb-24 px-6 md:px-8 min-h-screen relative z-10">
    <div className="mx-auto max-w-7xl">
      <Outlet />
    </div>
  </main>
  <div className="relative z-30">
    <ChatbotWidget />
  </div>
</div>
```

### 3.2 TopBar and Features Navigation
Source: [AudioGuard_flask 4_new/frontend/src/app/components/TopBar.tsx](AudioGuard_flask%204_new/frontend/src/app/components/TopBar.tsx)

Contents:
- Brand/logo at the left
- Home, About, and Features links in the main nav
- Features dropdown containing Detection, Watermarking, Regeneration, Awareness, Support Chatbot, History & Analytics, and Settings

Visual style:
- Glassmorphism bar with a purple-pink gradient accent
- Rounded pill buttons with hover and active states
- Dropdown menu with a dark translucent card and subtle shadow

### 3.3 TopBar
Source: [AudioGuard_flask 4_new/frontend/src/app/components/TopBar.tsx](AudioGuard_flask%204_new/frontend/src/app/components/TopBar.tsx)

Contents:
- Centered search bar
- Notification bell with red dot
- User avatar button

Visual style:
- Glassmorphism header bar
- Purple gradient border/background
- Search input with purple glow on focus

### 3.4 GradientBackground
Source: [AudioGuard_flask 4_new/frontend/src/app/components/GradientBackground.tsx](AudioGuard_flask%204_new/frontend/src/app/components/GradientBackground.tsx)

Visual elements:
- Dark base gradient from deep violet to magenta
- Three animated blurred orbs in purple, pink, cyan
- Subtle noise texture overlay

## 4. Route Structure

Source: [AudioGuard_flask 4_new/frontend/src/app/routes.tsx](AudioGuard_flask%204_new/frontend/src/app/routes.tsx)

```text
/                    -> LandingPage
/audio-detection     -> AudioDetection
/audio-regeneration  -> AudioRegeneration
/watermarking        -> AudioWatermarking
/awareness           -> AwareSincere
/chatbot             -> ChatbotPage
/history             -> HistoryAnalytics
/settings            -> Settings
/*                   -> PlaceholderPage
```

## 5. Page-by-Page UI Blueprint

### 5.1 Main Dashboard
Source: [AudioGuard_flask 4_new/frontend/src/app/components/MainDashboard.tsx](AudioGuard_flask%204_new/frontend/src/app/components/MainDashboard.tsx)

Page composition:
1. Hero section
   - Large headline: “Protect Your Voice. Trust Every Audio.”
   - Supporting subtitle
   - Primary CTA button
   - Trust metrics row
   - Right-side animated 3D-style stats card

Current implementation notes:
- The dashboard hero copy now matches the AudioGuard security narrative and uses the same glass-card styling as the reference.

2. Metric cards row
   - Total Scans
   - Deepfakes Detected
   - Verified Real
   - Active Users Now

3. Main content grid
   - Left column: System Status card
   - Left column: Recent Activities list
   - Right column: Awareness Tips / security guidance card

Visual pattern:
- Large hero area with purple-pink-cyan gradients
- Card backgrounds are dark translucent glass panels
- Typography uses Montserrat for headings and Open Sans for body content
- Motion effects: fade/slide-in, floating card, animated progress bars, hover states

### 5.2 Audio Detection Page
Source: [AudioGuard_flask 4_new/frontend/src/app/components/AudioDetection.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AudioDetection.tsx)

Page composition:
1. Upload section
   - Three tabs: Single File, Batch Upload, From Video
   - Drag-and-drop upload area
   - File cards showing name, size, status, result badge

2. AI Preprocessing section
   - Neural Noise Reduction slider
   - AI Quality Enhancement slider
   - Large analysis CTA button

3. Feature extraction visualization
   - Waveform analysis panel
   - MFCC coefficient panel
   - Spectral analysis metrics
   - Explainability report viewer

4. Legal / evidence/reporting UI
   - Agency dialog
   - Evidence review panel
   - Legal status text area

5. Watermarking integration panel
   - Embed watermark flow
   - Secret ID input
   - Download watermarked audio action

Key interaction patterns:
- Upload triggers client-side or backend detection
- Results render as status badges and explainability panels
- Tabs switch between single/batch/video flows
- Floating glass cards maintain strong visual consistency throughout

### 5.3 Audio Watermarking Page
Source: [AudioGuard_flask 4_new/frontend/src/app/components/AudioWatermarking.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AudioWatermarking.tsx)

Page composition:
1. Two-tab experience: Embed and Detect
2. Upload panel for audio file selection
3. Input controls for secret ID and sample rate
4. Preview/audio player component with animated waveform bars
5. Result card showing detection status, confidence, correlation, explanation, and download actions

Visual style:
- Dark glass container with purple-to-pink gradient header
- Audio player widget with animated waveform bars and progress control
- Status panels on success/error states

### 5.4 Aware & Sincere Page
Source: [AudioGuard_flask 4_new/frontend/src/app/components/AwareSincere.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AwareSincere.tsx)

Page composition:
1. Hero section with report refresh actions
2. Status/error/loading panels
3. Stat cards for articles reviewed, sources referenced, DB entries, themes clustered
4. Executive overview panel with story links
5. Key insights panel with scrollable insight cards

Tone:
- More dashboard/reporting-focused than the detection workflow
- Uses polished panels and external-link driven cards

### 5.5 Settings Page
Source: [AudioGuard_flask 4_new/frontend/src/app/components/Settings.tsx](AudioGuard_flask%204_new/frontend/src/app/components/Settings.tsx)

Page composition:
1. Page title and subtitle
2. Profile Settings card
3. Security Settings card
4. Audio Processing Preferences card
5. Notification Settings card
6. Data & Privacy card
7. System Preferences card
8. API & Integrations card

Elements used:
- Form fields, selects, toggles, action buttons
- Glass card layout with accent gradients per section
- Danger zone style treatment for destructive actions

### 5.6 Chatbot Widget
Source: [AudioGuard_flask 4_new/frontend/src/app/components/ChatbotWidget.tsx](AudioGuard_flask%204_new/frontend/src/app/components/ChatbotWidget.tsx)

Behavior:
- Floating circular button in bottom-right corner
- Expands into a chat panel on click
- Contains header, message body, and input footer

Visual style:
- Deep purple/pink gradient button
- Dark translucent chat panel
- Rounded corners and blur effect

## 6. Shared Design Language

### 6.1 Color palette
Primary palette:
- Deep background: slate-950 / #0a0015 / #1a0b2e
- Accent purple: #A39FEF / purple-500
- Accent pink: #EC4899 / pink-500
- Accent cyan: #00D9FF / cyan-400
- Text: white and purple-tinted light gray

### 6.2 Typography
- Headings: Montserrat, sans-serif
- Body/UI labels: Open Sans, sans-serif
- Monospace fields: monospace for API tokens or technical values

### 6.3 Component styling patterns
Common patterns:
- Rounded corners: rounded-2xl or rounded-3xl
- Glassmorphism: bg-white/5 or bg-[#1e1435]/90 with backdrop blur
- Borders: border-white/10 or border-purple-900/30
- Hover states: subtle brightening and gradient shift
- Motion: fade, slide, hover elevate, animated loops

### 6.4 Reusable UI primitives
Source directory: [AudioGuard_flask 4_new/frontend/src/app/components/ui](AudioGuard_flask%204_new/frontend/src/app/components/ui)

Common primitives used by the app:
- Button
- Card
- Input
- Tabs
- Slider
- Progress
- Dialog
- Dropdown Menu
- Tooltip
- Badge
- Separator
- Scroll Area

## 7. Rebuild Blueprint for Another Project

### Recommended structure
```text
src/
  app/
    App.tsx
    routes.tsx
    components/
      DashboardLayout.tsx
      Sidebar.tsx
      TopBar.tsx
      MainDashboard.tsx
      AudioDetection.tsx
      AudioWatermarking.tsx
      AwareSincere.tsx
      Settings.tsx
      ChatbotWidget.tsx
      GradientBackground.tsx
      PlaceholderPage.tsx
      ui/
```

### Implementation order
1. Create the app shell with dark gradient background and fixed sidebar/top bar.
2. Add the route configuration and page placeholders.
3. Build the Dashboard page first, including hero, metrics, and card layouts.
4. Add the detection workflow with tabs, drag-and-drop upload, and results cards.
5. Add watermarking and intelligence pages.
6. Add settings and floating chatbot widget.
7. Apply the color system, typography, and motion patterns consistently.

### Key UI details to preserve
- Fixed left navigation with glassmorphism and active-state gradients
- Large centered hero section on the dashboard
- Dark translucent cards with blurred edges and purple-pink-cyan glow accents
- Animated background orbs and subtle noise overlay
- Soft motion transitions on buttons, cards, and panels
- Floating chatbot button with pop-up conversation panel

## 8. Notes for Exact Reproduction

To recreate the UI as closely as possible:
- Keep the dark-purple visual theme and gradient accents
- Use a dense but airy spacing system with wide card padding
- Prefer glass cards with border + blur rather than flat solid panels
- Use animated orbs in the background and subtle moving highlights
- Maintain the same top-level layout: sidebar + topbar + content area + floating widget
- Use Montserrat for major headings and Open Sans for supporting text

## 9. Source Files to Reference Directly

- [AudioGuard_flask 4_new/frontend/src/app/components/DashboardLayout.tsx](AudioGuard_flask%204_new/frontend/src/app/components/DashboardLayout.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/Sidebar.tsx](AudioGuard_flask%204_new/frontend/src/app/components/Sidebar.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/TopBar.tsx](AudioGuard_flask%204_new/frontend/src/app/components/TopBar.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/MainDashboard.tsx](AudioGuard_flask%204_new/frontend/src/app/components/MainDashboard.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/AudioDetection.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AudioDetection.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/AudioWatermarking.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AudioWatermarking.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/AwareSincere.tsx](AudioGuard_flask%204_new/frontend/src/app/components/AwareSincere.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/Settings.tsx](AudioGuard_flask%204_new/frontend/src/app/components/Settings.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/ChatbotWidget.tsx](AudioGuard_flask%204_new/frontend/src/app/components/ChatbotWidget.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/components/GradientBackground.tsx](AudioGuard_flask%204_new/frontend/src/app/components/GradientBackground.tsx)
- [AudioGuard_flask 4_new/frontend/src/app/routes.tsx](AudioGuard_flask%204_new/frontend/src/app/routes.tsx)
