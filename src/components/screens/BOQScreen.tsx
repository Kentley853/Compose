import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { BOQItem } from '../../types/architecture';
import {
  Calculator,
  Download,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  MapPin,
  Sliders,
  DollarSign,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { exportBOQToCSV, downloadText } from '../../services/exportPackage';

export const BOQScreen: React.FC = () => {
  const {
    project,
    selectedLocation,
    setSelectedLocation,
    wasteFactor,
    setWasteFactor,
    setScreen,
    addToast,
  } = useProject();

  const [filterCategory, setFilterCategory] = useState<string>('all');

  // US Metropolitan construction cost regional multipliers
  const locationMultipliers: Record<string, { label: string; mult: number }> = {
    Austin: { label: 'Austin, TX (1.00x)', mult: 1.0 },
    Scottsdale: { label: 'Scottsdale / Phoenix, AZ (0.97x)', mult: 0.97 },
    Denver: { label: 'Denver / Front Range, CO (1.04x)', mult: 1.04 },
    Seattle: { label: 'Seattle Metro, WA (1.14x)', mult: 1.14 },
    'San Francisco': { label: 'San Francisco Bay Area, CA (1.28x)', mult: 1.28 },
  };

  const currentLocData = locationMultipliers[selectedLocation] || {
    label: `${selectedLocation} (1.00x)`,
    mult: 1.0,
  };
  const multiplier = currentLocData.mult;
  const wasteMultiplier = 1 + wasteFactor / 100;

  // Currency formatter adhering strictly to en-US currency formatting
  const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const formatUSD = (val: number) => usdFormatter.format(val);

  // Direct construction trade base
  const totalBaseCostUSD = project.boqItems.reduce(
    (acc: number, item: BOQItem) => acc + item.expectedEstimate,
    0
  );

  const directTradeSubtotal = totalBaseCostUSD * multiplier;
  const gcOverheadProfit = directTradeSubtotal * 0.12; // 12% GC Overhead & Profit
  const municipalPermitsFees = directTradeSubtotal * 0.04; // 4% City Permits & Utility Connections
  const contingencyBuffer = directTradeSubtotal * (wasteFactor / 100); // 5-15% Contingency
  const totalAdjustedUSD =
    directTradeSubtotal + gcOverheadProfit + municipalPermitsFees + contingencyBuffer;

  const grossAreaSF = project.requirements.targetBuiltUpArea || 3850;
  const costPerSqFt = Math.round(totalAdjustedUSD / grossAreaSF);

  const lowEstimate = totalAdjustedUSD * 0.92;
  const midEstimate = totalAdjustedUSD;
  const highEstimate = totalAdjustedUSD * 1.15;

  const categories = [
    'all',
    'Site work',
    'Concrete',
    'Framing',
    'Sheathing',
    'Roofing',
    'Insulation',
    'Drywall',
    'Doors & Windows',
    'Interior finishes',
    'Plumbing',
    'HVAC',
    'Electrical',
  ];

  const filteredItems = project.boqItems.filter((item: BOQItem) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'Doors & Windows') {
      return (
        item.category === 'Doors' ||
        item.category === 'Windows' ||
        item.category === 'Doors and windows'
      );
    }
    return item.category.toLowerCase() === filterCategory.toLowerCase();
  });

  const handleExportCSV = () => {
    const csvContent = exportBOQToCSV(project.boqItems);
    downloadText(csvContent, `${project.identity.name}_BOQ_Estimate_USD.csv`, 'text/csv');
    addToast('BOQ CSV Exported', 'Comprehensive bill of quantities downloaded for estimator spreadsheet review.', 'success');
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-fluid-xl font-bold text-[#172033] tracking-tight">Preliminary Cost & BOQ</h1>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {currentLocData.label}
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Deterministic bill of quantities calculated from spatial geometry, RSMeans Q1 2025 US indices, and trade division items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#172033] flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#027A48]" />
              <span>Export CSV (USD)</span>
            </button>

            <button
              id="btn-goto-deliverables-from-boq"
              onClick={() => setScreen('deliverables')}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Export Deliverables Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cost Range Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Conservative Low Range</div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">{formatUSD(lowEstimate)}</div>
            <div className="text-[11px] text-[#667085] mt-1">-8% trade efficiency benchmark</div>
          </div>

          <div className="p-4 rounded-xl bg-white border-[#2563EB] border shadow-xs ring-2 ring-[#2563EB]/10">
            <div className="text-xs text-[#2563EB] font-semibold flex items-center justify-between">
              <span>Expected Mid Estimate</span>
              <span className="text-[10px] font-semibold bg-[#EEF4FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                TARGET
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">{formatUSD(midEstimate)}</div>
            <div className="text-[11px] text-[#667085] mt-1">{currentLocData.label}</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Upper Buffer Range</div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">{formatUSD(highEstimate)}</div>
            <div className="text-[11px] text-[#667085] mt-1">+15% material escalation reserve</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Estimated Cost / Sq Ft</div>
            <div className="text-xl sm:text-2xl font-bold text-[#027A48] mt-1 font-mono">
              ${costPerSqFt}/sq ft
            </div>
            <div className="text-[11px] text-[#667085] mt-1">Based on {grossAreaSF.toLocaleString()} sq ft GFA</div>
          </div>
        </div>

        {/* Control Bar: Location & Waste/Contingency Slider */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-[#E4E7EC] rounded-xl shadow-xs text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Regional Index Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-[#667085] font-semibold text-xs">US Metro Market:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none font-medium"
              >
                <option value="Austin">Austin, TX (1.00x Index)</option>
                <option value="Scottsdale">Scottsdale / Phoenix, AZ (0.97x Index)</option>
                <option value="Denver">Denver / Boulder, CO (1.04x Index)</option>
                <option value="Seattle">Seattle Metro, WA (1.14x Index)</option>
                <option value="San Francisco">San Francisco Bay Area, CA (1.28x Index)</option>
              </select>
            </div>

            {/* Waste & Contingency Factor Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[#667085] font-semibold text-xs">Contingency & Waste:</span>
              <input
                type="range"
                min="5"
                max="15"
                step="1"
                value={wasteFactor}
                onChange={(e) => setWasteFactor(parseInt(e.target.value))}
                className="w-24 accent-[#2563EB] cursor-pointer"
              />
              <span className="text-[#2563EB] font-mono font-bold">{wasteFactor}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <span className="font-semibold text-[#172033]">Currency:</span>
            <span className="px-2 py-0.5 rounded bg-[#ECFDF3] text-[#027A48] font-bold font-mono border border-[#ABEFC6]">
              USD ($)
            </span>
          </div>
        </div>

        {/* Cost Breakdown Cards (Taxes, Fees, GC O&P Separated) */}
        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs space-y-3 text-xs">
          <span className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
            Cost Composition & Fee Structure
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
              <span className="text-[#667085] block text-[11px]">Direct Trade Labor & Material</span>
              <span className="text-sm font-bold text-[#172033] mt-1 block">
                {formatUSD(directTradeSubtotal)}
              </span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
              <span className="text-[#667085] block text-[11px]">GC Overhead & Profit (12%)</span>
              <span className="text-sm font-bold text-[#172033] mt-1 block">
                {formatUSD(gcOverheadProfit)}
              </span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
              <span className="text-[#667085] block text-[11px]">City Permits & Utility Tap (4%)</span>
              <span className="text-sm font-bold text-[#172033] mt-1 block">
                {formatUSD(municipalPermitsFees)}
              </span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
              <span className="text-[#667085] block text-[11px]">Design & Waste Contingency ({wasteFactor}%)</span>
              <span className="text-sm font-bold text-[#2563EB] mt-1 block">
                {formatUSD(contingencyBuffer)}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-md capitalize transition-colors text-xs font-medium ${
                filterCategory === cat
                  ? 'bg-[#EEF4FF] text-[#2563EB] border border-[#2563EB]/20 font-semibold'
                  : 'bg-white text-[#667085] hover:text-[#172033] border border-[#E4E7EC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* BOQ Schedule Table */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[48rem] text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#667085] text-[11px] uppercase font-semibold border-b border-[#E4E7EC]">
                <tr>
                  <th className="py-3 px-4">Trade & Item Description</th>
                  <th className="py-3 px-3">CSI Division</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-2">Unit</th>
                  <th className="py-3 px-3 text-right">Unit Rate (USD)</th>
                  <th className="py-3 px-4 text-right">Subtotal (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] text-[#344054] text-xs">
                {filteredItems.map((item: BOQItem) => {
                  const itemAdjustedRate = item.unitRate * multiplier;
                  const itemAdjustedTotal = item.expectedEstimate * multiplier;
                  return (
                    <tr key={item.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-medium text-[#172033]">{item.item}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#172033]">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-[#667085] font-mono text-[11px]">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#667085]">
                        {formatUSD(itemAdjustedRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#172033]">
                        {formatUSD(itemAdjustedTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#F9FAFB] text-[#172033] font-bold border-t border-[#E4E7EC] text-xs font-mono">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-[#667085]">
                    Total Direct Trade Construction Subtotal:
                  </td>
                  <td className="py-3.5 px-4 text-right text-sm text-[#172033]">
                    {formatUSD(directTradeSubtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-[#667085]">
                    Total Estimated Project Budget (All Fees & Contingencies):
                  </td>
                  <td className="py-3.5 px-4 text-right text-base text-[#2563EB]">
                    {formatUSD(totalAdjustedUSD)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-[#FFF4ED] border border-[#FECDCA] flex items-start gap-3 text-xs text-[#B54708]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#F79009]" />
          <p className="leading-relaxed">
            <strong>Approximate Budgetary Estimation:</strong> Unit rates and trade quantities are derived from architectural geometry and RSMeans residential historical indices. Actual bids vary by site-specific soil conditions, local municipal tap fees, utility extensions, and subcontractor availability. This output does not constitute a guaranteed maximum price (GMP) or contractor bid.
          </p>
        </div>
      </div>
    </div>
  );
};
