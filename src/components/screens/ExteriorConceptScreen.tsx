import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Palette,
  ArrowRight,
  Leaf,
  Sliders,
  CheckCircle2,
  Sun,
  ShieldCheck,
} from 'lucide-react';

interface PaletteSpec {
  id: string;
  name: string;
  region: string;
  tagline: string;
  solarMitigation: string;
  carbonScore: string;
  ventilation: string;
  colors: string[];
  wallColor: string;
  wallStroke: string;
  plinthColor: string;
  plinthStroke: string;
  accentColor: string;
  roofColor: string;
  roofAccent: string;
  glassColor: string;
  glassStroke: string;
  doorColor: string;
  doorAccent: string;
  louverStroke: string;
  louverBg: string;
  plinthLabel: string;
  doorLabel: string;
  louverLabel: string;
  roofLabel: string;
  wallOptions: string[];
  accentOptions: string[];
  glassOptions: string[];
  climateSummary: string;
}

const PALETTES: PaletteSpec[] = [
  {
    id: 'hill-country',
    name: 'Texas Hill Country Contemporary',
    region: 'Austin & Central Texas',
    tagline: 'Locally sourced cream limestone, western red cedar louvers, and dark bronze standing seam accents.',
    solarMitigation: '-44% Cooling Load',
    carbonScore: 'Quarried Texas Limestone',
    ventilation: '8.6 ACH Cross Airflow',
    colors: ['#F8F6F0', '#B45309', '#292524', '#D6D3D1'],
    wallColor: '#F8F6F0',
    wallStroke: '#D6D3D1',
    plinthColor: '#E7E5E4',
    plinthStroke: '#A8A29E',
    accentColor: '#B45309',
    roofColor: '#292524',
    roofAccent: '#44403C',
    glassColor: '#E0F2FE',
    glassStroke: '#0284C7',
    doorColor: '#92400E',
    doorAccent: '#FEF3C7',
    louverStroke: '#B45309',
    louverBg: '#FEF3C7',
    plinthLabel: 'Austin Cream Limestone Plinth',
    doorLabel: 'Solid White Oak Pivot Door',
    louverLabel: 'Western Red Cedar Louvers',
    roofLabel: '6 ft Shading Cantilever Eaves',
    wallOptions: [
      'Texas Cream Limestone Plaster (Smooth Float)',
      'Roughback Cut Austin Stone Masonry',
      'Board-Formed Architectural Concrete',
    ],
    accentOptions: [
      'Western Red Cedar FSC Louvers (Clear matte oil)',
      'Dark Bronze Anodized Aluminum Battens',
      'Architectural Perforated Copper Screens',
    ],
    glassOptions: [
      'Double Glazed Low-E Solar Control (U=0.28, SHGC 0.23)',
      'Triple Glazed Low-E Acoustic Laminated (U=0.18)',
      'High-Impact Solar Heat Rejecting Glazing',
    ],
    climateSummary:
      'Deep 6-foot eaves eliminate up to 88% of harsh Austin summer solar gain. Operable western red cedar screens deflect intense afternoon glare while allowing night-time prevailing breeze ventilation.',
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist Urban',
    region: 'Pacific Northwest & Urban Infill',
    tagline: 'Crisp cubic geometry with smooth mineral silicate plaster, charcoal metal reveals, and high-performance solar glazing.',
    solarMitigation: '-36% Cooling Load',
    carbonScore: 'Recycled Aluminum & Zinc',
    ventilation: '7.8 ACH Cross Airflow',
    colors: ['#F1F5F9', '#334155', '#0F172A', '#0284C7'],
    wallColor: '#F8FAFC',
    wallStroke: '#94A3B8',
    plinthColor: '#CBD5E1',
    plinthStroke: '#64748B',
    accentColor: '#334155',
    roofColor: '#0F172A',
    roofAccent: '#334155',
    glassColor: '#BAE6FD',
    glassStroke: '#0369A1',
    doorColor: '#1E293B',
    doorAccent: '#94A3B8',
    louverStroke: '#475569',
    louverBg: '#F1F5F9',
    plinthLabel: 'Board-Formed Architectural Concrete',
    doorLabel: 'Matte Charcoal Steel Door',
    louverLabel: 'Charcoal Aluminum Battens',
    roofLabel: '5 ft Matte Metal Cantilever Eaves',
    wallOptions: [
      'Smooth Mineral Silicate Plaster (Crisp White)',
      'Charcoal Fiber Cement Rain-screen Panels',
      'Ultra-High Performance Architectural Concrete',
    ],
    accentOptions: [
      'Matte Charcoal Anodized Aluminum Battens',
      'Charred Shou Sugi Ban Accents',
      'Blackened Steel Architectural Reveals',
    ],
    glassOptions: [
      'Triple Glazed Argon-Filled High Performance (U=0.14)',
      'Acoustic Laminated Low-E (STC 42 dB)',
      'Dynamic Solar Reflective Low-E Glass',
    ],
    climateSummary:
      'Engineered rain-screen envelope with continuous external insulation minimizes thermal bridging. Charcoal solar fins provide targeted southern shading while capturing maximum indirect diffused daylight.',
  },
  {
    id: 'desert-modern',
    name: 'Desert Modern Earth & Corten',
    region: 'Scottsdale & Desert Southwest',
    tagline: 'Stabilized rammed earth, quarried sandstone plinth, weathered Corten steel fins, and deep shaded loggias.',
    solarMitigation: '-52% Thermal Gain',
    carbonScore: 'Low Carbon Rammed Earth',
    ventilation: '9.2 ACH Night-Flush Flow',
    colors: ['#FBF3EA', '#C2410C', '#431407', '#A28B7A'],
    wallColor: '#FAF0E6',
    wallStroke: '#D7C4B7',
    plinthColor: '#D7C4B7',
    plinthStroke: '#A28B7A',
    accentColor: '#C2410C',
    roofColor: '#431407',
    roofAccent: '#7C2D12',
    glassColor: '#E0F2FE',
    glassStroke: '#0284C7',
    doorColor: '#7C2D12',
    doorAccent: '#FDE68A',
    louverStroke: '#C2410C',
    louverBg: '#FFEDD5',
    plinthLabel: 'Quarried Desert Sandstone Plinth',
    doorLabel: 'Patina Copper Pivot Door',
    louverLabel: 'Weathered Corten Steel Fins',
    roofLabel: '8 ft Deep Desert Shading Loggia',
    wallOptions: [
      'Stabilized Rammed Earth (Local Sonoran aggregate)',
      'Warm Desert Sand Stucco Finish',
      'Textured Arizona Travertine Masonry',
    ],
    accentOptions: [
      'Weathered Corten Steel Shading Fins',
      'Warm Patina Copper Reveal Battens',
      'Perforated Architectural Bronze Panels',
    ],
    glassOptions: [
      'Solar Reflective Deep-Tint Low-E (SHGC 0.19)',
      'Dual-Pane Low-Emissivity Tempered Safety Glass',
      'High-Performance Ceramic Fritted Glazing',
    ],
    climateSummary:
      'High-thermal-mass earth walls absorb daytime Sonoran heat and release warmth slowly overnight. Deep 8-foot loggias create micro-climates that cut envelope surface temperatures by up to 28°F.',
  },
];

export const ExteriorConceptScreen: React.FC = () => {
  const {
    setSelected3DStyle,
    setSelected3DMaterial,
    setScreen,
    addToast,
  } = useProject();

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('hill-country');
  const activePalette = PALETTES.find((p) => p.id === selectedPaletteId) || PALETTES[0];

  const [selectedWall, setSelectedWall] = useState<string>(activePalette.wallOptions[0]);
  const [selectedAccent, setSelectedAccent] = useState<string>(activePalette.accentOptions[0]);
  const [selectedGlass, setSelectedGlass] = useState<string>(activePalette.glassOptions[0]);

  const handleApplyPalette = (pal: PaletteSpec) => {
    setSelectedPaletteId(pal.id);
    setSelectedWall(pal.wallOptions[0]);
    setSelectedAccent(pal.accentOptions[0]);
    setSelectedGlass(pal.glassOptions[0]);
    setSelected3DStyle(pal.name);
    setSelected3DMaterial(pal.plinthLabel);
    addToast('Façade Palette Applied', `Synchronized ${pal.name} envelope and elevation finishes.`, 'success');
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-fluid-xl font-bold text-[#172033] tracking-tight">Façade & Exterior Concept</h1>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {activePalette.name}
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Specify building envelope materiality, solar louvers, and passive climate mitigation systems for US residential zoning.
            </p>
          </div>

          <button
            id="btn-goto-compliance-from-ext"
            onClick={() => setScreen('compliance')}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Proceed to Code Compliance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Material Palettes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PALETTES.map((pal) => {
            const isSelected = pal.id === selectedPaletteId;
            return (
              <div
                key={pal.id}
                onClick={() => handleApplyPalette(pal)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white border-[#2563EB] shadow-sm ring-2 ring-[#2563EB]/15'
                    : 'bg-white border-[#E4E7EC] hover:border-[#2563EB]/40 hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-semibold text-[#667085]">
                    {pal.region}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EEF4FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-[#172033]">{pal.name}</div>
                <div className="text-xs text-[#667085] mt-1 leading-relaxed">{pal.tagline}</div>

                {/* Color swatches */}
                <div className="flex items-center gap-2 my-3">
                  {pal.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-6 h-6 rounded-md border border-[#E4E7EC] shadow-xs transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                      title={`Palette swatch: ${c}`}
                    />
                  ))}
                </div>

                {/* Environmental Metrics */}
                <div className="pt-3 border-t border-[#E4E7EC] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Solar Heat Reduction:</span>
                    <span className="text-[#B54708] font-bold font-mono">{pal.solarMitigation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Embodied Carbon:</span>
                    <span className="text-[#027A48] font-bold">{pal.carbonScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Passive Airflow:</span>
                    <span className="text-[#2563EB] font-mono font-semibold">{pal.ventilation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two Column Layout: Façade Visualizer & Material Spec Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Interactive Façade Section Elevation */}
          <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Façade Elevation Section (South Street Frontage)
                </span>
              </div>
              <span className="text-xs font-mono text-[#667085]">Scale 1/8" = 1'-0"</span>
            </div>

            {/* SVG Dynamic Elevation Drawing matching active palette */}
            <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl p-3 sm:p-6 flex items-center justify-center min-h-[15rem] sm:min-h-[25rem]">
              <svg viewBox="0 0 520 370" className="w-full max-h-[380px] select-none">
                <defs>
                  {/* Subtle drop shadow */}
                  <filter id="facadeShadow" x="-5%" y="-5%" width="110%" height="115%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
                  </filter>
                </defs>

                {/* Sky Wash */}
                <rect x="0" y="0" width="520" height="320" fill="#F8FAFC" rx="8" />

                {/* Ground Line */}
                <line x1="15" y1="320" x2="495" y2="320" stroke="#64748B" strokeWidth="2.5" />
                <text x="25" y="338" fill="#64748B" fontSize="10" fontFamily="monospace" fontWeight="600">
                  ±0'-0" Finished Grade Level
                </text>

                {/* Plinth Base (Dynamic Color from activePalette) */}
                <rect
                  x="60"
                  y="285"
                  width="380"
                  height="35"
                  fill={activePalette.plinthColor}
                  stroke={activePalette.plinthStroke}
                  strokeWidth="1.5"
                  filter="url(#facadeShadow)"
                />
                <text
                  x="250"
                  y="307"
                  fill="#334155"
                  fontSize="10.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {activePalette.plinthLabel}
                </text>

                {/* Ground Floor Main Wall Massing (Dynamic Color) */}
                <rect
                  x="60"
                  y="165"
                  width="380"
                  height="120"
                  fill={activePalette.wallColor}
                  stroke={activePalette.wallStroke}
                  strokeWidth="2"
                />

                {/* Large Glazed Sliding Door Section (Dynamic Color) */}
                <rect
                  x="175"
                  y="180"
                  width="245"
                  height="105"
                  fill={activePalette.glassColor}
                  stroke={activePalette.glassStroke}
                  strokeWidth="2"
                />
                <line
                  x1="297"
                  y1="180"
                  x2="297"
                  y2="285"
                  stroke={activePalette.glassStroke}
                  strokeWidth="1.5"
                />
                <line
                  x1="175"
                  y1="232"
                  x2="420"
                  y2="232"
                  stroke={activePalette.glassStroke}
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
                <text
                  x="297"
                  y="240"
                  fill="#0369A1"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  10 ft Multi-Slide Glazed Threshold
                </text>

                {/* Main Entry Pivot Door (Dynamic Color) */}
                <rect
                  x="80"
                  y="180"
                  width="65"
                  height="105"
                  fill={activePalette.doorColor}
                  stroke={activePalette.roofColor}
                  strokeWidth="2"
                />
                <circle cx="90" cy="235" r="3.5" fill={activePalette.doorAccent} />
                <text
                  x="112"
                  y="238"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {activePalette.doorLabel.split(' ')[0]}
                </text>

                {/* Intermediate Slab Band (Dynamic Color) */}
                <rect
                  x="45"
                  y="152"
                  width="410"
                  height="13"
                  fill={activePalette.roofColor}
                  stroke={activePalette.roofAccent}
                  strokeWidth="1"
                />

                {/* Upper Floor Wall Massing (Dynamic Color) */}
                <rect
                  x="60"
                  y="48"
                  width="380"
                  height="104"
                  fill={activePalette.wallColor}
                  stroke={activePalette.wallStroke}
                  strokeWidth="2"
                />

                {/* Upper Floor Glazing behind Louvers */}
                <rect
                  x="215"
                  y="58"
                  width="205"
                  height="86"
                  fill={activePalette.glassColor}
                  stroke={activePalette.glassStroke}
                  strokeWidth="1.5"
                />

                {/* Shading Screen & Louvers (Dynamic Color from activePalette) */}
                <g>
                  <rect
                    x="215"
                    y="58"
                    width="205"
                    height="86"
                    fill={activePalette.louverBg}
                    fillOpacity="0.4"
                    stroke={activePalette.louverStroke}
                    strokeWidth="1"
                  />
                  {[225, 240, 255, 270, 285, 300, 315, 330, 345, 360, 375, 390, 405].map((lx) => (
                    <line
                      key={lx}
                      x1={lx}
                      y1="58"
                      x2={lx}
                      y2="144"
                      stroke={activePalette.louverStroke}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ))}
                  {/* Louver label pill */}
                  <rect
                    x="245"
                    y="92"
                    width="150"
                    height="20"
                    rx="3"
                    fill="#FFFFFF"
                    stroke={activePalette.louverStroke}
                    strokeWidth="1"
                  />
                  <text
                    x="320"
                    y="106"
                    fill={activePalette.accentColor}
                    fontSize="9.5"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {activePalette.louverLabel}
                  </text>
                </g>

                {/* Cantilever Overhang Roof Fascia (Dynamic Color) */}
                <rect
                  x="30"
                  y="34"
                  width="440"
                  height="15"
                  fill={activePalette.roofColor}
                  stroke={activePalette.roofAccent}
                  strokeWidth="1.5"
                  filter="url(#facadeShadow)"
                />
                <line x1="30" y1="34" x2="470" y2="34" stroke="#94A3B8" strokeWidth="1" />
                <text
                  x="250"
                  y="26"
                  fill="#172033"
                  fontSize="10.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {activePalette.roofLabel}
                </text>

                {/* Imperial Height Dimension Callout */}
                <line x1="485" y1="320" x2="485" y2="34" stroke="#64748B" strokeWidth="1" />
                <line x1="480" y1="320" x2="490" y2="320" stroke="#64748B" strokeWidth="1" />
                <line x1="480" y1="34" x2="490" y2="34" stroke="#64748B" strokeWidth="1" />
                <rect
                  x="475"
                  y="160"
                  width="20"
                  height="55"
                  rx="3"
                  fill="#FFFFFF"
                  stroke="#E4E7EC"
                />
                <text
                  x="485"
                  y="188"
                  fill="#172033"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                  transform="rotate(-90 485 188)"
                  textAnchor="middle"
                >
                  +24'-4"
                </text>
              </svg>
            </div>

            {/* Active Palette Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC] text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-[#CBD5E1]" style={{ backgroundColor: activePalette.wallColor }} />
                  <span className="text-[#344054] font-medium">Wall Finish</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-[#CBD5E1]" style={{ backgroundColor: activePalette.accentColor }} />
                  <span className="text-[#344054] font-medium">Screen/Accent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-[#CBD5E1]" style={{ backgroundColor: activePalette.roofColor }} />
                  <span className="text-[#344054] font-medium">Fascia/Trims</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-[#CBD5E1]" style={{ backgroundColor: activePalette.plinthColor }} />
                  <span className="text-[#344054] font-medium">Plinth Stone</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#2563EB] font-semibold">
                Synchronized with 3D Model
              </span>
            </div>
          </div>

          {/* Right 5 cols: Material Specification Matrix */}
          <div className="lg:col-span-5 bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
              <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Material Specifications
              </span>
              <span className="text-[10px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#ABEFC6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                US IECC Climate Zone Compliant
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  1. Primary Wall Finish
                </label>
                <select
                  value={selectedWall}
                  onChange={(e) => setSelectedWall(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                >
                  {activePalette.wallOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  2. Shading Screen & Accent
                </label>
                <select
                  value={selectedAccent}
                  onChange={(e) => setSelectedAccent(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                >
                  {activePalette.accentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  3. Fenestration & Glazing
                </label>
                <select
                  value={selectedGlass}
                  onChange={(e) => setSelectedGlass(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                >
                  {activePalette.glassOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Climate & Thermal Envelope Summary */}
            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2 text-xs">
              <div className="text-xs text-[#172033] font-bold flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#027A48]" />
                <span>Thermal Envelope & Passive Solar Performance</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                {activePalette.climateSummary}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                onClick={() => setScreen('compliance')}
                className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Verify Building & Zoning Compliance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
