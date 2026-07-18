import { db } from './firebase'
import { collection, doc, addDoc } from 'firebase/firestore'
import { STADIUM_FACTS } from './stadiumFacts'
import { chatWithGemini, extractIntentAndEntities } from './gemini'
import { STADIUM_GRAPH, findNearestNodeOfType } from './graphEngine'

export async function getSmartResponse(history, language) {
  const isSingleQuestion = history.length >= 2;
  const userQuestion = history[history.length - 1].content;
  
  let graphContext = '';
  let intentData = null;

  if (isSingleQuestion) {
    // 1. Extract Intent & Entities
    intentData = await extractIntentAndEntities(userQuestion);
    
    // 2. Traverse Graph
    if (intentData.intent && intentData.intent !== 'UNKNOWN' && intentData.location) {
      const result = findNearestNodeOfType(STADIUM_GRAPH, intentData.location, intentData.intent);
      
      if (result.target) {
        graphContext = `
GRAPH RAG SYSTEM INJECTION:
The user's query mapped to intent: ${intentData.intent} from location: ${intentData.location}.
Graph Traversal Result: The nearest location is ${result.target.label} (${result.target.description || ''}).
Path to take: ${result.path} (Distance: ${result.distance}m).
Use this exact graph path to answer the user's question naturally in ${language}.`;
      }
    }
  }

  // 3. Construct Prompt
  // MOCK USER TICKET CONTEXT
  const userTicketContext = `
USER CONTEXT:
Name: John Doe
Ticket: Section 112, Row 10, Seat 4
Parking: Zone B2
Entrance: Gate B
`;

  const systemPrompt = `You are StadiumIQ FanAssist, a helpful AI assistant for the FIFA World Cup 2026.
Respond in the user's selected language (${language}).
${userTicketContext}
${graphContext ? graphContext : 'Use these facts if needed: ' + STADIUM_FACTS}`;

  // 4. Ask Gemini
  const response = await chatWithGemini([{ role: 'system', content: systemPrompt }, ...history], 'fanAssist', language);

  // 5. Persist to Firestore for CrowdOps Analytics
  if (isSingleQuestion && db && intentData && intentData.intent !== 'UNKNOWN') {
    try {
      await addDoc(collection(db, 'graph_queries'), {
        query: userQuestion,
        intent: intentData.intent,
        location: intentData.location,
        resolution: graphContext ? 'Graph Traversal Success' : 'Graph Traversal Failed',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to log graph query:', err);
    }
  }

  return response;
}
