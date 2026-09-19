import { RoomData, PlotData } from '../types/architecture';

/**
 * Architectural Geometry and Units Utilities
 * Canonical internal units: US Customary Feet (decimal numbers)
 */

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  depth: number;
}

export interface ViewportFit {
  scale: number; // pixels per foot
  offsetX: number; // pixels
  offsetY: number; // pixels
  bounds: BoundingBox;
}

export interface FeetInches {
  feet: number;
  inches: number;
  fractionText?: string;
  formatted: string;
}

/**
 * Convert decimal feet to feet and inches format: e.g. 20.5 ft -> 20' 6"
 */
export function formatFeetInches(decimalFeet: number): string {
  if (isNaN(decimalFeet) || decimalFeet === null || decimalFeet === undefined) return '0\'-0"';
  const isNegative = decimalFeet < 0;
  const absFeet = Math.abs(decimalFeet);
  const feet = Math.floor(absFeet);
  const remainingInches = (absFeet - feet) * 12;
  const roundedInches = Math.round(remainingInches * 2) / 2; // round to nearest half inch
  
  let finalFeet = feet;
  let finalInches = roundedInches;
  if (finalInches >= 12) {
    finalFeet += 1;
    finalInches -= 12;
  }

  const sign = isNegative ? '-' : '';
  const inchStr = finalInches % 1 === 0 ? `${finalInches}"` : `${Math.floor(finalInches)} ½"`;
  return `${sign}${finalFeet}'-${inchStr}`;
}

/**
 * Parse strings like: 20' 6", 20'-6", 20.5, 20 ft, 246 in, 20' into decimal feet
 */
export function parseFeetInches(input: string | number): number | null {
  if (typeof input === 'number') return isNaN(input) ? null : input;
  if (!input || typeof input !== 'string') return null;

  const str = input.trim();
  if (!str) return null;

  // Check for inches suffix first: e.g. 240", 240 in, 240in
  const inRegex = /^(-?\d+(?:\.\d+)?)\s*(?:"|in|inches)$/i;
  const inMatch = str.match(inRegex);
  if (inMatch) {
    const val = parseFloat(inMatch[1]);
    return !isNaN(val) ? val / 12 : null;
  }

  // Feet & inches pattern: e.g. 20' 6", 20'-6", 20' 6.5", 20 ft 6 in
  const ftInRegex = /^(-?\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*[-–]?\s*(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)?\s*(?:"|in|inches)?$/i;
  const match = str.match(ftInRegex);

  if (match) {
    const feetPart = parseFloat(match[1]);
    let inchesPart = 0;
    if (match[2]) {
      if (match[2].includes('/')) {
        const [num, den] = match[2].split('/').map(Number);
        inchesPart = den ? num / den : 0;
      } else {
        inchesPart = parseFloat(match[2]);
      }
    }
    if (!isNaN(feetPart)) {
      const sign = feetPart < 0 ? -1 : 1;
      return feetPart + (sign * (inchesPart / 12));
    }
  }

  // Pure number case (e.g. "20.5")
  const pureNum = parseFloat(str);
  if (!isNaN(pureNum) && !str.includes('\'') && !str.includes('"') && !str.toLowerCase().includes('in')) {
    return pureNum;
  }

  return isNaN(pureNum) ? null : pureNum;
}

/**
 * Format square feet nicely: e.g. 360 -> "360 SF"
 */
export function formatSqFt(area: number): string {
  if (isNaN(area) || area === null || area === undefined) return '0 SF';
  return `${Math.round(area).toLocaleString()} SF`;
}

/**
 * Format currency in USD: e.g. 178500 -> "$178,500"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate comprehensive bounding box of room geometry and site plot
 */
export function calculatePlanBounds(rooms: RoomData[], plot?: PlotData): BoundingBox {
  if (!rooms || rooms.length === 0) {
    const plotW = plot?.width || 60;
    const plotD = plot?.depth || 120;
    return { minX: 0, minY: 0, maxX: plotW, maxY: plotD, width: plotW, depth: plotD };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  rooms.forEach((r) => {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  });

  // Ensure minimum realistic boundary
  minX = Math.min(minX, 0);
  minY = Math.min(minY, 0);
  maxX = Math.max(maxX, 40);
  maxY = Math.max(maxY, 40);

  const width = maxX - minX;
  const depth = maxY - minY;

  return { minX, minY, maxX, maxY, width, depth };
}

/**
 * Calculate auto-fit transformation from architectural world coordinates (feet)
 * to screen viewport (pixels), reserving 8-12% visual margin and centering the building.
 */
export function calculateFitViewport(
  bounds: BoundingBox,
  viewport: { width: number; height: number },
  paddingRatio = 0.10
): ViewportFit {
  const vpW = Math.max(viewport.width, 300);
  const vpH = Math.max(viewport.height, 300);

  const paddingX = vpW * paddingRatio;
  const paddingY = vpH * paddingRatio;

  const availW = vpW - paddingX * 2;
  const availH = vpH - paddingY * 2;

  // Calculate maximum uniform scale (pixels per foot)
  const scaleX = availW / (bounds.width || 50);
  const scaleY = availH / (bounds.depth || 50);
  const scale = Math.min(scaleX, scaleY);

  // Center the bounding box within the available viewport
  const contentPixelW = bounds.width * scale;
  const contentPixelH = bounds.depth * scale;

  const offsetX = (vpW - contentPixelW) / 2 - bounds.minX * scale;
  const offsetY = (vpH - contentPixelH) / 2 - bounds.minY * scale;

  return { scale, offsetX, offsetY, bounds };
}

/**
 * Validate room geometry:
 * - Width must be > 0
 * - Height/depth must be > 0
 * - Area ~ width * height
 * - Detect overlapping sibling rooms
 */
export interface RoomValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRoom(room: RoomData, allRooms: RoomData[] = []): RoomValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!room.width || room.width <= 0) {
    errors.push(`Width must be greater than zero (current: ${room.width})`);
  }
  if (!room.height || room.height <= 0) {
    errors.push(`Depth must be greater than zero (current: ${room.height})`);
  }

  const expectedArea = (room.width || 0) * (room.height || 0);
  if (room.area && Math.abs(room.area - expectedArea) > 5) {
    warnings.push(
      `Area mismatch: declared ${room.area} SF vs geometric ${Math.round(expectedArea)} SF`
    );
  }

  // Overlap detection on the same floor
  allRooms.forEach((other) => {
    if (other.id === room.id || other.floor !== room.floor) return;

    const overlapX = Math.max(0, Math.min(room.x + room.width, other.x + other.width) - Math.max(room.x, other.x));
    const overlapY = Math.max(0, Math.min(room.y + room.height, other.y + other.height) - Math.max(room.y, other.y));
    const overlapArea = overlapX * overlapY;

    // A tiny overlap (<= 0.5 ft) is acceptable for shared walls, but large overlap is a clash
    if (overlapArea > 2.0) {
      warnings.push(`Potential spatial overlap with "${other.name}" (${Math.round(overlapArea)} SF intersection)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect collision and determine readable display format for room names and areas
 */
export interface LabelPlacement {
  mode: 'full' | 'short' | 'marker';
  markerNumber?: number;
  displayName: string;
  displayArea: string;
  fontSizeName: number;
  fontSizeArea: number;
  canFitArea: boolean;
  lines: string[];
}

export function resolveRoomLabelPlacement(
  room: RoomData,
  scale: number,
  index: number
): LabelPlacement {
  const rw = room.width * scale; // room pixel width
  const rh = room.height * scale; // room pixel height
  const areaText = formatSqFt(room.area || room.width * room.height);

  // Short display names dictionary
  const SHORT_NAMES: Record<string, string> = {
    '2-Car Garage': 'Garage',
    'Foyer & Gallery': 'Foyer',
    'Guest Suite': 'Guest',
    'Guest Bath': 'Bath',
    'Powder Rm': 'Powder',
    'Great Room': 'Great Rm',
    'Dining Area': 'Dining',
    'Kitchen & Scullery': 'Kitchen',
    'Primary Owner Suite': 'Primary Suite',
    'Primary Ensuite Bath': 'Pri. Bath',
    'Covered Patio / Lanai': 'Lanai',
    'Upper Family Media Loft': 'Media Loft',
    'Bedroom 2 (Ensuite)': 'Bed 2',
    'Bedroom 3': 'Bed 3',
    'Shared Bath': 'Bath',
    'Laundry Rm': 'Laundry',
  };

  const shortName = SHORT_NAMES[room.name] || room.name;

  // Check if room is too small for readable text (min 48px width and 36px height)
  if (rw < 50 || rh < 40) {
    return {
      mode: 'marker',
      markerNumber: index + 1,
      displayName: `${index + 1}`,
      displayArea: areaText,
      fontSizeName: 12,
      fontSizeArea: 10,
      canFitArea: false,
      lines: [`#${index + 1}`],
    };
  }

  // Room can fit full or short name
  const words = room.name.split(' ');
  let lines: string[] = [];

  if (rw > 110 && rh > 60) {
    // Plenty of space for full name and area
    if (room.name.length > 14 && words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    } else {
      lines = [room.name];
    }
    return {
      mode: 'full',
      displayName: room.name,
      displayArea: areaText,
      fontSizeName: rw > 140 ? 13 : 12,
      fontSizeArea: 11,
      canFitArea: rh >= 55,
      lines,
    };
  }

  // Moderate space: use short name wrapped to max 2 lines
  if (shortName.length > 10 && words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  } else {
    lines = [shortName];
  }

  return {
    mode: 'short',
    displayName: shortName,
    displayArea: areaText,
    fontSizeName: 12,
    fontSizeArea: 11,
    canFitArea: rh >= 50,
    lines,
  };
}
