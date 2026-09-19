import JSZip from 'jszip';
import { ProjectData } from '../types/architecture';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, filename);
}

export function generateBOQCSV(project: ProjectData): string {
  const headers = ['Category', 'Item Description', 'Unit', 'Quantity', 'Unit Rate (USD)', 'Total Estimate (USD)', 'Source', 'Confidence'];
  const rows = project.boqItems.map((item) => [
    `"${item.category}"`,
    `"${item.item}"`,
    `"${item.unit}"`,
    item.quantity,
    item.unitRate,
    item.expectedEstimate,
    `"${item.source}"`,
    `"${item.confidence}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportBOQToCSV(items: any[]): string {
  const headers = ['Category', 'Item Description', 'Unit', 'Quantity', 'Unit Rate', 'Total Estimate', 'Source', 'Confidence'];
  const rows = items.map((item) => [
    `"${item.category || ''}"`,
    `"${item.item || ''}"`,
    `"${item.unit || ''}"`,
    item.quantity || 0,
    item.unitRate || 0,
    item.expectedEstimate || 0,
    `"${item.source || ''}"`,
    `"${item.confidence || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportProjectJSON(project: ProjectData): string {
  return JSON.stringify(project, null, 2);
}

export function exportProjectMarkdown(project: ProjectData): string {
  return generateArchitecturalBriefMarkdown(project) + '\n\n' + generateComplianceMarkdown(project);
}

export function generateComplianceMarkdown(project: ProjectData): string {
  const lines: string[] = [
    `# Preliminary Statutory Compliance Report`,
    `**Project**: ${project.identity.name}`,
    `**Revision**: ${project.activeRevision}`,
    `**Location**: ${project.identity.location}`,
    `**Date**: ${new Date().toLocaleDateString()}`,
    `\n> **Statutory Advisory**: Preliminary automated screening for conceptual design. Professional review required by a registered architect or structural engineer.\n`,
    `| Parameter & Rule | Category | Status | Explanation | Recommended Action | Source |`,
    `|---|---|---|---|---|---|`,
  ];

  project.complianceChecks.forEach((c) => {
    lines.push(`| ${c.name} | ${c.category} | **${c.status}** | ${c.explanation} | ${c.recommendedAction} | ${c.source} |`);
  });

  return lines.join('\n');
}

export function generateArchitecturalBriefMarkdown(project: ProjectData): string {
  const b = project.brief;
  return `# Architectural Design Brief — ${project.identity.name}
**Revision**: ${b.revision}  
**Location**: ${project.identity.location}  
**Target Built-Up Area**: ${project.requirements.targetBuiltUpArea.toLocaleString()} sq ft  
**Plot Dimensions**: ${project.plot.width}'-0" × ${project.plot.depth}'-0" (${project.plot.area.toLocaleString()} sq ft)  

---

## 1. Project Objectives
${b.projectObjectives.map((o) => `- ${o}`).join('\n')}

## 2. Occupant Profile
${b.occupantProfile}

## 3. Programmatic Space Schedule
| Space Name | Target Area | Level | Spatial Zone |
|---|---|---|---|
${b.spaceRequirements.map((s) => `| ${s.room} | ${s.targetArea.toLocaleString()} sq ft | Level ${s.floor} | ${s.zone} |`).join('\n')}

## 4. Passive Environmental & Orientation Strategy
- **Daylight Priorities**: ${b.daylightPriorities.join(', ')}
- **Ventilation Priorities**: ${b.ventilationPriorities.join(', ')}
- **Circulation Strategy**: ${b.circulationStrategy}

## 5. Architectural Assumptions & Disclaimers
${b.designAssumptions.map((a) => `- ${a}`).join('\n')}

*Conceptual output requiring review by a qualified professional.*
`;
}

export function generatePlanSVG(project: ProjectData, floor: 1 | 2 = 1): string {
  const alt = project.alternatives.find((a) => a.id === project.activeAlternativeId) || project.alternatives[0];
  const rooms = alt.rooms.filter((r) => r.floor === floor);
  
  const svgW = 750;
  const svgH = 900;
  const padding = 70;
  const availW = svgW - padding * 2;
  const availH = svgH - padding * 2;
  const scale = Math.min(availW / (project.plot.width || 60), availH / (project.plot.depth || 120));

  let roomsSVG = '';
  rooms.forEach((r) => {
    const rx = padding + r.x * scale;
    const ry = padding + r.y * scale;
    const rw = r.width * scale;
    const rh = r.height * scale;
    roomsSVG += `
      <g id="${r.id}">
        <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#f8fafc" stroke="#1e293b" stroke-width="2" rx="3" />
        <text x="${rx + rw / 2}" y="${ry + rh / 2 - 4}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">${r.name}</text>
        <text x="${rx + rw / 2}" y="${ry + rh / 2 + 10}" font-family="monospace" font-size="9" fill="#64748b" text-anchor="middle">${Math.round(r.area)} sq ft</text>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  <!-- Boundary -->
  <rect x="${padding}" y="${padding}" width="${project.plot.width * scale}" height="${project.plot.depth * scale}" fill="none" stroke="#94a3b8" stroke-dasharray="4,4" stroke-width="1.5" />
  <text x="${padding}" y="${padding - 20}" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">${project.identity.name} — Level ${floor} Floor Plan (${alt.name})</text>
  <text x="${padding}" y="${svgH - 25}" font-family="sans-serif" font-size="10" fill="#94a3b8">Compose AI Architectural Platform • ${project.activeRevision} • Austin / US Residential Code Benchmark</text>
  ${roomsSVG}
</svg>`;
}

export { generateProjectPresentationPDF, exportPresentationPDF } from './pdfExport';
export type { PDFExportOptions } from './pdfExport';

export async function generateAndDownloadProjectZip(project: ProjectData): Promise<void> {
  const zip = new JSZip();

  // 1. Project Manifest
  const manifest = {
    projectName: project.identity.name,
    projectLocation: project.identity.location,
    currentRevision: project.activeRevision,
    exportTimestamp: new Date().toISOString(),
    generator: 'Compose AI Studio v2.4 (Figma Architecture Engine)',
    plot: project.plot,
    requirements: project.requirements,
    activeAlternative: project.alternatives.find((a) => a.id === project.activeAlternativeId),
    summary: {
      grossArea: project.requirements.targetBuiltUpArea,
      bedrooms: project.requirements.bedrooms,
      bathrooms: project.requirements.bathrooms,
      floors: project.requirements.floors,
    },
  };
  zip.file('project-manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Architectural Brief
  zip.file('01_Architectural_Brief.md', generateArchitecturalBriefMarkdown(project));

  // 3. 2D Floor Plans
  const plansFolder = zip.folder('02_Coordinated_Plans');
  if (plansFolder) {
    plansFolder.file('Ground_Floor_Plan_L1.svg', generatePlanSVG(project, 1));
    plansFolder.file('First_Floor_Plan_L2.svg', generatePlanSVG(project, 2));
    plansFolder.file(
      'CAD_Exchange_Geometry.dxf',
      `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nTEXT\n1\n${project.identity.name} - ${project.activeRevision}\n0\nENDSEC\n0\nEOF\n`
    );
  }

  // 4. Compliance Report
  const complianceFolder = zip.folder('03_Statutory_Compliance');
  if (complianceFolder) {
    complianceFolder.file('Preliminary_Compliance_Matrix.md', generateComplianceMarkdown(project));
    complianceFolder.file('Compliance_Checks.json', JSON.stringify(project.complianceChecks, null, 2));
  }

  // 5. BOQ and Cost Data
  const boqFolder = zip.folder('04_BOQ_and_Costing');
  if (boqFolder) {
    boqFolder.file('Preliminary_BOQ_Schedule.csv', generateBOQCSV(project));
    boqFolder.file('Cost_Items.json', JSON.stringify(project.boqItems, null, 2));
  }

  // 6. Source Files Manifest
  const filesFolder = zip.folder('05_Source_Documents');
  if (filesFolder) {
    const fileListText = project.uploads
      .map((u) => `File: ${u.name} | Category: ${u.category || u.type} | Size: ${u.size} | Status: ${u.status}`)
      .join('\n');
    filesFolder.file('Uploaded_Files_Index.txt', fileListText || 'No external files ingested.');
  }

  // Generate blob & download
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${project.identity.name.replace(/\s+/g, '_')}_${project.activeRevision}_Package.zip`;
  downloadBlob(content, filename);
}
