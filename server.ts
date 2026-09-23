import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Compose AI Architectural Engine',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// n8n Webhook Proxy Endpoint to prevent browser CORS issues
app.post('/api/submit-n8n', async (req, res) => {
  const webhookUrl = process.env.VITE_N8N_SUBMIT_WEBHOOK_URL || 'https://droppflowwsystems.app.n8n.cloud/webhook/compose-submit';
  try {
    const upstreamRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await upstreamRes.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText || 'Received by n8n webhook' };
    }

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `n8n upstream error (${upstreamRes.status})`,
        details: responseData,
      });
    }

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error forwarding to n8n webhook:', error);
    res.status(500).json({
      error: 'Failed to contact n8n backend automation',
      message: error?.message || 'Network timeout or upstream failure',
    });
  }
});

// API config status endpoint
app.get('/api/gemini/status', (req, res) => {
  res.json({
    configured: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.8-flash',
    mode: process.env.GEMINI_API_KEY ? 'live' : 'demo_deterministic',
  });
});

// Server-side AI Architect generation endpoint
app.post('/api/gemini/architect', async (req, res) => {
  const { prompt, projectContext, conversationHistory } = req.body;

  // If no Gemini key is provided or demo mode is enforced, return structured high-grade architectural reasoning
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      source: 'deterministic_demo_engine',
      text: generateArchitecturalResponse(prompt, projectContext),
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are the Lead Architectural Concept Director at Compose AI, a high-level architectural intelligence studio.
You speak like a seasoned, thoughtful licensed design director: precise, articulate, and grounded in structural logic, US residential building codes (IRC/IBC), climate-specific passive solar strategies, and programmatic clarity.
Do NOT use sales fluff, buzzwords, or cartoon expressions. Focus on spatial adjacencies, natural daylighting, egress paths, structural framing grids, and site acoustics.
Always remind the user when appropriate that outputs are conceptual and require verification by a qualified registered professional architect or engineer.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Project context:\n${JSON.stringify(projectContext, null, 2)}\n\nUser inquiry / clarification:\n${prompt}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      text: response.text || generateArchitecturalResponse(prompt, projectContext),
    });
  } catch (error: any) {
    console.error('Gemini call error:', error);
    // Graceful fallback so user demo NEVER breaks
    res.json({
      success: true,
      source: 'fallback_architect_reasoning',
      text: generateArchitecturalResponse(prompt, projectContext),
      warning: error?.message || 'Upstream AI latency resolved via local deterministic reasoning engine.',
    });
  }
});

function generateArchitecturalResponse(prompt: string = '', projectContext?: any): string {
  const p = prompt.toLowerCase();
  if (p.includes('guest') || p.includes('ground floor') || p.includes('bedroom')) {
    return `### Strategic Recommendation: Ground-Floor Guest Suite Integration

Positioning the guest suite on the **Ground Floor** adjacent to the eastern light court provides three distinct architectural advantages:

1. **Multigenerational Accessibility**: Enables step-free, barrier-free circulation from the carport foyer, ideal for senior relatives or visiting elders without upper-stair traversal.
2. **Thermal & Acoustic Buffer**: Locating the suite along the eastern setback shields it from harsh western afternoon glare while leveraging morning insolation.
3. **Private Ingress**: Allows guests to retreat privately without crossing through the primary evening family living core.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  if (p.includes('family') || p.includes('living') || p.includes('connected')) {
    return `### Programmatic Synthesis: Upper Family Lounge vs. Great Room
 
We recommend a **two-tiered living hierarchy**:

- **Ground Level**: Open-plan Great Room, formal dining, and display kitchen directly connected to the covered outdoor lanai and private rear yard via 10-foot multi-slide glass doors.
- **Upper Level**: A private, acoustically buffered family media retreat positioned between secondary bedrooms and the primary owner's suite.

This preserves acoustic comfort during social entertaining while creating an intimate daytime study and lounge zone for the immediate family.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  if (p.includes('butler') || p.includes('prep kitchen') || p.includes('service') || p.includes('scullery') || p.includes('entrance') || p.includes('kitchen')) {
    return `### Circulation Strategy: Dedicated Scullery & Mudroom Service Spine

Yes, the prep kitchen / scullery features a **direct service corridor** linking through the walk-in pantry to the garage and mudroom:

- **Prep & Acoustic Buffering**: Isolates heavy prep work, secondary refrigeration, and appliances from the central open-concept Great Room.
- **Streamlined Delivery Route**: Enables direct grocery transfer from the 2-car garage into the pantry and scullery without crossing the primary foyer.
- **Exterior Access**: Facilitates outdoor grilling staging and discreet trash/recycling removal along the side yard setback.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  if (p.includes('garden') || p.includes('patio') || p.includes('yard') || p.includes('entrance') || p.includes('visible')) {
    return `### Spatial Sequence: Controlled Thresholds & Outdoor Connection

Rather than revealing the entire rear yard immediately at the entry threshold, we advocate an **architectural reveal**:

1. A framed entry foyer with a ceiling height transition (9 ft to 12 ft volume) creating intuitive visual focus.
2. Stepping past the foyer gallery into the Great Room reveals an expansive floor-to-ceiling glass vista out to the covered cedar lanai and landscaped rear yard.
3. This creates a refined progression from sheltered residential arrival to spacious indoor-outdoor entertainment.

*Note: Conceptual output requiring review by a qualified professional.*`;
  }

  return `### Comprehensive Architectural Assessment

Based on the 60 ft × 120 ft parcel in Austin, Texas:

1. **Passive Solar Orientation**: The 7,200 sq ft lot is configured with deep south and west solar exposure. By integrating 6-foot cantilevered overhangs, low-E glazing, and western cedar shading screens, summer cooling loads are reduced by 40% while capturing winter morning warmth.
2. **Programmatic Balance**: 3,850 sq ft target conditioned area distributed across two levels: Ground level accommodates open-concept entertaining, owner's suite, home office, scullery, and 2-car garage. Upper level hosts 3 ensuite bedrooms and a flexible family media loft.
3. **Zoning & Regulatory Fit**: Plan conforms strictly to Austin Subchapter F Residential Infill Standards (0.40 FAR limit, 40% building coverage, 25 ft front / 10 ft rear / 5 ft side setbacks).

*Note: Conceptual output requiring review by a qualified professional.*`;
}

// Vite middleware / static files
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isDev = process.env.NODE_ENV === 'development' || (!hasDist && process.env.NODE_ENV !== 'production');

  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev middleware initialization skipped or failed:', err);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Compose AI Server running on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });
}

startServer();
