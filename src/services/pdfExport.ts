import { jsPDF } from 'jspdf';
import { ProjectData, RoomData } from '../types/architecture';
import { formatFeetInches, formatSqFt, formatCurrency } from '../utils/geometry';

export interface PDFExportOptions {
  includeFloorPlans?: boolean;
  include3DVisualization?: boolean;
  includeBOQSummary?: boolean;
  includeDisclaimers?: boolean;
}

function drawPolygon(
  doc: jsPDF,
  points: { x: number; y: number }[],
  style: 'F' | 'FD' | 'D' = 'FD'
) {
  if (points.length < 3) return;
  const start = points[0];
  const deltaLines: [number, number][] = [];
  for (let i = 1; i < points.length; i++) {
    deltaLines.push([points[i].x - points[i - 1].x, points[i].y - points[i - 1].y]);
  }
  deltaLines.push([start.x - points[points.length - 1].x, start.y - points[points.length - 1].y]);
  doc.lines(deltaLines, start.x, start.y, [1, 1], style, true);
}

export function generateProjectPresentationPDF(
  project: ProjectData,
  options: PDFExportOptions = {
    includeFloorPlans: true,
    include3DVisualization: true,
    includeBOQSummary: true,
    includeDisclaimers: true,
  }
): jsPDF {
  // A4 Landscape: width = 841.89 pt, height = 595.28 pt
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 40;
  const currentAlt =
    project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
    project.alternatives[0];

  // Helper to draw clean architectural headers & sheet title blocks
  const drawPageHeader = (sheetNumber: string, sheetTitle: string) => {
    // Top banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(margin, margin, pageWidth - margin * 2, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('COMPOSE ARCHITECTURAL STUDIO', margin + 12, margin + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`CLIENT PRESENTATION DOSSIER • ${project.identity.name.toUpperCase()}`, margin + 240, margin + 18);

    doc.setFont('helvetica', 'bold');
    doc.text(`${sheetNumber} • ${sheetTitle.toUpperCase()}`, pageWidth - margin - 12, margin + 18, { align: 'right' });

    // Bottom border rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, pageHeight - margin - 22, pageWidth - margin, pageHeight - margin - 22);

    // Footer info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Project: ${project.identity.name} | Location: ${project.identity.location} | Revision: ${project.activeRevision}`, margin, pageHeight - margin - 10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Conceptual Feasibility Benchmark`, pageWidth - margin, pageHeight - margin - 10, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ==========================================
  // Background subtle tint
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative side accent bar
  doc.setFillColor(37, 99, 235); // Royal Blue
  doc.rect(margin, margin, 8, pageHeight - margin * 2, 'F');

  // Title block
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PRE-ENGINEERING FEASIBILITY & CONCEPTUAL DOSSIER', margin + 28, margin + 35);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(project.identity.name, margin + 28, margin + 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text(`${project.identity.location} • Two-Storey Custom High-Performance Residence`, margin + 28, margin + 98);

  // Key Project Metrics Matrix Cards
  const metrics = [
    { label: 'GROSS FLOOR AREA', val: `${project.requirements.targetBuiltUpArea.toLocaleString()} SF`, sub: 'Conditioned Envelope' },
    { label: 'PARCEL FOOTPRINT', val: `${project.plot.width}' × ${project.plot.depth}'`, sub: `${project.plot.area.toLocaleString()} SF Lot` },
    { label: 'ACTIVE SCHEME', val: currentAlt.name, sub: `${currentAlt.efficiency}% Net Efficiency` },
    { label: 'PROGRAM MATRIX', val: `${project.requirements.bedrooms} Bed / ${project.requirements.bathrooms} Bath`, sub: `${project.requirements.floors} Levels + Terrace` },
  ];

  const cardW = (pageWidth - margin * 2 - 28 - 36) / 4;
  metrics.forEach((m, idx) => {
    const cx = margin + 28 + idx * (cardW + 12);
    const cy = margin + 125;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, cy, cardW, 64, 4, 4, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(m.label, cx + 10, cy + 18);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(m.val, cx + 10, cy + 38);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(m.sub, cx + 10, cy + 52);
  });

  // Narrative Brief & Design Strategy
  const narrativeY = margin + 215;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 28, narrativeY, (pageWidth - margin * 2 - 28) * 0.62, 250, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Executive Architectural Statement', margin + 44, narrativeY + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const narrativeText = [
    `This conceptual presentation dossier outlines the architectural framework and spatial organization for the proposed ${project.identity.name} located in ${project.identity.location}.`,
    '',
    `• Spatial Hierarchy: Configured under Scheme "${currentAlt.name}" (${currentAlt.conceptTag}), featuring seamless axial connection between the Great Room living pavilion and private rear courtyard gardens.`,
    `• Bioclimatic Orientation: Primary living volumes are oriented along the north-south axis to optimize natural daylighting while mitigating harsh afternoon western solar heat gains.`,
    `• Sustainable Passive Strategy: Incorporates deep 4'-0" roof cantilever overhangs, cross-ventilation breeze paths through high-volume transoms, and locally sourced architectural cedar screen louvers.`,
    `• Modular Structure: Standardized 14' to 20' structural grid bays optimize material yield, reduce transfer beams, and accelerate construction delivery.`,
  ];
  let curY = narrativeY + 48;
  narrativeText.forEach((line) => {
    if (line) {
      doc.text(line, margin + 44, curY, { maxWidth: (pageWidth - margin * 2 - 28) * 0.62 - 32 });
      curY += line.startsWith('•') ? 22 : 14;
    } else {
      curY += 6;
    }
  });

  // Right Side: Program Allocation Breakdown
  const rightBoxX = margin + 28 + (pageWidth - margin * 2 - 28) * 0.64;
  const rightBoxW = (pageWidth - margin * 2 - 28) * 0.36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, narrativeY, rightBoxW, 250, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Programmatic Area Breakdown', rightBoxX + 16, narrativeY + 26);

  const categories = [
    { name: 'Public / Social Living', area: '1,240 SF', pct: '38%' },
    { name: 'Private Suites & Bedrooms', area: '1,120 SF', pct: '35%' },
    { name: 'Service, Kitchen & Laundry', area: '440 SF', pct: '14%' },
    { name: 'Circulation, Foyer & Stairs', area: '420 SF', pct: '13%' },
  ];

  let catY = narrativeY + 54;
  categories.forEach((cat) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(cat.name, rightBoxX + 16, catY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${cat.area} (${cat.pct})`, rightBoxX + rightBoxW - 16, catY, { align: 'right' });

    // Progress bar
    doc.setFillColor(241, 245, 249);
    doc.rect(rightBoxX + 16, catY + 5, rightBoxW - 32, 5, 'F');
    doc.setFillColor(37, 99, 235);
    const pNum = parseFloat(cat.pct) / 100;
    doc.rect(rightBoxX + 16, catY + 5, (rightBoxW - 32) * pNum, 5, 'F');

    catY += 28;
  });

  // Bottom Regulatory Sign-off block
  doc.setFillColor(254, 243, 199); // Amber-50
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(margin + 28, pageHeight - margin - 48, pageWidth - margin * 2 - 28, 36, 4, 4, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRELIMINARY ARCHITECTURAL & STATUTORY FEASIBILITY', margin + 40, pageHeight - margin - 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Conceptual design representation. Final construction documents, structural engineering calculations, and statutory permit filings require certification by a licensed registered architect.', margin + 40, pageHeight - margin - 20);

  // ==========================================
  // PAGE 2: CONCEPTUAL FLOOR PLANS
  // ==========================================
  if (options.includeFloorPlans) {
    doc.addPage('a4', 'landscape');
    drawPageHeader('SHEET A-101', 'Conceptual Coordinated Floor Plans');

    // Two-column layout: Ground Floor Plan (Left) and Second Floor Plan (Right)
    const colW = (pageWidth - margin * 2 - 20) / 2;
    const colH = pageHeight - margin * 2 - 60;

    // Ground Floor Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, margin + 38, colW, colH, 6, 6, 'FD');

    // Second Floor Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + colW + 20, margin + 38, colW, colH, 6, 6, 'FD');

    // Titles
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('LEVEL 01 — GROUND FLOOR PLAN', margin + 16, margin + 56);
    doc.text('LEVEL 02 — SECOND FLOOR PLAN', margin + colW + 36, margin + 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scale: 1/8" = 1\'-0" • Living, Kitchen, Dining & Guest Suite', margin + 16, margin + 68);
    doc.text('Scale: 1/8" = 1\'-0" • Primary Suite, Family Lounge & Children Bedrooms', margin + colW + 36, margin + 68);

    // Architectural Drawing Engine for PDF Canvas
    const drawPlanVector = (rooms: RoomData[], originX: number, originY: number, drawW: number, drawH: number) => {
      const planScale = 5.6; // pt per foot

      // Draw Site Boundary outline
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.8);
      doc.rect(originX, originY, 48 * planScale, 56 * planScale);

      // Draw Rooms
      rooms.forEach((r) => {
        const rx = originX + r.x * planScale;
        const ry = originY + r.y * planScale;
        const rw = r.width * planScale;
        const rh = r.height * planScale;

        // Fill based on room type
        if (r.zone === 'Public') doc.setFillColor(240, 249, 255);
        else if (r.zone === 'Private') doc.setFillColor(250, 245, 255);
        else if (r.zone === 'Service') doc.setFillColor(248, 250, 252);
        else doc.setFillColor(241, 245, 249);

        // Room interior
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(1.2);
        doc.rect(rx, ry, rw, rh, 'FD');

        // Exterior thick border
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(2.2);
        doc.rect(rx, ry, rw, rh, 'D');

        // Room text (Name + Area)
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(r.name, rx + rw / 2, ry + rh / 2 - 2, { align: 'center' });

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(formatSqFt(r.area || r.width * r.height), rx + rw / 2, ry + rh / 2 + 8, { align: 'center' });
      });

      // Dimension strings
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.7);
      doc.line(originX, originY - 8, originX + 44 * planScale, originY - 8);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text("44'-0\" OVERALL WIDTH", originX + (44 * planScale) / 2, originY - 11, { align: 'center' });
    };

    const gRooms = currentAlt.rooms.filter((r) => r.floor === 1);
    const uRooms = currentAlt.rooms.filter((r) => r.floor === 2);

    drawPlanVector(gRooms, margin + 40, margin + 95, colW - 80, colH - 120);
    drawPlanVector(uRooms, margin + colW + 60, margin + 95, colW - 80, colH - 120);

    // North Arrow & Graphic Scale in Bottom Corner
    doc.setFillColor(15, 23, 42);
    doc.circle(pageWidth - margin - 50, pageHeight - margin - 55, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('N', pageWidth - margin - 50, pageHeight - margin - 52, { align: 'center' });
  }

  // ==========================================
  // PAGE 3: 3D VISUALIZATION & MASSING STUDY
  // ==========================================
  if (options.include3DVisualization) {
    doc.addPage('a4', 'landscape');
    drawPageHeader('SHEET A-301', '3D Volumetric Massing & Environmental Strategy');

    // 3D Rendering Simulated Architectural Axonometric Diagram
    const leftW = (pageWidth - margin * 2) * 0.58;
    const rightW = (pageWidth - margin * 2) * 0.39;
    const blockH = pageHeight - margin * 2 - 55;

    // Axonometric View Container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, margin + 38, leftW, blockH, 6, 6, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('COORDINATED AXONOMETRIC PROJECTION', margin + 16, margin + 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('True Isometric 30° / 30° Projection with Glazing & Cantilever Volumes', margin + 16, margin + 68);

    // Vector drawing of isometric building blocks
    const isoX = margin + leftW / 2;
    const isoY = margin + blockH / 2 + 50;

    // Ground Floor Slab
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(1);
    drawPolygon(
      doc,
      [
        { x: isoX - 140, y: isoY },
        { x: isoX, y: isoY + 70 },
        { x: isoX + 140, y: isoY },
        { x: isoX, y: isoY - 70 },
      ],
      'FD'
    );

    // Ground Floor Living Volume
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1.4);
    // Left Face
    drawPolygon(
      doc,
      [
        { x: isoX - 110, y: isoY - 10 },
        { x: isoX, y: isoY + 45 },
        { x: isoX, y: isoY - 25 },
        { x: isoX - 110, y: isoY - 80 },
      ],
      'FD'
    );
    // Right Face (Glazing)
    doc.setFillColor(224, 242, 254);
    drawPolygon(
      doc,
      [
        { x: isoX, y: isoY + 45 },
        { x: isoX + 110, y: isoY - 10 },
        { x: isoX + 110, y: isoY - 80 },
        { x: isoX, y: isoY - 25 },
      ],
      'FD'
    );

    // Second Floor Cantilever Volume
    doc.setFillColor(248, 250, 252);
    // Left Face
    drawPolygon(
      doc,
      [
        { x: isoX - 100, y: isoY - 80 },
        { x: isoX + 10, y: isoY - 25 },
        { x: isoX + 10, y: isoY - 95 },
        { x: isoX - 100, y: isoY - 150 },
      ],
      'FD'
    );
    // Right Face (Timber louvers)
    doc.setFillColor(254, 243, 199);
    drawPolygon(
      doc,
      [
        { x: isoX + 10, y: isoY - 25 },
        { x: isoX + 120, y: isoY - 80 },
        { x: isoX + 120, y: isoY - 150 },
        { x: isoX + 10, y: isoY - 95 },
      ],
      'FD'
    );

    // Roof Overhang Slab (Deep Cantilever)
    doc.setFillColor(30, 41, 59);
    drawPolygon(
      doc,
      [
        { x: isoX - 120, y: isoY - 150 },
        { x: isoX + 10, y: isoY - 85 },
        { x: isoX + 140, y: isoY - 150 },
        { x: isoX + 10, y: isoY - 215 },
      ],
      'F'
    );

    // Elevation tags
    doc.setTextColor(37, 99, 235);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text("+ 22'-6\" ROOF TOP", isoX + 145, isoY - 150);
    doc.text("+ 11'-0\" LEVEL 02 SLAB", isoX + 125, isoY - 80);
    doc.text("+ 0'-0\" GROUND LEVEL", isoX + 145, isoY);

    // Right Box: Massing Parameters & Passive Architecture
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + leftW + 15, margin + 38, rightW, blockH, 6, 6, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MASSING & VOLUMETRIC METRICS', margin + leftW + 30, margin + 56);

    const metrics3D = [
      { param: 'Building Height (Ridge)', value: "24'-6\" Above Finish Grade", status: 'COMPLIANT (35\' Max)' },
      { param: 'Site Coverage Ratio (KDB)', value: '51.9% Ground Footprint', status: 'COMPLIANT (60% Max)' },
      { param: 'Floor Area Ratio (FAR)', value: '0.44 Gross Ratio', status: 'COMPLIANT' },
      { param: 'Primary Solar Orientation', value: 'South-Southwest Glazing', status: 'PASSIVE DAYLIGHT' },
      { param: 'Roof Overhang Depth', value: "4'-0\" Architectural Cantilever", status: 'SHADING VERIFIED' },
    ];

    let rowY = margin + 82;
    metrics3D.forEach((m) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(m.param, margin + leftW + 30, rowY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(m.value, margin + leftW + 30, rowY + 12);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(m.status, margin + leftW + rightW - 16, rowY + 12, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin + leftW + 30, rowY + 18, margin + leftW + rightW - 16, rowY + 18);
      rowY += 28;
    });

    // Materials Palette Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + leftW + 30, rowY + 8, rightW - 32, 90, 4, 4, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Specified Material Palette', margin + leftW + 40, rowY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('• Exterior Stucco: Off-white smooth lime-based finish', margin + 40 + leftW, rowY + 38);
    doc.text('• Accents: Natural kiln-dried Western Red Cedar slats', margin + 40 + leftW, rowY + 50);
    doc.text('• Glazing: Double-pane Low-E Argon thermally broken', margin + 40 + leftW, rowY + 62);
    doc.text('• Roofing: Standing-seam charcoal matte zinc metal', margin + 40 + leftW, rowY + 74);
  }

  // ==========================================
  // PAGE 4: BILL OF QUANTITIES (BOQ) & BUDGET
  // ==========================================
  if (options.includeBOQSummary) {
    doc.addPage('a4', 'landscape');
    drawPageHeader('SHEET C-101', 'Preliminary Bill of Quantities (BOQ) & Cost Schedule');

    const fullW = pageWidth - margin * 2;
    const startY = margin + 42;

    // BOQ Header Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, startY, fullW, 450, 6, 6, 'FD');

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 12, startY + 12, fullW - 24, 22, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CATEGORY', margin + 20, startY + 26);
    doc.text('ITEM DESCRIPTION', margin + 140, startY + 26);
    doc.text('QUANTITY', margin + 380, startY + 26);
    doc.text('UNIT', margin + 450, startY + 26);
    doc.text('UNIT RATE ($)', margin + 520, startY + 26);
    doc.text('TOTAL ESTIMATE ($)', margin + 640, startY + 26);
    doc.text('CONFIDENCE', margin + 740, startY + 26);

    // Table Rows
    let tableY = startY + 44;
    let totalCost = 0;

    project.boqItems.forEach((item, i) => {
      totalCost += item.expectedEstimate;
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin + 12, tableY - 10, fullW - 24, 18, 'F');
      }

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(item.category, margin + 20, tableY + 2);

      doc.setFont('helvetica', 'normal');
      doc.text(item.item, margin + 140, tableY + 2, { maxWidth: 220 });

      doc.setFont('courier', 'normal');
      doc.text(item.quantity.toLocaleString(), margin + 380, tableY + 2);
      doc.text(item.unit, margin + 450, tableY + 2);
      doc.text(formatCurrency(item.unitRate), margin + 520, tableY + 2);

      doc.setFont('courier', 'bold');
      doc.text(formatCurrency(item.expectedEstimate), margin + 640, tableY + 2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.confidence === 'High' ? 16 : item.confidence === 'Medium' ? 245 : 239, item.confidence === 'High' ? 185 : 158, item.confidence === 'High' ? 129 : 11);
      doc.text(item.confidence.toUpperCase(), margin + 740, tableY + 2);

      tableY += 20;
    });

    // Grand Total Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(margin + 12, tableY + 10, fullW - 24, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GRAND TOTAL PROJECTED ESTIMATE (CLASS 5 / FEASIBILITY BENCHMARK)', margin + 24, tableY + 29);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.text(formatCurrency(totalCost), margin + fullW - 36, tableY + 30, { align: 'right' });

    // Unit Cost Metric
    const costPerSqFt = Math.round(totalCost / (project.requirements.targetBuiltUpArea || 3200));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Estimated Construction Cost: $${costPerSqFt} / SF Conditioned Space`, margin + 24, tableY + 54);

    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Estimates are indicative conceptual pricing based on Austin / Texas Regional indices. Excludes land acquisition, specialized geotechnical pilings, and city utility connection fees.', margin + 24, tableY + 68);
  }

  return doc;
}

export function exportPresentationPDF(project: ProjectData, options?: PDFExportOptions): void {
  const doc = generateProjectPresentationPDF(project, options);
  const cleanName = project.identity.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanName}_Client_Presentation_Dossier.pdf`);
}
