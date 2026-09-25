import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArchitecturalPrompt } from '../src/lib/promptParse';

describe('architectural prompt parsing', () => {
  it('extracts known residential requirements and leaves zoning unverified', () => {
    const parsed = parseArchitecturalPrompt(
      'Create a two-story modern family residence in Austin, Texas with four bedrooms, a home office, a two-car garage, and a garden connection.',
    );

    assert.equal(parsed.city, 'Austin');
    assert.equal(parsed.state, 'TX');
    assert.equal(parsed.requirements.bedrooms, 4);
    assert.equal(parsed.requirements.floors, 2);
    assert.equal(parsed.requirements.parkingSpaces, 2);
    assert.equal(parsed.requirements.preferredStyle, 'Contemporary warm modern');
    assert.ok(parsed.requirements.requiredRooms?.includes('Home office'));
    assert.ok(parsed.requirements.specialPriorities?.includes('Garden connection'));
    assert.ok(parsed.reviewFlags.some((flag) => /zoning/i.test(flag)));
    assert.equal(JSON.stringify(parsed).includes('Subchapter'), false);
  });

  it('does not invent a city or bedroom count', () => {
    const parsed = parseArchitecturalPrompt('Start a project from my uploaded site survey and client brief.');
    assert.equal(parsed.city, '');
    assert.equal(parsed.state, '');
    assert.equal(parsed.requirements.bedrooms, undefined);
    assert.ok(parsed.reviewFlags.some((flag) => /bedroom/i.test(flag)));
    assert.ok(parsed.reviewFlags.some((flag) => /city and state/i.test(flag)));
  });
});
