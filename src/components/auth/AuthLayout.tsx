import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { ComposeLogo } from '../brand/ComposeLogo';

const features = [
  {
    title: 'AI Floor Plans',
    text: 'Organize a room program and edit preliminary floor layouts.',
  },
  {
    title: '3D Visualization',
    text: 'Review massing that follows the saved floor geometry.',
  },
  {
    title: 'Cost Estimation',
    text: 'Build a preliminary US-dollar estimate from project quantities.',
  },
  {
    title: 'Smart & Secure',
    text: 'Projects and files stay in your private Supabase account.',
  },
];

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[100dvh] bg-white text-[#172033]">
    <header className="flex items-center justify-between gap-3 px-4 sm:px-8 h-16">
      <Link to="/login" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6546F5]">
        <ComposeLogo />
      </Link>
      <Link
        to="/help"
        className="inline-flex items-center gap-1.5 min-h-11 px-3 text-sm font-medium text-[#475467] hover:text-[#172033] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6546F5]"
      >
        <HelpCircle className="w-4 h-4" />
        Help
      </Link>
    </header>

    <main className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,440px)] lg:items-center lg:gap-12">
      <section className="lg:col-start-2 lg:row-start-1">{children}</section>
      <section className="lg:col-start-1 lg:row-start-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E7E9F2] bg-[#F7F7FB] px-3 py-1 text-xs font-semibold tracking-wide text-[#6546F5]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6546F5]" />
          AI-POWERED ARCHITECTURE PLATFORM
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#171923] sm:text-5xl">
          Design Smarter.
          <br />
          <span className="text-[#6546F5]">Build Better.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#667085]">
          From concept to a preliminary architectural package. Organize the brief, site information, floor plans, 3D massing, and cost estimate in one workspace. Outputs require professional review.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-[#E7E9F2] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#172033]">{feature.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#667085]">{feature.text}</p>
            </article>
          ))}
        </div>
        <div className="relative mt-6 overflow-hidden rounded-[24px] border border-[#E7E9F2] bg-[#F7F8FC]">
          <img
            src="/images/compose-hero-house.png"
            alt="Contemporary two-story house with wood cladding and a glass balcony"
            className="h-64 w-full object-cover sm:h-72"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.2),transparent_30%),repeating-linear-gradient(90deg,transparent,transparent_27px,rgba(101,70,245,0.08)_28px),repeating-linear-gradient(0deg,transparent,transparent_27px,rgba(82,103,247,0.08)_28px)]" />
        </div>
      </section>
    </main>
    <footer className="px-4 pb-6 text-center text-xs text-[#98A2B3] sm:px-8 sm:text-left">
      © {new Date().getFullYear()} Compose AI. Preliminary concepts require review by licensed professionals.
    </footer>
  </div>
);

export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-[24px] border border-[#E7E9F2] bg-white p-6 shadow-[0_12px_40px_rgba(23,32,51,0.06)] sm:p-8">
    {children}
  </div>
);
