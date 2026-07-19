import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);
const chatWithGeminiFunc = httpsCallable(functions, 'chatWithGemini');
const extractIntentFunc = httpsCallable(functions, 'extractIntent');

// getClient removed

const functionDeclarations = [
  {
    name: 'checkQueueTime',
    description: 'Check the current waiting queue time for a specific food stand or stadium gate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        location: { type: 'STRING', description: 'The location, e.g., "Gate B Food Stand" or "Gate A Entrance"' }
      },
      required: ['location']
    }
  },
  {
    name: 'getAvailableParking',
    description: 'Finds the best available parking zone based on real-time stadium occupancy.',
  },
  {
    name: 'reportEmergency',
    description: 'Reports a medical or security emergency to the operations center.',
    parameters: {
      type: 'OBJECT',
      properties: {
        location: { type: 'STRING', description: 'Where the emergency is happening' },
        type: { type: 'STRING', description: 'Type of emergency (medical, security, fire, etc)' }
      },
      required: ['location', 'type']
    }
  }
];

const SYSTEM_PROMPTS = {
  fanAssist: (language) => `You are StadiumIQ FanAssist, the AI assistant for FIFA World Cup 2026 stadiums.
You are helping a fan. The fan's preferred language is: ${language}. Always respond in that language.
You have access to tools to check real-time queue times, parking availability, and report emergencies.
Always use your tools when a user asks about queues, parking, or emergencies. 
Key stadium facts:
- Stadium: MetLife Stadium, East Rutherford, NJ
- Gates: A (North), B (South), C (East), D (West)
- Medical stations: Gate A Level 1, Gate C Level 2, Gate D Level 1
- Food stands: Every 100m on each level.`,

  crowdOps: () => `You are StadiumIQ CrowdOps AI, analyzing crowd data for FIFA World Cup 2026 stadium operations.
Analyze crowd density data and provide clear, actionable operational recommendations.
Format responses as: ALERT LEVEL: [LOW/MEDIUM/HIGH/CRITICAL] | ACTION: [specific action] | REASON: [brief explanation]`,

  staffBrief: (language) => `You are StadiumIQ StaffBrief, the AI assistant for FIFA World Cup 2026 stadium volunteers.
Language: ${language}.
Provide clear, actionable guidance based on official FIFA SOPs.`,

  travelAgent: (language) => `You are StadiumIQ TravelAgent, a dedicated AI concierge for FIFA World Cup 2026.
Language: ${language}.
STRICT GUARDRAILS:
1. You must ONLY answer questions related to navigating from the user's location to the stadium via flight, train, bus, or car.
2. Do NOT answer general knowledge questions.
3. Do NOT write code.
4. Do NOT discuss ticket purchases, refunds, or customer support issues.
5. If the user asks anything outside of transit or travel logistics, reply ONLY with: "I am a specialized travel concierge. I can only assist with directions, flights, and transit to the stadium."`
}

// Simulated tool functions
async function executeTool(name, args) {
  // Executing tool
  if (name === 'checkQueueTime') {
    return { status: 'success', waitTimeMinutes: Math.floor(Math.random() * 10) + 2, recommendation: 'Queue is moving quickly.' }
  } else if (name === 'getAvailableParking') {
    return { status: 'success', recommendedZone: 'Zone B2', availableSpots: 15, evCharging: true }
  } else if (name === 'reportEmergency') {
    return { status: 'success', action: 'Security team dispatched', ETA: '2 minutes' }
  }
  return { error: 'Tool not found' }
}

export async function chatWithGemini(messages, agentType = 'fanAssist', language = 'en', streamCallback = null) {
  try {
    const result = await chatWithGeminiFunc({ messages, agentType, language });
    return result.data.response;
  } catch (err) {
    console.error('Gemini API error:', err);
    return `Server Error: ${err.message || 'Unknown error occurred while contacting the server.'}`;
  }
}

export function speakText(text, lang = 'en') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const cleanText = text.replace(/[*_#[\]]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '')
  const utterance = new SpeechSynthesisUtterance(cleanText)
  const langMap = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar-SA', pt: 'pt-BR' }
  utterance.lang = langMap[lang] || 'en-US'
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

export const STADIUM_PARKING_GRAPH = {
  nodes: {
    ENTRANCE_A: { type: 'entrance', label: 'Gate A Entrance', floor: 0 },
    ENTRANCE_B: { type: 'entrance', label: 'Gate B Entrance', floor: 0 },
    ZONE_A1: { type: 'zone', label: 'Zone A1', capacity: 50, occupied: 12, accessible: false, floor: 0, ev: false },
    ZONE_A2: { type: 'zone', label: 'Zone A2', capacity: 40, occupied: 38, accessible: false, floor: 0, ev: false },
    ZONE_B1: { type: 'zone', label: 'Zone B1', capacity: 20, occupied: 4,  accessible: true,  floor: 0, ev: false },
    ZONE_B2: { type: 'zone', label: 'Zone B2', capacity: 30, occupied: 15, accessible: false, floor: 0, ev: true },
  },
  edges: [
    { from: 'ENTRANCE_A', to: 'ZONE_A1', distance: 50 },
    { from: 'ENTRANCE_A', to: 'ZONE_A2', distance: 80 },
    { from: 'ENTRANCE_A', to: 'ZONE_B1', distance: 130 },
  ],
}

export function findOptimalParking(graph, entryGate, preferences = {}) {
  const { needsAccessible, needsEV } = preferences;
  let bestZone = null;
  let minDistance = Infinity;

  // Simple mock algorithm: just find the first zone that matches criteria
  for (const [id, zone] of Object.entries(graph.nodes)) {
    if (zone.type !== 'zone') continue;
    if (zone.occupied >= zone.capacity) continue;
    if (needsAccessible && !zone.accessible) continue;
    if (needsEV && !zone.ev) continue;
    
    // In a real algorithm we would do a shortest path search here
    // For now we'll just pick a matching zone
    bestZone = id;
    break;
  }
  
  return bestZone;
}

export function generateParkingDirections(zoneId, entryGate, graph) {
  const zone = graph.nodes[zoneId];
  return `Head towards Gate ${entryGate} Entrance.
Follow the digital signage to Level ${zone.floor}.
Turn into ${zone.label} and park in the highlighted bay.`;
}

export async function extractIntentAndEntities(query) {
  try {
    const result = await extractIntentFunc({ query });
    return result.data;
  } catch (error) {
    console.error('Extraction error:', error);
    return { intent: 'UNKNOWN', location: 'GATE_A' };
  }
}
