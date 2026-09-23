import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GuidedWorkflowBar } from './components/layout/GuidedWorkflowBar';
import { PresentationBar } from './components/layout/PresentationBar';
import { ToastContainer } from './components/common/Toast';
import { SettingsModal } from './components/screens/SettingsModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
  const { currentScreen, presentationMode, onboardingOpen, setOnboardingOpen } = useProject();
  const [guideOpen, setGuideOpen] = useState(false);

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

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full max-w-full bg-[#F7F8FA] text-[#172033] overflow-hidden font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden relative">
        {/* Sticky Top Navbar */}
        <Navbar onOpenOnboarding={() => setGuideOpen(true)} />

        {/* Guided Workflow Stepper Bar */}
        <GuidedWorkflowBar />

        {/* Floating Presentation Bar when active */}
        <PresentationBar />

        {/* Scrollable Screen Content */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0 max-w-full transition-all ${
            presentationMode ? 'pt-12' : ''
          }`}
        >
          <ErrorBoundary fallbackTitle="Screen Module Recovered">
            {renderActiveScreen()}
          </ErrorBoundary>
        </main>
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
    <ErrorBoundary fallbackTitle="Compose AI Application Error">
      <ProjectProvider>
        <MainAppContent />
      </ProjectProvider>
    </ErrorBoundary>
  );
}
