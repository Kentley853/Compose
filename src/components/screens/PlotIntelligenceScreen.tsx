import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ObservationItem } from '../../types/architecture';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Wind,
  Shield,
  FileText,
  Maximize2,
  RotateCcw,
  Navigation,
  ZoomIn,
  ZoomOut,
  Edit2,
  Check,
} from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

export const PlotIntelligenceScreen: React.FC = () => {
  const { project, updatePlot, approveRevision, setScreen, addToast } = useProject();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [showSolarPath, setShowSolarPath] = useState(true);
  const [showWindArrows, setShowWindArrows] = useState(true);

  const { width, depth, area, perimeter, buildableArea, setbacks } = project.plot;

  const handleConfirmPlot = () => {
    approveRevision('plot', `Plot boundary (${width}m x ${depth}m = ${area}m²) and solar envelope approved.`);
    addToast('Plot Approved', 'Site boundary saved into project baseline.', 'success');
  };

  const handleSendToArchitect = () => {
    approveRevision('plot', 'Plot intelligence verified and passed to AI Architect.');
    setScreen('architect');
  };

  const getSourceBadge = (source: ObservationItem['source']) => {
    let colorClass = 'text-[#475467] bg-[#F2F4F7] border-[#E4E7EC]';
    if (source === 'Deterministic calculation') {
      colorClass = 'text-[#2563EB] bg-[#EEF4FF] border-[#2563EB]/30';
    } else if (source === 'AI interpretation') {
      colorClass = 'text-[#7A5AF8] bg-[#F9F5FF] border-[#D6BBFB]';
    } else if (source === 'Uploaded document') {
      colorClass = 'text-[#027A48] bg-[#ECFDF3] border-[#ABEFC6]';
    } else if (source === 'Regulatory source not configured') {
      colorClass = 'text-[#B54708] bg-[#FFF4ED] border-[#FECDCA]';
    }

    return (
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${colorClass}`}>
        {source}
      </span>
    );
  };

  // SVG Coordinates calculation with auto-scaling to prevent overflow
  const svgWidth = 460;
  const svgHeight = 620;
  const maxPlotW = 260;
  const maxPlotH = 390;
  const scale = Math.min(maxPlotW / width, maxPlotH / depth);
  const plotPixelW = width * scale;
  const plotPixelH = depth * scale;
  const originX = (svgWidth - plotPixelW) / 2;
  const originY = 65;

  // Setback offsets
  const sbLeft = setbacks.left * scale;
  const sbRight = setbacks.right * scale;
  const sbTop = setbacks.rear * scale; // Rear (North)
  const sbBottom = setbacks.front * scale; // Front road (South)

  const buildableX = originX + sbLeft;
  const buildableY = originY + sbTop;
  const buildableW = Math.max(10, plotPixelW - (sbLeft + sbRight));
  const buildableH = Math.max(10, plotPixelH - (sbTop + sbBottom));

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Site & Plot Intelligence</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {width}m × {depth}m • {area} m²
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Deterministic geometry, boundary setbacks, solar orientation, and wind corridors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('setup')}
              className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#172033] flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#667085]" />
              <span>Edit Dimensions</span>
            </button>

            <button
              onClick={handleConfirmPlot}
              className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#027A48] flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Baseline</span>
            </button>

            <button
              id="btn-send-to-architect"
              onClick={handleSendToArchitect}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Send to AI Architect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Left Diagram (7 cols) & Right Insights (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Interactive SVG Site Canvas */}
          <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Site Layout & Envelopes
                </span>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setShowSetbacks(!showSetbacks)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    showSetbacks
                      ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold'
                      : 'text-[#667085] hover:bg-[#F9FAFB]'
                  }`}
                >
                  Setbacks
                </button>
                <button
                  onClick={() => setShowSolarPath(!showSolarPath)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    showSolarPath
                      ? 'bg-[#FFF4ED] text-[#B54708] font-semibold'
                      : 'text-[#667085] hover:bg-[#F9FAFB]'
                  }`}
                >
                  Solar Path
                </button>
                <button
                  onClick={() => setShowWindArrows(!showWindArrows)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    showWindArrows
                      ? 'bg-[#ECFDF3] text-[#027A48] font-semibold'
                      : 'text-[#667085] hover:bg-[#F9FAFB]'
                  }`}
                >
                  Breeze
                </button>
              </div>
            </div>

            {/* SVG Diagram Canvas */}
            <div className="relative my-4 flex items-center justify-center bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl p-3 overflow-hidden min-h-[500px]">
              {/* North Indicator Badge */}
              <div className="absolute top-4 left-4 z-10 flex flex-col items-center bg-white border border-[#E4E7EC] px-2.5 py-2 rounded-lg shadow-xs text-xs">
                <Navigation className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-[#172033] text-[11px] mt-0.5">N</span>
                <span className="text-[#667085] text-[9px] font-mono">0° True</span>
              </div>

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-h-[500px] transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  {/* Diagonal soft hatch for setback buffer zone */}
                  <pattern id="setbackHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#CBD5E1" strokeWidth="1" strokeOpacity="0.7" />
                  </pattern>
                  {/* Subtle Grid Dots */}
                  <pattern id="siteGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="#E2E8F0" />
                  </pattern>
                </defs>

                {/* Site background grid */}
                <rect width={svgWidth} height={svgHeight} fill="url(#siteGrid)" />

                {/* Solar Path Arc (Sun rises East, sets West) */}
                {showSolarPath && (
                  <g opacity="0.9">
                    <path
                      d={`M ${originX + plotPixelW + 55} ${originY + 110} A 230 170 0 0 0 ${originX - 55} ${originY + 260}`}
                      fill="none"
                      stroke="#F79009"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    {/* Morning Sun */}
                    <circle cx={originX + plotPixelW + 40} cy={originY + 120} r="7" fill="#FDB022" />
                    <rect
                      x={originX + plotPixelW + 45}
                      y={originY + 106}
                      width="100"
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={originX + plotPixelW + 50}
                      y={originY + 119}
                      fill="#B54708"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Morning Sun (East)
                    </text>

                    {/* Afternoon Glare */}
                    <circle cx={originX - 40} cy={originY + 270} r="7" fill="#F79009" />
                    <rect
                      x={originX - 145}
                      y={originY + 258}
                      width="100"
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={originX - 140}
                      y={originY + 271}
                      fill="#B54708"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Afternoon Sun (West)
                    </text>
                  </g>
                )}

                {/* Prevailing Wind Corridor */}
                {showWindArrows && (
                  <g opacity="0.9">
                    <line
                      x1={originX + plotPixelW + 35}
                      y1={originY + 320}
                      x2={originX - 25}
                      y2={originY + 240}
                      stroke="#12B76A"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <polygon
                      points={`${originX - 25},${originY + 240} ${originX - 15},${originY + 235} ${originX - 17},${originY + 246}`}
                      fill="#12B76A"
                    />
                    <rect
                      x={originX + plotPixelW + 20}
                      y={originY + 325}
                      width="92"
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={originX + plotPixelW + 25}
                      y={originY + 338}
                      fill="#027A48"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Prevailing Breeze
                    </text>
                  </g>
                )}

                {/* Plot Boundary Polygon */}
                <rect
                  x={originX}
                  y={originY}
                  width={plotPixelW}
                  height={plotPixelH}
                  fill="#FFFFFF"
                  stroke="#98A2B3"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />

                {/* Setback Area (hatch) */}
                {showSetbacks && (
                  <rect
                    x={originX}
                    y={originY}
                    width={plotPixelW}
                    height={plotPixelH}
                    fill="url(#setbackHatch)"
                  />
                )}

                {/* Buildable Envelope Area */}
                <rect
                  x={buildableX}
                  y={buildableY}
                  width={buildableW}
                  height={buildableH}
                  fill="#EEF4FF"
                  stroke="#2563EB"
                  strokeWidth="2"
                />

                {/* Label inside buildable area with pill container to prevent collision */}
                <g>
                  <rect
                    x={buildableX + buildableW / 2 - 80}
                    y={buildableY + buildableH / 2 - 24}
                    width="160"
                    height="48"
                    rx="8"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="1"
                  />
                  <text
                    x={buildableX + buildableW / 2}
                    y={buildableY + buildableH / 2 - 6}
                    fill="#172033"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    Buildable Footprint
                  </text>
                  <text
                    x={buildableX + buildableW / 2}
                    y={buildableY + buildableH / 2 + 12}
                    fill="#2563EB"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {Math.round(buildableArea).toLocaleString()} sq ft ({((buildableArea / area) * 100).toFixed(0)}% Coverage)
                  </text>
                </g>

                {/* Dimension 1: Width dimension with pill */}
                <g>
                  <line x1={originX} y1={originY - 16} x2={originX + plotPixelW} y2={originY - 16} stroke="#667085" strokeWidth="1" />
                  <line x1={originX} y1={originY - 22} x2={originX} y2={originY - 10} stroke="#667085" strokeWidth="1" />
                  <line x1={originX + plotPixelW} y1={originY - 22} x2={originX + plotPixelW} y2={originY - 10} stroke="#667085" strokeWidth="1" />
                  <rect
                    x={originX + plotPixelW / 2 - 50}
                    y={originY - 28}
                    width="100"
                    height="18"
                    rx="4"
                    fill="#FFFFFF"
                    stroke="#E4E7EC"
                  />
                  <text
                    x={originX + plotPixelW / 2}
                    y={originY - 15}
                    fill="#172033"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {width}'-0" Width
                  </text>
                </g>

                {/* Dimension 2: Depth dimension with pill */}
                <g>
                  <line x1={originX + plotPixelW + 16} y1={originY} x2={originX + plotPixelW + 16} y2={originY + plotPixelH} stroke="#667085" strokeWidth="1" />
                  <line x1={originX + plotPixelW + 10} y1={originY} x2={originX + plotPixelW + 22} y2={originY} stroke="#667085" strokeWidth="1" />
                  <line x1={originX + plotPixelW + 10} y1={originY + plotPixelH} x2={originX + plotPixelW + 22} y2={originY + plotPixelH} stroke="#667085" strokeWidth="1" />
                  <rect
                    x={originX + plotPixelW + 22}
                    y={originY + plotPixelH / 2 - 10}
                    width="95"
                    height="20"
                    rx="4"
                    fill="#FFFFFF"
                    stroke="#E4E7EC"
                  />
                  <text
                    x={originX + plotPixelW + 70}
                    y={originY + plotPixelH / 2 + 4}
                    fill="#172033"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {depth}'-0" Depth
                  </text>
                </g>

                {/* Setback dimension labels with background pills */}
                {showSetbacks && (
                  <>
                    <rect
                      x={buildableX + buildableW / 2 - 45}
                      y={originY + 6}
                      width="90"
                      height="16"
                      rx="3"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={buildableX + buildableW / 2}
                      y={originY + 18}
                      fill="#667085"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      Rear: {setbacks.rear} ft
                    </text>

                    <rect
                      x={buildableX + buildableW / 2 - 45}
                      y={originY + plotPixelH - 22}
                      width="90"
                      height="16"
                      rx="3"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={buildableX + buildableW / 2}
                      y={originY + plotPixelH - 10}
                      fill="#667085"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      Front: {setbacks.front} ft
                    </text>

                    <rect
                      x={originX + 4}
                      y={buildableY + buildableH / 2 - 8}
                      width="42"
                      height="16"
                      rx="3"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={originX + 25}
                      y={buildableY + buildableH / 2 + 4}
                      fill="#667085"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {setbacks.left} ft
                    </text>

                    <rect
                      x={originX + plotPixelW - 46}
                      y={buildableY + buildableH / 2 - 8}
                      width="42"
                      height="16"
                      rx="3"
                      fill="#FFFFFF"
                      stroke="#E4E7EC"
                    />
                    <text
                      x={originX + plotPixelW - 25}
                      y={buildableY + buildableH / 2 + 4}
                      fill="#667085"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {setbacks.right} ft
                    </text>
                  </>
                )}

                {/* Primary Access Road at South */}
                <rect
                  x={originX - 25}
                  y={originY + plotPixelH + 12}
                  width={plotPixelW + 50}
                  height={44}
                  rx="6"
                  fill="#344054"
                />
                <line
                  x1={originX - 20}
                  y1={originY + plotPixelH + 34}
                  x2={originX + plotPixelW + 20}
                  y2={originY + plotPixelH + 34}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeDasharray="8 6"
                />
                <text
                  x={originX + plotPixelW / 2}
                  y={originY + plotPixelH + 28}
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  Primary Residential Access Street (50 ft Public ROW)
                </text>
              </svg>
            </div>

            {/* Bottom Controls Bar: Zoom, Reset, Coordinates */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] text-xs text-[#667085]">
              <span className="font-mono text-[11px]">
                Datum: {project.plot.coordinates || '30.2672° N, 97.7431° W (Austin Datum)'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1 rounded-md border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#172033]"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs w-10 text-center">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                  className="p-1 rounded-md border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#172033]"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-2 py-1 rounded-md border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-medium text-[#2563EB]"
                >
                  Fit to View
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Structured Site Intelligence Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Deterministic Metrics Box */}
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EC]">
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Site Metrics
                </span>
                <span className="text-[10px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#ABEFC6]">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[#667085] text-[11px]">Total Plot Area</div>
                  <div className="text-xl font-bold text-[#172033] mt-0.5 font-mono">
                    {area.toFixed(1)} m²
                  </div>
                  <div className="text-[10px] text-[#2563EB] mt-0.5 font-semibold">
                    [Deterministic calculation]
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[#667085] text-[11px]">Perimeter</div>
                  <div className="text-xl font-bold text-[#172033] mt-0.5 font-mono">
                    {perimeter.toFixed(1)} m
                  </div>
                  <div className="text-[10px] text-[#2563EB] mt-0.5 font-semibold">
                    [Deterministic calculation]
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[#667085] text-[11px]">Buildable Footprint</div>
                  <div className="text-xl font-bold text-[#2563EB] mt-0.5 font-mono">
                    {buildableArea.toFixed(1)} m²
                  </div>
                  <div className="text-[10px] text-[#027A48] mt-0.5 font-medium">
                    {((buildableArea / area) * 100).toFixed(0)}% max ground footprint
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                  <div className="text-[#667085] text-[11px]">Road Frontage</div>
                  <div className="text-xl font-bold text-[#172033] mt-0.5 font-mono">
                    {width}.0 m
                  </div>
                  <div className="text-[10px] text-[#667085] mt-0.5">
                    South facing access
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Observations List */}
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EC]">
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Site Insights & Constraints
                </span>
                <span className="text-xs text-[#667085]">
                  {project.observations.length} items
                </span>
              </div>

              <div className="space-y-2.5">
                {project.observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-3 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#172033]">{obs.title}</span>
                      {getSourceBadge(obs.source)}
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">{obs.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
