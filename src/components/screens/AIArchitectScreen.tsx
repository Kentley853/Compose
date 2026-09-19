import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { askArchitect } from '../../services/geminiArchitect';
import {
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  RotateCcw,
  Edit3,
  Sliders,
  HelpCircle,
  MessageSquare,
  Building,
} from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

interface ChatMessage {
  id: string;
  sender: 'architect' | 'user';
  text: string;
  timestamp: string;
  source?: string;
}

export const AIArchitectScreen: React.FC = () => {
  const { project, updateBrief, approveRevision, setScreen, addToast } = useProject();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'architect',
      text: `Welcome to the concept studio. I have ingested your **15m × 24m parcel in South Jakarta** with southern road frontage and a 2-storey program.
      
To finalize the architectural brief and spatial zoning, please review the 4 strategic design inquiries below or ask me any programmatic question.`,
      timestamp: '10:00 AM',
      source: 'AI Architect Director',
    },
  ]);

  const clarificationPrompts = [
    {
      title: 'Ground Floor Guest Suite',
      prompt: 'Should the guest bedroom be located on the ground floor with step-free garden access or relocated to the first floor?',
      answered: true,
      answer: 'Yes, ground floor for multigenerational accessibility and buffer from street noise.',
    },
    {
      title: 'Family Living vs. Salon',
      prompt: 'Do you want the upper family lounge open to below or acoustically enclosed for private evening cinema & study?',
      answered: true,
      answer: 'Enclosed upper family sanctuary with open-plan formal salon on ground level.',
    },
    {
      title: 'Wet Kitchen & Service Spine',
      prompt: 'Should the wet kitchen feature an independent external side-service entry along the western setback?',
      answered: true,
      answer: 'Yes, dedicated 2.0m western service spine for staff logistics, waste, and food deliveries.',
    },
    {
      title: 'Garden Threshold Sequence',
      prompt: 'How dramatic should the garden connection be from the main entrance foyer?',
      answered: true,
      answer: 'Axial reveal: compressed entrance gallery opening to 6.5m floor-to-ceiling glass dining vistas.',
    },
  ];

  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const response = await askArchitect({
        prompt: textToSend,
        projectContext: {
          plot: project.plot,
          requirements: project.requirements,
          brief: project.brief,
        },
      });

      const architectMsg: ChatMessage = {
        id: 'arch-' + Date.now(),
        sender: 'architect',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
      };

      setMessages((prev) => [...prev, architectMsg]);
    } catch (e) {
      console.error(e);
      addToast('Architect Response Error', 'Local deterministic fallback used.', 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveBrief = () => {
    approveRevision('brief', 'Architectural brief and room spatial zoning baseline approved.');
    addToast('Brief Approved', 'Brief and room program locked for floor plan synthesis.', 'success');
    setScreen('floorplan');
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">AI Architect Dialogue</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                Gemini 3.8 Flash • Program Briefing
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Iterate spatial adjacencies, resolve circulation hierarchies, and approve room schedule.
            </p>
          </div>

          <button
            id="btn-approve-brief-top"
            onClick={handleApproveBrief}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Approve Brief & Generate Plans</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Two Column Layout: Dialogue vs. Structured Brief */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: AI Architect Dialogue Thread (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between h-[640px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Architectural Director Dialogue
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EEF4FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                Connected
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto my-3 pr-2 space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-[#667085]">{m.timestamp}</span>
                    <span className="text-[11px] font-semibold text-[#344054]">
                      {m.sender === 'user' ? 'You (Architect)' : 'Compose AI Director'}
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                      m.sender === 'user'
                        ? 'bg-[#2563EB] text-white rounded-br-none shadow-xs'
                        : 'bg-[#F9FAFB] border border-[#E4E7EC] text-[#172033] rounded-bl-none shadow-xs'
                    }`}
                  >
                    <div className="prose prose-xs max-w-none text-xs">
                      {m.text.split('\n').map((line, i) => (
                        <p key={i} className="my-1">
                          {line}
                        </p>
                      ))}
                    </div>
                    {m.source && (
                      <div className="mt-2 pt-1 border-t border-[#E4E7EC] text-[10px] text-[#667085] font-mono">
                        Attribution: {m.source}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-[#2563EB] p-2 font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Architect analyzing spatial adjacencies...</span>
                </div>
              )}
            </div>

            {/* Quick Pre-configured Inquiries */}
            <div className="pt-2 border-t border-[#E4E7EC]">
              <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Suggested Program Inquiries:
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {clarificationPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(q.prompt)}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#F9FAFB] hover:bg-[#EEF4FF] hover:text-[#2563EB] text-[#344054] border border-[#E4E7EC] text-left transition-colors font-medium"
                  >
                    {q.title}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="flex gap-2">
                <input
                  id="input-architect-chat"
                  type="text"
                  placeholder="Ask architect about orientation, courtyard voids, setbacks..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                  className="flex-1 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                />
                <button
                  id="btn-send-architect-chat"
                  onClick={() => handleSendPrompt()}
                  disabled={isGenerating || !inputPrompt.trim()}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Architectural Brief & Room Schedule (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Synthesized Architectural Brief
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#ABEFC6]">
                  Ready for Planning
                </span>
              </div>

              {/* Key Summary Cards */}
              <div className="grid grid-cols-3 gap-3 my-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[11px] text-[#667085]">Target Area</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5 font-mono">
                    {project.requirements.targetBuiltUpArea} m²
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[11px] text-[#667085]">Ground Footprint</div>
                  <div className="text-base font-bold text-[#2563EB] mt-0.5 font-mono">
                    145 m²
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[11px] text-[#667085]">Storeys</div>
                  <div className="text-base font-bold text-[#172033] mt-0.5 font-mono">
                    {project.requirements.floors} Floors
                  </div>
                </div>
              </div>

              {/* Core Design Objectives */}
              <div className="space-y-1.5 mb-4">
                <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Core Objectives:
                </div>
                <div className="space-y-1 text-xs">
                  {project.brief.projectObjectives.map((dp: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex items-center gap-2 text-[#344054] text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span>{dp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Schedule Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  <span>Space Program ({project.brief.spaceRequirements.length} Spaces)</span>
                  <span>
                    Total: {project.brief.spaceRequirements.reduce((a: number, b: any) => a + b.targetArea, 0)} m²
                  </span>
                </div>

                <div className="max-h-[220px] overflow-y-auto border border-[#E4E7EC] rounded-lg bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#667085] text-[11px] uppercase font-semibold sticky top-0 border-b border-[#E4E7EC]">
                      <tr>
                        <th className="py-2 px-3">Room / Space</th>
                        <th className="py-2 px-2">Level</th>
                        <th className="py-2 px-2">Zoning</th>
                        <th className="py-2 px-3 text-right">Target m²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7EC] text-[#344054] text-xs">
                      {project.brief.spaceRequirements.map((rm: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#F9FAFB]">
                          <td className="py-1.5 px-3 font-medium text-[#172033]">{rm.room}</td>
                          <td className="py-1.5 px-2 text-[#667085]">
                            {rm.floor === 1 ? 'Ground' : 'First'}
                          </td>
                          <td className="py-1.5 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                rm.zone.toLowerCase() === 'public'
                                  ? 'bg-[#EEF4FF] text-[#2563EB]'
                                  : rm.zone.toLowerCase() === 'private'
                                  ? 'bg-[#F9F5FF] text-[#7A5AF8]'
                                  : rm.zone === 'semi-private'
                                  ? 'bg-[#FFF4ED] text-[#B54708]'
                                  : 'bg-[#F2F4F7] text-[#475467]'
                              }`}
                            >
                              {rm.zone}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-medium text-[#172033]">{rm.targetArea} m²</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  addToast('Brief Regenerated', 'Programmatic requirements re-synthesized.', 'info');
                }}
                className="px-3 py-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-[#344054] text-xs font-medium transition-colors"
              >
                Reset Brief
              </button>

              <button
                id="btn-approve-brief-bottom"
                onClick={handleApproveBrief}
                className="flex-1 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Approve Brief & Generate Floor Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
