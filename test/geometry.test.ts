import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatFeetInches,
  parseFeetInches,
  formatSqFt,
  formatCurrency,
  calculatePlanBounds,
  calculateFitViewport,
  validateRoom,
  resolveRoomLabelPlacement,
} from '../src/utils/geometry';
import { RoomData } from '../src/types/architecture';

describe('Geometry Scaling & Unit Conversion', () => {
  it('converts decimal feet to formatted feet and inches', () => {
    assert.strictEqual(formatFeetInches(20.5), '20\'-6"');
    assert.strictEqual(formatFeetInches(12.0), '12\'-0"');
    assert.strictEqual(formatFeetInches(0), '0\'-0"');
    assert.strictEqual(formatFeetInches(8.25), '8\'-3"');
  });

  it('parses feet and inches strings into decimal feet', () => {
    assert.strictEqual(parseFeetInches('20\' 6"'), 20.5);
    assert.strictEqual(parseFeetInches('20\'-6"'), 20.5);
    assert.strictEqual(parseFeetInches('12'), 12);
    assert.strictEqual(parseFeetInches('14.5'), 14.5);
    assert.strictEqual(parseFeetInches('240 in'), 20);
  });

  it('formats area and currency accurately', () => {
    assert.strictEqual(formatSqFt(3200), '3,200 SF');
    assert.strictEqual(formatSqFt(0), '0 SF');
    assert.strictEqual(formatCurrency(250000), '$250,000');
  });

  it('calculates plan bounding box with positive dimensions', () => {
    const testRooms: RoomData[] = [
      {
        id: 'r1',
        name: 'Living Room',
        floor: 1,
        x: 0,
        y: 0,
        width: 20,
        height: 18,
        area: 360,
        zone: 'Public',
        daylightScore: 90,
        ventilationScore: 85,
        openings: { doors: [], windows: [] },
      },
      {
        id: 'r2',
        name: 'Kitchen',
        floor: 1,
        x: 20,
        y: 0,
        width: 14,
        height: 14,
        area: 196,
        zone: 'Service',
        daylightScore: 80,
        ventilationScore: 80,
        openings: { doors: [], windows: [] },
      },
    ];

    const bounds = calculatePlanBounds(testRooms);
    assert.strictEqual(bounds.minX, 0);
    assert.strictEqual(bounds.minY, 0);
    assert.strictEqual(bounds.maxX, 40); // clamps to at least 40
    assert.strictEqual(bounds.maxY, 40);
    assert(bounds.width > 0);
    assert(bounds.depth > 0);
  });

  it('calculates auto-fit scale fitting within viewport with padding', () => {
    const bounds = { minX: 0, minY: 0, maxX: 44, maxY: 52, width: 44, depth: 52 };
    const viewport = { width: 800, height: 600 };
    const fit = calculateFitViewport(bounds, viewport, 0.10);

    // Available width = 800 - 160 = 640. 640 / 44 = 14.54
    // Available height = 600 - 120 = 480. 480 / 52 = 9.23
    // Scale should be limited by height = ~9.23
    assert(fit.scale > 8 && fit.scale < 10);
    assert(fit.offsetX >= 0);
    assert(fit.offsetY >= 0);
  });

  it('validates room boundaries and warns on illegal zero/negative dimensions', () => {
    const invalidRoom: RoomData = {
      id: 'inv',
      name: 'Bad Room',
      floor: 1,
      x: 0,
      y: 0,
      width: 0,
      height: -5,
      area: 0,
      zone: 'Public',
      daylightScore: 50,
      ventilationScore: 50,
      openings: { doors: [], windows: [] },
    };

    const result = validateRoom(invalidRoom);
    assert.strictEqual(result.valid, false);
    assert(result.errors.length >= 2);
  });

  it('resolves label collisions using numbered markers when room is compact', () => {
    const tinyRoom: RoomData = {
      id: 'tiny',
      name: 'Powder Rm',
      floor: 1,
      x: 0,
      y: 0,
      width: 4,
      height: 4,
      area: 16,
      zone: 'Public',
      daylightScore: 60,
      ventilationScore: 60,
      openings: { doors: [], windows: [] },
    };

    // Low scale where 4 ft * 6 = 24px width
    const placement = resolveRoomLabelPlacement(tinyRoom, 6, 0);
    assert.strictEqual(placement.mode, 'marker');
    assert.strictEqual(placement.markerNumber, 1);
  });

  it('uses full or wrapped text for generous rooms', () => {
    const bigRoom: RoomData = {
      id: 'big',
      name: 'Great Room Living',
      floor: 1,
      x: 0,
      y: 0,
      width: 24,
      height: 20,
      area: 480,
      zone: 'Public',
      daylightScore: 95,
      ventilationScore: 90,
      openings: { doors: [], windows: [] },
    };

    // Scale 15 px/ft -> 360px wide
    const placement = resolveRoomLabelPlacement(bigRoom, 15, 0);
    assert.strictEqual(placement.mode, 'full');
    assert(placement.lines.length >= 1);
  });
});
