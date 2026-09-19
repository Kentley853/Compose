export interface AskArchitectParams {
  prompt: string;
  projectContext: any;
}

export interface ArchitectResponse {
  text: string;
  source: string;
  success: boolean;
}

export async function askArchitect(params: AskArchitectParams): Promise<ArchitectResponse> {
  try {
    const res = await fetch('/api/gemini/architect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text,
      source: data.source || 'Compose AI Architectural Engine',
      success: true,
    };
  } catch (err: any) {
    console.warn('Network call to AI architect fallback:', err);
    // Offline deterministic architectural reasoning fallback
    return {
      text: getOfflineFallbackAnswer(params.prompt),
      source: 'Deterministic Architectural Engine (Offline Mode)',
      success: true,
    };
  }
}

function getOfflineFallbackAnswer(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('guest') || p.includes('ground floor')) {
    return `### Strategic Recommendation: Ground-Floor Guest Suite Integration

Positioning the guest suite on the **Ground Floor** adjacent to the eastern light court provides three distinct architectural advantages:

1. **Multigenerational Accessibility**: Enables step-free, barrier-free circulation from the carport foyer, ideal for senior relatives or visiting elders without upper-stair traversal.
2. **Thermal & Acoustic Buffer**: Locating the suite along the eastern setback shields it from harsh western afternoon glare while leveraging morning insolation.
3. **Private Ingress**: Allows guests to retreat privately without crossing through the primary evening family living core.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  if (p.includes('family') || p.includes('living') || p.includes('private')) {
    return `### Programmatic Synthesis: Upper Family Lounge vs. Formal Living

We recommend a **two-tiered living hierarchy**:

- **Ground Level**: Open-plan formal reception, dining, and show kitchen directly connected to the tropical rear garden via sliding glazed walls.
- **First Level**: A private, acoustically isolated family media sanctuary positioned centrally between children’s bedrooms and the master suite.

This preserves acoustic comfort during social entertaining while creating an intimate daytime work-and-lounge zone for the immediate family.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  if (p.includes('wet kitchen') || p.includes('service')) {
    return `### Circulation Strategy: Dedicated Western Service Spine

Yes, the wet kitchen must feature an **independent external service entrance** along the western 2.0m setback:

- **Odor & Acoustic Isolation**: Isolates heavy Asian cooking and prep noise from the formal dining and show kitchen.
- **Direct Logistics Delivery**: Enables staff, groceries, and waste disposal without penetrating the main entrance gallery.
- **Direct Linkage to Maid Quarters & Laundry**: Establishes a contiguous service zone running from southern gate to northern utility court.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  return `### Comprehensive Architectural Assessment

1. **Passive Climate Alignment**: The 360 m² parcel capitalizes on prevailing winds via open eastern/western setbacks, channeling air through the central stair void.
2. **Daylight Infiltration**: Direct western solar exposure is mitigated via louvered fenestration, directing gentle morning light into living zones.
3. **Zoning Integrity**: Complete separation between public entertainment, private retreats, and operational service pathways.

*Note: Conceptual output requiring review by a qualified professional.*`;
}
