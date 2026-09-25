import { BuildingRequirements } from '../types/architecture';

export interface ParsedArchitecturalPrompt {
  name: string;
  city: string;
  state: string;
  location: string;
  projectType: string;
  construction: 'New construction' | 'Renovation' | '';
  requirements: Partial<BuildingRequirements>;
  reviewFlags: string[];
  known: string[];
}

const STATE_NAMES: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function wordOrDigit(value: string): number | null {
  const lower = value.toLowerCase();
  if (WORD_NUMBERS[lower] != null) return WORD_NUMBERS[lower];
  const numeric = Number(lower);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeState(raw: string): string {
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return STATE_NAMES[trimmed.toLowerCase()] || trimmed;
}

export function parseArchitecturalPrompt(prompt: string): ParsedArchitecturalPrompt {
  const text = prompt.trim();
  const reviewFlags: string[] = [];
  const known: string[] = [];
  const requirements: Partial<BuildingRequirements> = {
    requiredRooms: [],
    specialPriorities: [],
  };

  const place = text.match(
    /\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2}),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/,
  );
  const city = place?.[1]?.trim() || '';
  const state = place?.[2] ? normalizeState(place[2]) : '';
  if (city || state) known.push(`Location mentioned: ${[city, state].filter(Boolean).join(', ')}`);
  else reviewFlags.push('City and state were not found in the prompt.');

  const bedrooms = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*-?\s*bed(?:room)?s?\b/i);
  if (bedrooms) {
    const count = wordOrDigit(bedrooms[1]);
    if (count != null) {
      requirements.bedrooms = count;
      known.push(`${count} bedroom${count === 1 ? '' : 's'}`);
    }
  } else {
    reviewFlags.push('Bedroom count needs confirmation.');
  }

  const baths = text.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five)\s*-?\s*bath(?:room)?s?\b/i);
  if (baths) {
    const count = wordOrDigit(baths[1]);
    if (count != null) {
      requirements.bathrooms = count;
      known.push(`${count} bathroom${count === 1 ? '' : 's'}`);
    }
  } else {
    reviewFlags.push('Bathroom count needs confirmation.');
  }

  const stories = text.match(/\b(one|two|three|single|\d+)\s*-?\s*stor(?:e)?y\b/i);
  if (stories) {
    const token = stories[1].toLowerCase() === 'single' ? 'one' : stories[1];
    const count = wordOrDigit(token);
    if (count != null) {
      requirements.floors = count;
      known.push(`${count} floor${count === 1 ? '' : 's'}`);
    }
  } else {
    reviewFlags.push('Number of floors needs confirmation.');
  }

  const garage = text.match(/\b(one|two|three|\d+)\s*-?\s*car\s+garage\b/i);
  if (garage) {
    const count = wordOrDigit(garage[1]);
    if (count != null) {
      requirements.parkingSpaces = count;
      known.push(`${count}-car garage`);
      requirements.requiredRooms = [...(requirements.requiredRooms || []), `${count}-car garage`];
    }
  }

  const rooms = requirements.requiredRooms ? [...requirements.requiredRooms] : [];
  if (/\bhome office\b/i.test(text)) rooms.push('Home office');
  if (/\bguest suite\b/i.test(text)) rooms.push('Guest suite');
  if (/\bkitchen\b/i.test(text)) rooms.push('Kitchen');
  requirements.requiredRooms = rooms;

  const priorities = requirements.specialPriorities ? [...requirements.specialPriorities] : [];
  if (/\bgarden\b/i.test(text)) {
    priorities.push('Garden connection');
    known.push('Garden connection');
  }
  requirements.specialPriorities = priorities;

  if (/\bminimal(?:ist)?\b/i.test(text)) {
    requirements.preferredStyle = 'Modern minimalist';
    known.push('Minimal style');
  } else if (/\bmodern\b/i.test(text)) {
    requirements.preferredStyle = 'Contemporary warm modern';
    known.push('Modern style');
  } else {
    reviewFlags.push('Architectural style was not specified.');
  }

  let projectType = 'Single-family residential';
  if (/\bcommercial\b|\boffice\b|\bretail\b/i.test(text)) projectType = 'Commercial';
  else if (/\bvilla\b/i.test(text)) projectType = 'Villa';
  else if (/\bmulti-?family\b|\bapartment\b/i.test(text)) projectType = 'Multi-family residential';
  else known.push('Treated as residential because the prompt describes a residence.');

  let construction: ParsedArchitecturalPrompt['construction'] = '';
  if (/\brenovat|\bremodel|\baddition\b/i.test(text)) construction = 'Renovation';
  else if (/\bnew construction\b|\bnew build\b/i.test(text)) construction = 'New construction';
  else reviewFlags.push('New construction or renovation was not specified.');

  const budget = text.match(/\$\s?([\d,]+(?:\.\d+)?)\s*(million|m)?/i);
  if (!budget) reviewFlags.push('Construction budget was not specified.');

  reviewFlags.push('Zoning, setbacks, easements, and code requirements are not verified.');
  reviewFlags.push('Lot area and building area were not measured from a survey.');

  const placeLabel = [city, state].filter(Boolean).join(', ');
  const name = placeLabel
    ? `${projectType} in ${placeLabel}`
    : 'Untitled architectural project';

  return {
    name,
    city,
    state,
    location: placeLabel,
    projectType,
    construction,
    requirements,
    reviewFlags,
    known,
  };
}
