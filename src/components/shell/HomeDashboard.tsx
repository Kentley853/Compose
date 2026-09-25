import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Building2,
  Compass,
  FileSpreadsheet,
  FolderOpen,
  Grid3X3,
  Loader2,
  PenTool,
  ShieldCheck,
  Sparkles,
  Trees,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const CHIPS = ['House', 'Villa', '3 Bedroom', 'Modern', 'Minimal', 'With Garden'];

const CARDS = [
  { title: 'AI Architect', text: 'Turn a prompt into a reviewable project brief.', screen: 'architect', icon: Sparkles },
  { title: 'Floor Plans', text: 'Open the room program and floor layout.', screen: 'floorplan', icon: Grid3X3 },
  { title: '2D Editor', text: 'Review the coordinated 2D plan.', screen: 'coordinated2d', icon: PenTool },
  { title: '3D Visualization', text: 'Inspect massing from the saved plan.', screen: 'coordinated3d', icon: Box },
  { title: 'Exterior Design', text: 'Record façade, roof, and landscape direction.', screen: 'exterior', icon: Building2 },
  { title: 'Plot Intelligence', text: 'Edit site dimensions and unverified constraints.', screen: 'plot', icon: Compass },
  { title: 'BOQ & Cost', text: 'Edit the preliminary cost estimate.', screen: 'boq', icon: FileSpreadsheet },
  { title: 'Compliance', text: 'Review preliminary screening notes.', screen: 'compliance', icon: ShieldCheck },
  { title: 'Project Files', text: 'Upload surveys, briefs, and references.', screen: 'files', icon: FolderOpen },
  { title: 'Deliverables', text: 'Export the outputs that are actually saved.', screen: 'deliverables', icon: Trees },
];

export const HomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { createProjectFromPrompt, retryPromptAutomation, setScreen, projectReady, projectsError, isLoadingProjects } = useProject();
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDespiteError, setSavedDespiteError] = useState(false);

  const addChip = (chip: string) => {
    setPrompt((current) => {
      if (current.toLowerCase().includes(chip.toLowerCase())) return current;
      return current.trim() ? `${current.trim()} ${chip}` : chip;
    });
  };

  const submit = async () => {
    const value = prompt.trim();
    if (!value) {
      setError('Describe the project before creating it.');
      setSavedDespiteError(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSavedDespiteError(false);
    try {
      await createProjectFromPrompt(value);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create the project.';
      setError(message);
      setSavedDespiteError(/project was saved/i.test(message));
    } finally {
      setSubmitting(false);
    }
  };

  const retry = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await retryPromptAutomation(prompt.trim());
      setScreen('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The automation request failed again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="relative overflow-hidden rounded-[28px] border border-[#E7E9F2] bg-white">
        <img
          src="/images/compose-hero-house.png"
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover md:block"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-r from-white via-white/85 to-transparent md:block" />
        <div className="relative max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E7E9F2] bg-white px-3 py-1 text-xs font-semibold text-[#6546F5]">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Architecture
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#171923] sm:text-5xl">
            What do you want to <span className="text-[#6546F5]">compose</span> today?
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-[#667085]">
            Describe the project. Compose saves a draft, extracts the requirements it can read, and marks everything else for your review.
          </p>
          <div className="mt-6 rounded-[24px] border border-[#E7E9F2] bg-white p-3 shadow-sm">
            <label className="sr-only" htmlFor="project-prompt">Project description</label>
            <textarea
              id="project-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder="Describe your dream project..."
              className="w-full resize-none bg-transparent px-2 py-2 text-base outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#6546F5] to-[#5267F7] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {submitting ? 'Creating project' : 'Generate'}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addChip(chip)}
                className="min-h-11 rounded-full border border-[#E7E9F2] bg-white px-4 text-sm text-[#344054] hover:border-[#C9C3F5]"
              >
                {chip}
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm leading-6 text-[#B42318]">
              <p>{error}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {savedDespiteError && (
                  <button type="button" className="min-h-11 rounded-xl bg-white px-3 font-semibold" onClick={retry}>
                    Retry automation
                  </button>
                )}
                {projectReady && (
                  <button type="button" className="min-h-11 rounded-xl bg-white px-3 font-semibold" onClick={() => setScreen('setup')}>
                    Open saved project
                  </button>
                )}
              </div>
            </div>
          )}
          {projectsError && (
            <p className="mt-4 text-sm text-[#B54708]">{isLoadingProjects ? 'Loading projects…' : projectsError}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-center text-lg font-semibold">What do you want to create?</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => navigate(`/studio/${card.screen}`)}
                className="rounded-[20px] border border-[#E7E9F2] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F4F1FF] text-[#6546F5]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3 block text-base font-semibold">{card.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#667085]">{card.text}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
