import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import {
  ArrowRight,
  Compass,
  FileCode2,
  Box,
  Layers,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Calculator,
  FolderKanban,
} from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const { setScreen, selectProject, companyProjects } = useProject();

  const handleLaunchDemo = () => {
    if (companyProjects.length > 0) {
      selectProject(companyProjects[0].id);
    }
    setScreen('dashboard');
  };

  const handleViewSample = (projectId: string) => {
    selectProject(projectId);
    setScreen('dashboard');
  };

  return (
    <div className="min-h-app bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Top Bar */}
      <header className="h-16 shrink-0 border-b border-slate-800/80 gutter pt-safe flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-t border-l border-blue-400 rotate-45 transform -translate-x-0.5 -translate-y-0.5" />
            <div className="w-3.5 h-3.5 border-b border-r border-slate-400 rotate-45 transform translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-sm">COMPOSE</span>{' '}
            <span className="text-blue-400 font-mono text-xs">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs shrink-0">
          <span className="text-slate-400 hidden sm:inline">Architectural Concept Studio</span>
          <button
            id="btn-landing-top-enter"
            onClick={handleLaunchDemo}
            className="tap px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors font-medium whitespace-nowrap"
          >
            Open Studio
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center gutter py-8 sm:py-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Architectural Concept Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
              From Plot to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200">
                Architectural Concept
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-normal">
              Compose AI connects site intelligence, architectural reasoning, conceptual planning and coordinated 2D and 3D visualization in one continuous workflow.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                id="btn-launch-demo-project"
                onClick={handleLaunchDemo}
                className="w-full xs:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-view-sample-project"
                onClick={() => setScreen('projects')}
                className="w-full xs:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-medium transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-blue-400" />
                <span>All Company Projects</span>
              </button>
            </div>

            <div className="pt-2">
              <DisclaimerBanner compact />
            </div>
          </div>

          {/* Right Column: Architectural Pipeline Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="text-xs font-semibold text-slate-200">Continuous 10-Step Workflow</div>
                <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Supabase Powered
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { step: '01', title: 'Plot Intelligence', desc: 'Solar, setback & orientation calculations' },
                  { step: '02', title: 'AI Architect Dialogue', desc: 'Structured brief generation & room zoning' },
                  { step: '03', title: 'Conceptual Floor Plan', desc: 'Architectural alternatives with interactive schedule' },
                  { step: '04', title: 'Coordinated 2D & 3D', desc: 'CAD layers and WebGL volumetric massing' },
                  { step: '05', title: 'Compliance & BOQ', desc: 'Preliminary checks and deterministic cost takeoff' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
                  >
                    <span className="font-mono text-[11px] text-blue-400 font-semibold mt-0.5 shrink-0">{item.step}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company Projects List */}
              {companyProjects.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Company Projects:</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {companyProjects.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleViewSample(p.id)}
                        className="text-left px-2.5 py-1.5 rounded bg-slate-900/60 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center justify-between group border border-slate-800/60 transition-colors"
                      >
                        <span className="truncate group-hover:text-blue-300 transition-colors">{p.project_name}</span>
                        <ChevronRight className="w-3 h-3 shrink-0 text-slate-500 group-hover:text-blue-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-800/80 gutter py-4 pb-[calc(1rem+var(--safe-bottom))] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Compose AI © 2026</span>
          <span>•</span>
          <span>Atelier Architecture Concept System</span>
        </div>
      </footer>
    </div>
  );
};
