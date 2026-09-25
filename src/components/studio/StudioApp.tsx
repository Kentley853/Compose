import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { ScreenId } from '../../types/architecture';
import { Navbar } from '../layout/Navbar';
import { Sidebar } from '../layout/Sidebar';
import { GuidedWorkflowBar } from '../layout/GuidedWorkflowBar';
import { PresentationBar } from '../layout/PresentationBar';
import { ToastContainer } from '../common/Toast';
import { SettingsModal } from '../screens/SettingsModal';
import { OnboardingModal } from '../common/OnboardingModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProjectSetupScreen } from '../screens/ProjectSetupScreen';
import { PlotIntelligenceScreen } from '../screens/PlotIntelligenceScreen';
import { AIArchitectScreen } from '../screens/AIArchitectScreen';
import { FloorPlanScreen } from '../screens/FloorPlanScreen';
import { Coordinated2DPlanScreen } from '../screens/Coordinated2DPlanScreen';
import { Coordinated3DModelScreen } from '../screens/Coordinated3DModelScreen';
import { ExteriorConceptScreen } from '../screens/ExteriorConceptScreen';
import { ComplianceScreen } from '../screens/ComplianceScreen';
import { BOQScreen } from '../screens/BOQScreen';
import { DeliverablesScreen } from '../screens/DeliverablesScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProjectsListScreen } from '../screens/ProjectsListScreen';

const STUDIO_SCREENS: ScreenId[] = [
  'dashboard',
  'setup',
  'plot',
  'architect',
  'floorplan',
  'coordinated2d',
  'coordinated3d',
  'exterior',
  'compliance',
  'boq',
  'deliverables',
  'files',
  'activity',
  'projects',
];

function isStudioScreen(value: string | undefined): value is ScreenId {
  return !!value && STUDIO_SCREENS.includes(value as ScreenId);
}

const StudioFrame: React.FC = () => {
  const { screenId } = useParams();
  const {
    currentScreen,
    syncScreenFromRoute,
    presentationMode,
    onboardingOpen,
    setOnboardingOpen,
    projectReady,
    createNewProject,
  } = useProject();
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  useEffect(() => {
    if (isStudioScreen(screenId)) syncScreenFromRoute(screenId);
  }, [screenId, syncScreenFromRoute]);

  if (!isStudioScreen(screenId)) {
    return (
      <div className="grid min-h-[100dvh] place-items-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center">
          <h1 className="text-xl font-semibold">That workspace page does not exist.</h1>
          <Link to="/dashboard" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#6546F5]">Back to home</Link>
        </div>
      </div>
    );
  }

  if (!projectReady) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#F6F7FB] p-6">
        <div className="max-w-lg rounded-[24px] border border-[#E7E9F2] bg-white p-6">
          <h1 className="text-2xl font-semibold">Create a project before opening this tool</h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Floor plans, models, costs, and files belong to a saved project. Compose will not open a sample building as if it were yours.
          </p>
          {createError && <p className="mt-3 text-sm text-[#B42318]">{createError}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="min-h-11 rounded-xl bg-[#6546F5] px-4 text-sm font-semibold text-white"
              onClick={async () => {
                setCreateError(null);
                try {
                  await createNewProject('Untitled architectural project');
                } catch (error) {
                  setCreateError(error instanceof Error ? error.message : 'Could not create the project.');
                }
              }}
            >
              Create a blank project
            </button>
            <Link to="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-[#E4E7EC] px-4 text-sm font-semibold">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'projects':
        return <ProjectsListScreen />;
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
    <div className="flex min-h-[100dvh] h-[100dvh] w-full bg-[#F7F8FA] text-[#172033] overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onOpenOnboarding={() => setGuideOpen(true)} />
        <GuidedWorkflowBar />
        <PresentationBar />
        <main className={`flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${presentationMode ? 'pt-12' : ''}`}>
          <ErrorBoundary fallbackTitle="Screen Module Recovered">{renderActiveScreen()}</ErrorBoundary>
        </main>
      </div>
      <ToastContainer />
      <SettingsModal />
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

export const StudioApp: React.FC = () => <StudioFrame />;
