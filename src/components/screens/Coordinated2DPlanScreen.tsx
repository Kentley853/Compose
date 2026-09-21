import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FileCode2,
  Box,
  Layers,
  ArrowRight,
  RefreshCw,
  Download,
  Printer,
  Compass,
  Sliders,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { generatePlanSVG, downloadText } from '../../services/exportPackage';

export const Coordinated2DPlanScreen: React.FC = () => {
  const {
    project,
    activeFloor,
    setActiveFloor,
    regenerateDependentViews,
    setScreen,
    addToast,
  } = useProject();

  // Layer toggles
  const [layers, setLayers] = useState({
    walls: true,
    dimensions: true,
    openings: true,
    circulation: true,
    furniture: true,
    labels: true,
    grid: true,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentAlternative =
    project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
    project.alternatives[0];

  const currentRooms = currentAlternative.rooms.filter((r) => r.floor === activeFloor);

  const svgWidth = 640;
  const svgHeight = 720;

  // Compute bounding box and auto-scale dynamically so drawing never overflows and text stays legible
  const layoutMetrics = useMemo(() => {
    if (currentRooms.length === 0) {
      return { scale: 10, originX: 80, originY: 80, plotW: 460, plotH: 520, maxCoordX: 46, maxCoordY: 54 };
    }
    const maxCoordX = Math.max(...currentRooms.map((r) => r.x + r.width), 48);
    const maxCoordY = Math.max(...currentRooms.map((r) => r.y + r.height), 54);

    const availWidth = 470;
    const availHeight = 490;
    const scale = Math.min(availWidth / maxCoordX, availHeight / maxCoordY);
    const plotW = maxCoordX * scale;
    const plotH = maxCoordY * scale;
    const originX = (svgWidth - plotW) / 2;
    const originY = 75;

    return { scale, originX, originY, plotW, plotH, maxCoordX, maxCoordY };
  }, [currentRooms]);

  const { scale, originX, originY, plotW, plotH, maxCoordX, maxCoordY } = layoutMetrics;

  const handleDownloadSVG = () => {
    const svgContent = generatePlanSVG(project, activeFloor);
    downloadText(svgContent, `${project.identity.name}_Plan_L${activeFloor}.svg`, 'image/svg+xml');
    addToast('SVG Downloaded', `Sheet A-10${activeFloor} exported as clean CAD vector.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-fluid-xl font-bold text-[#172033] tracking-tight">Coordinated 2D Architectural Plan</h1>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                Sheet A-10{activeFloor} • Scale 1/8" = 1'-0"
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Precision architectural drafting conventions, door swings, dimension witness lines, and coordinated title block.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#172033] flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#667085]" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleDownloadSVG}
              className="px-3.5 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Vector SVG</span>
            </button>

            <button
              onClick={() => setScreen('coordinated3d')}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Switch to 3D</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sync Prompt if views outdated */}
        {project.dependentOutputsOutdated && (
          <div className="p-3 bg-[#FFF4ED] border border-[#FECDCA] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#B54708]">
            <div className="flex items-start sm:items-center gap-2">
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 animate-spin text-[#F79009]" />
              <span>
                <strong>Plan Outdated:</strong> Space schedule or dimensions were modified. Synchronize drawing sheet now.
              </span>
            </div>
            <button
              onClick={regenerateDependentViews}
              className="shrink-0 self-start sm:self-auto px-3 py-1.5 bg-[#F79009] hover:bg-[#DC6803] text-white rounded-lg font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              Synchronize 2D Plan
            </button>
          </div>
        )}

        {/* Toolbar: Level Selector & Layer Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E4E7EC] rounded-xl shadow-xs text-xs">
          {/* Floor Level Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#667085]">Sheet:</span>
            <div className="flex bg-[#F2F4F7] p-1 rounded-lg">
              <button
                onClick={() => setActiveFloor(1)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeFloor === 1
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <span className="hidden sm:inline">Ground Floor (A-101)</span>
                <span className="sm:hidden">A-101</span>
              </button>
              <button
                onClick={() => setActiveFloor(2)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeFloor === 2
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                <span className="hidden sm:inline">Second Level (A-102)</span>
                <span className="sm:hidden">A-102</span>
              </button>
            </div>
          </div>

          {/* Layer Checkboxes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#667085] text-[11px] font-medium mr-1 uppercase">Layers:</span>
            {(['walls', 'dimensions', 'openings', 'circulation', 'furniture', 'labels', 'grid'] as (keyof typeof layers)[]).map(
              (layer) => (
                <button
                  key={layer}
                  onClick={() => toggleLayer(layer)}
                  className={`px-2.5 py-1 rounded-md text-xs capitalize transition-colors font-medium ${
                    layers[layer]
                      ? 'bg-[#EEF4FF] text-[#2563EB] border border-[#2563EB]/20 font-semibold'
                      : 'bg-[#F9FAFB] text-[#667085] border border-[#E4E7EC] hover:text-[#172033]'
                  }`}
                >
                  {layer}
                </button>
              )
            )}
          </div>
        </div>

        {/* CAD White Drafting Sheet Container */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-3 sm:p-5 lg:p-7 shadow-xs relative flex flex-col items-center">
          {/* Top Drawing Meta Header */}
          <div className="w-full max-w-3xl flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 mb-2 border-b border-[#E4E7EC] text-xs text-[#667085]">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-[#172033]">{project.identity.name}</span>
              <span aria-hidden="true">•</span>
              <span className="font-medium">
                {activeFloor === 1 ? 'Ground Level Architectural Plan' : 'Second Level Floor Plan'}
              </span>
              <span aria-hidden="true">•</span>
              <span className="text-[#2563EB] font-mono font-semibold whitespace-nowrap">
                Scale 1/8" = 1'-0"
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
              <span className="px-2 py-0.5 rounded bg-[#F2F4F7] text-[#344054] font-semibold">
                Rev: {project.activeRevision}
              </span>
              <span className="text-[#027A48] font-medium">Permit Feasibility</span>
            </div>
          </div>

          {/* SVG Vector Drawing */}
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-3xl max-h-[60vh] sm:max-h-[40rem] bg-white select-none">
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="0.6" fill="#CBD5E1" />
              </pattern>
            </defs>

            {/* Grid lines */}
            {layers.grid && <rect width={svgWidth} height={svgHeight} fill="url(#cadGrid)" />}

            {/* Setback / Building Envelope Boundary */}
            <rect
              x={originX - 12}
              y={originY - 12}
              width={plotW + 24}
              height={plotH + 24}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />
            <text
              x={originX}
              y={originY - 16}
              fill="#94A3B8"
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="600"
            >
              BUILDING SETBACK ENVELOPE
            </text>

            {/* Structural Column Grids (A, B, C) */}
            <g opacity="0.65">
              <line x1={originX} y1={originY - 26} x2={originX} y2={originY + plotH + 20} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="6 4" />
              <line x1={originX + plotW / 2} y1={originY - 26} x2={originX + plotW / 2} y2={originY + plotH + 20} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="6 4" />
              <line x1={originX + plotW} y1={originY - 26} x2={originX + plotW} y2={originY + plotH + 20} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="6 4" />

              <circle cx={originX} cy={originY - 32} r="7" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.2" />
              <text x={originX} y={originY - 29} fill="#2563EB" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">A</text>

              <circle cx={originX + plotW / 2} cy={originY - 32} r="7" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.2" />
              <text x={originX + plotW / 2} y={originY - 29} fill="#2563EB" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">B</text>

              <circle cx={originX + plotW} cy={originY - 32} r="7" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.2" />
              <text x={originX + plotW} y={originY - 29} fill="#2563EB" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">C</text>
            </g>

            {/* North Arrow Callout */}
            <g transform={`translate(${originX + plotW - 15}, ${originY - 45})`}>
              <circle cx="0" cy="0" r="12" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <polygon points="0,-9 -4,3 0,0" fill="#2563EB" />
              <polygon points="0,-9 4,3 0,0" fill="#94A3B8" />
              <text x="0" y="10" fill="#172033" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">N</text>
            </g>

            {/* Rooms Geometry & Architectural Walls */}
            {currentRooms.map((room) => {
              const rx = originX + room.x * scale;
              const ry = originY + room.y * scale;
              const rw = room.width * scale;
              const rh = room.height * scale;

              // Collision-safe pill calculations
              const nameLen = room.name.length;
              const pillW = Math.min(rw - 8, Math.max(52, nameLen * 6.2 + 12));
              const canFitTwoLines = rh >= 40 && rw >= 56;
              const pillH = canFitTwoLines ? 25 : 15;
              const pillX = rx + (rw - pillW) / 2;
              const pillY = ry + (rh - pillH) / 2;

              return (
                <g key={room.id}>
                  {/* Floor Slab Wash */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    fill={room.zone === 'Outdoor' ? '#F0FDF4' : room.zone === 'Service' ? '#F8FAFC' : '#FAFAFA'}
                    stroke={layers.walls ? '#1E293B' : 'transparent'}
                    strokeWidth={layers.walls ? '2' : '0'}
                  />

                  {/* Furniture Footprints (Subtle Architectural Indication) */}
                  {layers.furniture && rw > 40 && rh > 35 && (
                    <g opacity="0.35">
                      {room.name.toLowerCase().includes('great room') || room.name.toLowerCase().includes('living') ? (
                        <rect x={rx + 10} y={ry + 10} width={rw - 20} height={Math.min(22, rh - 20)} rx="3" fill="none" stroke="#64748B" strokeWidth="1" />
                      ) : room.name.toLowerCase().includes('dining') ? (
                        <rect x={rx + 12} y={ry + 12} width={rw - 24} height={rh - 24} rx="3" fill="none" stroke="#64748B" strokeWidth="1" />
                      ) : room.name.toLowerCase().includes('bed') ? (
                        <rect x={rx + rw - Math.min(42, rw - 10)} y={ry + 8} width={Math.min(36, rw - 14)} height={Math.min(44, rh - 16)} rx="2" fill="none" stroke="#64748B" strokeWidth="1" />
                      ) : null}
                    </g>
                  )}

                  {/* Openings: Door Swings & Window Glazing */}
                  {layers.openings && (
                    <g>
                      {/* Door swing arc (only if room has doors defined or standard room) */}
                      {rw > 45 && rh > 45 && (
                        <g opacity="0.85">
                          <path
                            d={`M ${rx + 4} ${ry + rh} A 18 18 0 0 1 ${rx + 22} ${ry + rh - 18}`}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <line x1={rx + 4} y1={ry + rh} x2={rx + 4} y2={ry + rh - 18} stroke="#2563EB" strokeWidth="1.6" />
                        </g>
                      )}

                      {/* Window Glazing Line on exterior perimeter */}
                      {room.openings?.windows && room.openings.windows.length > 0 && (
                        <line
                          x1={rx + 6}
                          y1={ry}
                          x2={rx + rw - 6}
                          y2={ry}
                          stroke="#0284C7"
                          strokeWidth="3"
                          strokeLinecap="square"
                        />
                      )}
                    </g>
                  )}

                  {/* Collision-Free Room Tag Pill */}
                  {layers.labels && pillW > 20 && (
                    <g>
                      {/* Crisp white backdrop pill to guarantee text readability */}
                      <rect
                        x={pillX}
                        y={pillY}
                        width={pillW}
                        height={pillH}
                        rx="3"
                        fill="#FFFFFF"
                        stroke="#E2E8F0"
                        strokeWidth="0.8"
                      />
                      {canFitTwoLines ? (
                        <>
                          <text
                            x={rx + rw / 2}
                            y={pillY + 10}
                            fill="#0F172A"
                            fontSize={rw < 64 ? '8' : '9'}
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="sans-serif"
                          >
                            {room.name}
                          </text>
                          <text
                            x={rx + rw / 2}
                            y={pillY + 20}
                            fill="#64748B"
                            fontSize="7.5"
                            fontWeight="600"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {Math.round(room.area)} sq ft
                          </text>
                        </>
                      ) : (
                        <text
                          x={rx + rw / 2}
                          y={pillY + 11}
                          fill="#0F172A"
                          fontSize={rw < 50 ? '7' : '8'}
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {room.name}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Circulation Vectors */}
            {layers.circulation && activeFloor === 1 && (
              <g>
                <g transform={`translate(${originX + 80}, ${originY + plotH + 6})`}>
                  <line x1="0" y1="28" x2="0" y2="4" stroke="#2563EB" strokeWidth="2" />
                  <polygon points="0,0 -3,7 3,7" fill="#2563EB" />
                  <text x="8" y="18" fill="#2563EB" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    MAIN ENTRY
                  </text>
                </g>

                {/* Stair Tread Graphic */}
                <g transform={`translate(${originX + plotW / 2 - 20}, ${originY + 140})`}>
                  <rect width="36" height="50" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" rx="2" />
                  {[10, 20, 30, 40].map((stepY) => (
                    <line key={stepY} x1="0" y1={stepY} x2="36" y2={stepY} stroke="#CBD5E1" strokeWidth="1" />
                  ))}
                  <line x1="18" y1="44" x2="18" y2="10" stroke="#2563EB" strokeWidth="1.4" />
                  <polygon points="18,6 14,13 22,13" fill="#2563EB" />
                  <text x="22" y="30" fill="#2563EB" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    UP
                  </text>
                </g>
              </g>
            )}

            {/* Exterior CAD Dimension Witness Lines */}
            {layers.dimensions && (
              <g opacity="0.9">
                {/* Left side overall depth string */}
                <line x1={originX - 26} y1={originY} x2={originX - 26} y2={originY + plotH} stroke="#64748B" strokeWidth="1" />
                <line x1={originX - 32} y1={originY} x2={originX - 20} y2={originY} stroke="#64748B" strokeWidth="1" />
                <line x1={originX - 32} y1={originY + plotH} x2={originX - 20} y2={originY + plotH} stroke="#64748B" strokeWidth="1" />
                <rect
                  x={originX - 44}
                  y={originY + plotH / 2 - 30}
                  width="18"
                  height="60"
                  rx="3"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                />
                <text
                  x={originX - 34}
                  y={originY + plotH / 2}
                  fill="#172033"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  transform={`rotate(-90 ${originX - 34} ${originY + plotH / 2})`}
                  textAnchor="middle"
                >
                  {Math.round(maxCoordY)}'-0"
                </text>

                {/* Bottom side overall width string */}
                <line x1={originX} y1={originY + plotH + 28} x2={originX + plotW} y2={originY + plotH + 28} stroke="#64748B" strokeWidth="1" />
                <line x1={originX} y1={originY + plotH + 22} x2={originX} y2={originY + plotH + 34} stroke="#64748B" strokeWidth="1" />
                <line x1={originX + plotW} y1={originY + plotH + 22} x2={originX + plotW} y2={originY + plotH + 34} stroke="#64748B" strokeWidth="1" />
                <rect
                  x={originX + plotW / 2 - 32}
                  y={originY + plotH + 20}
                  width="64"
                  height="16"
                  rx="3"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                />
                <text
                  x={originX + plotW / 2}
                  y={originY + plotH + 31}
                  fill="#172033"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {Math.round(maxCoordX)}'-0"
                </text>
              </g>
            )}

            {/* Professional Architectural Title Block (Bottom Right) */}
            <g transform={`translate(${svgWidth - 230}, ${svgHeight - 95})`}>
              <rect width="220" height="85" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" rx="4" />
              <line x1="0" y1="28" x2="220" y2="28" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="0" y1="56" x2="220" y2="56" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="130" y1="28" x2="130" y2="85" stroke="#CBD5E1" strokeWidth="1" />

              <text x="10" y="18" fill="#172033" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                COMPOSE AI ARCHITECTURE
              </text>
              <text x="10" y="44" fill="#667085" fontSize="8" fontFamily="sans-serif">
                SHEET: <tspan fill="#172033" fontWeight="bold">A-10{activeFloor}</tspan>
              </text>
              <text x="140" y="44" fill="#667085" fontSize="8" fontFamily="sans-serif">
                REV: <tspan fill="#2563EB" fontWeight="bold">{project.activeRevision}</tspan>
              </text>
              <text x="10" y="72" fill="#B54708" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
                CONCEPTUAL • QUALIFIED REVIEW REQ.
              </text>
              <text x="140" y="72" fill="#667085" fontSize="8" fontFamily="sans-serif">
                SCALE: 1/8"=1'
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
