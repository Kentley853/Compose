import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

function PageTitle({ title, text }: { title: string; text: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#667085]">{text}</p>
    </header>
  );
}

export const DesignsPage: React.FC = () => {
  const { companyProjects, isLoadingProjects, openProjectById, setScreen } = useProject();
  const schemes = companyProjects.flatMap((project) =>
    (project.schemes || []).map((scheme) => ({ ...scheme, projectId: project.id, projectName: project.project_name })),
  );

  return (
    <div>
      <PageTitle
        title="My Designs"
        text="Schemes saved on your projects. A scheme is not marked as recommended unless the workspace can explain why."
      />
      {isLoadingProjects ? (
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
      ) : schemes.length === 0 ? (
        <Empty text="No saved schemes yet. Create a project and add a room program to store the first scheme." />
      ) : (
        <div className="grid gap-3">
          {schemes.map((scheme) => (
            <button
              key={`${scheme.projectId}-${scheme.id}`}
              className="rounded-2xl border border-[#E7E9F2] bg-white p-4 text-left"
              onClick={async () => {
                await openProjectById(scheme.projectId);
                setScreen('floorplan');
              }}
            >
              <div className="font-semibold">{scheme.name}</div>
              <div className="text-sm text-[#667085]">{scheme.projectName}{scheme.conceptTag ? ` · ${scheme.conceptTag}` : ''}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const InspirationPage: React.FC = () => {
  const { projectReady, setScreen } = useProject();
  return (
    <div>
      <PageTitle
        title="Inspiration"
        text="Reference images are stored with the project that uploaded them. This page does not show stock images as if they were yours."
      />
      <Empty text="No inspiration library is saved yet. Upload reference images from Project Files and they remain attached to that project." />
      {projectReady && (
        <button className="mt-4 min-h-11 rounded-xl bg-[#6546F5] px-4 text-sm font-semibold text-white" onClick={() => setScreen('files')}>
          Open project files
        </button>
      )}
    </div>
  );
};

export const TemplatesPage: React.FC = () => {
  const { createNewProject } = useProject();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (id: string, name: string, type: string, template?: 'blank' | 'austin-starter') => {
    setPending(id);
    setError(null);
    try {
      await createNewProject(name, '', type, template ? { template } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
    } finally {
      setPending(null);
    }
  };

  const templates = [
    {
      id: 'residential',
      name: 'Blank residential project',
      type: 'Single-family residential',
      text: 'Empty setup, plot, brief, and scheme. Nothing is invented for you.',
      template: 'blank' as const,
    },
    {
      id: 'commercial',
      name: 'Blank commercial project',
      type: 'Commercial',
      text: 'Same empty workspace with the project type set to commercial.',
      template: 'blank' as const,
    },
    {
      id: 'starter',
      name: 'Austin starter geometry',
      type: 'Single-family residential',
      text: 'Example rooms for learning the editor. The page labels them as starter geometry, not your site.',
      template: 'austin-starter' as const,
    },
  ];

  return (
    <div>
      <PageTitle title="Templates" text="Starting a template creates a real project in your account." />
      <div className="grid gap-3 md:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="rounded-2xl border border-[#E7E9F2] bg-white p-4">
            <h2 className="font-semibold">{template.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">{template.text}</p>
            <button
              className="mt-4 min-h-11 rounded-xl bg-[#6546F5] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={pending !== null}
              onClick={() => start(template.id, template.name, template.type, template.template)}
            >
              {pending === template.id ? 'Creating…' : 'Use template'}
            </button>
          </article>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-[#B42318]">{error}</p>}
    </div>
  );
};

export const ToolsPage: React.FC = () => {
  const tools = [
    { href: '/studio/files', title: 'Document workspace', text: 'Upload and categorize project files.' },
    { href: '/studio/architect', title: 'Planning dialogue', text: 'Work through the architectural brief.' },
    { href: '/studio/boq', title: 'Cost analysis', text: 'Edit preliminary quantities and unit costs.' },
    { href: '/studio/coordinated3d', title: 'Visualization', text: 'Open the 3D view for the active scheme.' },
    { href: '/studio/plot', title: 'Plot intelligence', text: 'Record site information you can verify.' },
    { href: '/studio/compliance', title: 'Compliance notes', text: 'Review preliminary screening records.' },
  ];
  return (
    <div>
      <PageTitle title="AI Tools" text="Each tool opens inside the active project. If you have not created one, the workspace asks you to start there." />
      <div className="grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} to={tool.href} className="rounded-2xl border border-[#E7E9F2] bg-white p-4">
            <div className="font-semibold">{tool.title}</div>
            <p className="mt-1 text-sm text-[#667085]">{tool.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <PageTitle title="Team" text="This workspace currently belongs to the signed-in account. Shared seats are not enabled, so no invite control is shown." />
      <article className="rounded-2xl border border-[#E7E9F2] bg-white p-4">
        <div className="text-sm text-[#667085]">Owner</div>
        <div className="mt-1 font-semibold">{user?.email}</div>
        <p className="mt-2 text-sm text-[#667085]">Projects and files are limited to this login by row-level security after the ownership migration is applied.</p>
      </article>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const metadata = (user?.user_metadata || {}) as { full_name?: string; company?: string };
  const [fullName, setFullName] = useState(metadata.full_name || '');
  const [company, setCompany] = useState(metadata.company || '');
  const [units, setUnits] = useState(() => localStorage.getItem('compose_ui_units') || 'imperial');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ fullName, company });
      localStorage.setItem('compose_ui_units', units);
      setMessage('Profile saved to your Supabase account. Unit preference is kept in this browser.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageTitle title="Settings" text="Profile details are stored on your Supabase user. Display units are a local preference." />
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-2xl border border-[#E7E9F2] bg-white p-5">
        <label className="block text-sm font-medium">
          Email
          <input value={user?.email || ''} readOnly className="mt-1 h-12 w-full rounded-xl border border-[#E4E7EC] bg-[#F8F9FC] px-3" />
        </label>
        <label className="block text-sm font-medium">
          Full name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-[#E4E7EC] px-3" />
        </label>
        <label className="block text-sm font-medium">
          Company
          <input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-[#E4E7EC] px-3" />
        </label>
        <label className="block text-sm font-medium">
          Primary units
          <select value={units} onChange={(event) => setUnits(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-[#E4E7EC] px-3">
            <option value="imperial">Feet, inches, square feet, and US dollars</option>
            <option value="metric">Show metric as secondary information when available</option>
          </select>
        </label>
        {message && <p className="text-sm text-[#027A48]">{message}</p>}
        {error && <p className="text-sm text-[#B42318]">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={saving} className="min-h-11 rounded-xl bg-[#6546F5] px-4 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button type="button" onClick={() => signOut()} className="min-h-11 rounded-xl border border-[#E4E7EC] px-4 text-sm font-semibold">
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
};

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white px-4 py-8 text-sm leading-6 text-[#667085]">{text}</div>
);
