import React, { useCallback, useEffect, useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { GuidedWorkflowBar } from './components/layout/GuidedWorkflowBar';
import { PresentationBar } from './components/layout/PresentationBar';
import { ToastContainer } from './components/common/Toast';
import { SettingsModal } from './components/screens/SettingsModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { useIsMobileShell } from './hooks/useMediaQuery';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';

// Screens
import { LandingScreen } from './components/screens/LandingScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ProjectSetupScreen } from './components/screens/ProjectSetupScreen';
import { PlotIntelligenceScreen } from './components/screens/PlotIntelligenceScreen';
import { AIArchitectScreen } from './components/screens/AIArchitectScreen';
import { FloorPlanScreen } from './components/screens/FloorPlanScreen';
import { Coordinated2DPlanScreen } from './components/screens/Coordinated2DPlanScreen';
import { Coordinated3DModelScreen } from './components/screens/Coordinated3DModelScreen';
import { ExteriorConceptScreen } from './components/screens/ExteriorConceptScreen';
import { ComplianceScreen } from './components/screens/ComplianceScreen';
import { BOQScreen } from './components/screens/BOQScreen';
import { DeliverablesScreen } from './components/screens/DeliverablesScreen';
import { FilesScreen } from './components/screens/FilesScreen';
import { ActivityScreen } from './components/screens/ActivityScreen';

const MainAppContent: React.FC = () => {
  const { currentScreen, onboardingOpen, setOnboardingOpen } = useProject();
  const [guideOpen, setGuideOpen] = useState(false);

  // Below `lg` the sidebar becomes an off-canvas drawer instead of a column.
  const isMobileShell = useIsMobileShell();
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Navigating on a phone should dismiss the drawer it was triggered from.
  useEffect(() => {
    setNavOpen(false);
  }, [currentScreen]);

  // Returning to a wide viewport must never leave a stale drawer behind.
  useEffect(() => {
    if (!isMobileShell) setNavOpen(false);
  }, [isMobileShell]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  useBodyScrollLock(navOpen && isMobileShell);

  if (currentScreen === 'landing') {
    return <LandingScreen />;
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'setup':
        return <ProjectSetupScreen />;
      case 'plot':
        return <PlotIntelligenceScreen />;
      case 'architect':
        return <AIArchitectScreen />;
      case 'floorplan':
        return <FloorPlanScreen />;
      case 'coordinated2d':
        return <Coordinated2DPlanScreen />;
      case 'coordinated3d':
        return <Coordinated3DModelScreen />;
      case 'exterior':
        return <ExteriorConceptScreen />;
      case 'compliance':
        return <ComplianceScreen />;
      case 'boq':
        return <BOQScreen />;
      case 'deliverables':
        return <DeliverablesScreen />;
      case 'files':
        return <FilesScreen />;
      case 'activity':
        return <ActivityScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const openGuide = () => setGuideOpen(true);

  return (
    <div className="flex h-app w-full bg-[#F7F8FA] text-[#172033] overflow-hidden font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* Scrim behind the mobile drawer */}
      {isMobileShell && navOpen && (
        <div
          onClick={closeNav}
          className="fixed inset-0 z-40 bg-[#0F172A]/45 backdrop-blur-[2px] lg:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: static column on desktop, off-canvas drawer below `lg` */}
      <Sidebar
        isDrawer={isMobileShell}
        open={navOpen}
        onClose={closeNav}
        onOpenOnboarding={openGuide}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Top Navbar */}
        <Navbar
          onOpenOnboarding={openGuide}
          onOpenNav={() => setNavOpen(true)}
          showNavToggle={isMobileShell}
          navOpen={navOpen}
        />

        {/* Guided Workflow Stepper Bar */}
        <GuidedWorkflowBar onOpenHelp={openGuide} />

        {/* Floating Presentation Bar when active */}
        <PresentationBar />

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col">
          {renderActiveScreen()}
        </main>

        {/* Bottom quick-nav on phones — keeps the core workflow one tap away */}
        <MobileTabBar />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Onboarding / Quick Guide Modal */}
      <OnboardingModal
        isOpen={guideOpen || onboardingOpen}
        onClose={() => {
          setGuideOpen(false);
          setOnboardingOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainAppContent />
    </ProjectProvider>
  );
}
