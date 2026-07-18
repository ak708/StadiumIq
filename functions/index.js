const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// ----------------------------------------------------------------------
// Volunteer OTP via TextLocal (Simulated)
// ----------------------------------------------------------------------
exports.sendVolunteerOTP = functions.https.onCall(async (data, context) => {
  const { phone, name, zone } = data;
  
  if (!phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // In production, you would call the TextLocal API here
    console.log(`[TextLocal Mock] Sent OTP ${otp} to ${phone}`);

    // Store OTP in Firestore with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60000);
    await db.collection('otps').doc(phone).set({
      otp,
      expiresAt,
      name,
      zone,
      status: 'pending'
    });

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP');
  }
});

exports.verifyVolunteerOTP = functions.https.onCall(async (data, context) => {
  const { phone, otp } = data;

  if (!phone || !otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone and OTP are required');
  }

  const otpDoc = await db.collection('otps').doc(phone).get();
  if (!otpDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'OTP not found or expired');
  }

  const otpData = otpDoc.data();
  if (otpData.otp !== otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
  }

  if (otpData.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('failed-precondition', 'OTP expired');
  }

  // Mark OTP as used
  await db.collection('otps').doc(phone).update({ status: 'verified' });

  // Create Volunteer record
  await db.collection('users').doc(phone).set({
    name: otpData.name,
    phone: phone,
    role: 'volunteer',
    zone: otpData.zone,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, message: 'OTP verified, volunteer registered.' };
});

// ----------------------------------------------------------------------
// Real-time Occupancy Heatmap Updates
// Triggered when a ticket is scanned
// ----------------------------------------------------------------------
exports.onTicketScanned = functions.firestore
  .document('scans/{scanId}')
  .onCreate(async (snap, context) => {
    const scanData = snap.data();
    const { section, gate, timestamp } = scanData;

    if (!section || !gate) return null;

    const batch = db.batch();
    const gateRef = db.collection('crowdOps').doc(`gate_${gate}`);
    batch.set(gateRef, {
      current: admin.firestore.FieldValue.increment(1),
      inflow: admin.firestore.FieldValue.increment(1),
      lastUpdated: timestamp
    }, { merge: true });

    const sectionRef = db.collection('heatmap').doc(`section_${section}`);
    batch.set(sectionRef, {
      density: admin.firestore.FieldValue.increment(1),
      lastUpdated: timestamp
    }, { merge: true });

    await batch.commit();
    return { success: true };
  });

// ----------------------------------------------------------------------
// Scheduled Rebalancing (Sync Volunteer Positions)
// ----------------------------------------------------------------------
exports.syncVolunteerPositions = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const heatmapSnap = await db.collection('heatmap').orderBy('density', 'desc').limit(5).get();
    const criticalSections = heatmapSnap.docs.map(d => ({ id: d.id, density: d.data().density }));
    
    if (criticalSections.length > 0 && criticalSections[0].density > 95) {
      await db.collection('alerts').add({
        level: 'danger',
        text: `Automated Sync: Section ${criticalSections[0].id.split('_')[1]} is at critical density (${criticalSections[0].density}%). Recommend immediate volunteer redeployment.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    return null;
  });

// ----------------------------------------------------------------------
// Phase 6: Real-World Live Data Sync (ESPN API)
// Runs every 1 minute
// ----------------------------------------------------------------------
exports.fetchLiveScores = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Fetching live scores from ESPN API...');
    try {
      // Fetch Premier League / Soccer scores (you can change the endpoint based on preferred league)
      const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
      const events = res.data.events || [];
      
      if (events.length === 0) {
        console.log('No matches found.');
        return null;
      }
      
      // Get the first match to display on the dashboard
      const match = events[0];
      const comp = match.competitions[0];
      const homeTeam = comp.competitors.find(c => c.homeAway === 'home');
      const awayTeam = comp.competitors.find(c => c.homeAway === 'away');
      
      // Determine if a match is live, scheduled, or full-time
      let statusText = comp.status.displayClock; // e.g. "45'", "0:00"
      if (comp.status.type.state === 'pre') statusText = 'SCHEDULED';
      if (comp.status.type.state === 'post') statusText = 'FT';

      const matchData = {
        name: match.name, // e.g. "Manchester City vs Arsenal"
        shortName: match.shortName, // e.g. "MCI vs ARS"
        date: match.date, // ISO timestamp
        status: statusText,
        state: comp.status.type.state, // 'pre', 'in', 'post'
        home: {
          name: homeTeam.team.name,
          abbreviation: homeTeam.team.abbreviation,
          score: homeTeam.score,
          logo: homeTeam.team.logo
        },
        away: {
          name: awayTeam.team.name,
          abbreviation: awayTeam.team.abbreviation,
          score: awayTeam.score,
          logo: awayTeam.team.logo
        },
        venue: comp.venue?.fullName || 'TBD',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      // Push real-time data to Firestore
      const feedRef = db.collection('match_data').doc('live_feed');
      await feedRef.set({ match: matchData }, { merge: true });

      console.log('Successfully updated match data:', matchData.name);
    } catch (err) {
      console.error('Failed to fetch from ESPN API:', err.message);
    }
    return null;
  });

// ----------------------------------------------------------------------
// AI Chat Logic (Vertex AI via Cloud Functions)
// ----------------------------------------------------------------------
const { GoogleGenAI } = require('@google/genai');
const { calculateOptimalRoute, STADIUM_GRAPH } = require('./routingEngine');

// Use the Agent Platform key for Vertex AI from environment variables
const agentPlatformKey = process.env.VERTEX_API_KEY || "YOUR_VERTEX_API_KEY";

let ai_instance = null;
function getGenAI() {
  if (!ai_instance) {
    ai_instance = new GoogleGenAI({
      apiKey: agentPlatformKey,
      vertexai: {
        project: 'semiotic-nexus-315405',
        location: 'us-central1'
      }
    });
  }
  return ai_instance;
}

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
}

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
  },
  {
    name: 'getDynamicDirections',
    description: 'Calculates the mathematically fastest walking route inside the stadium taking live crowd flow and stairs into account.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startNodeId: { type: 'STRING', description: 'Starting node ID, e.g. "GATE_B" or "SECTION_112"' },
        endNodeId: { type: 'STRING', description: 'Ending node ID, e.g. "SECTION_215"' }
      },
      required: ['startNodeId', 'endNodeId']
    }
  },
  {
    name: 'placeOrder',
    description: 'Places an order for food, beverages, or merchandise to be delivered to the user\'s seat or picked up at express lane.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item: { type: 'STRING', description: 'What the user wants to order' },
        deliveryType: { type: 'STRING', description: 'in-seat or pickup' }
      },
      required: ['item', 'deliveryType']
    }
  },
  {
    name: 'checkFanCam',
    description: 'Checks if the user was spotted on the stadium FanCam during the match.',
  }
];

async function executeTool(name, args) {
  console.log(`Executing tool ${name} with args:`, args);
  if (name === 'checkQueueTime') {
    return { status: 'success', waitTimeMinutes: Math.floor(Math.random() * 10) + 2, recommendation: 'Queue is moving quickly.' };
  } else if (name === 'getAvailableParking') {
    return { status: 'success', recommendedZone: 'Zone B2', availableSpots: 15, evCharging: true };
  } else if (name === 'reportEmergency') {
    return { status: 'success', action: 'Security team dispatched', ETA: '2 minutes' };
  } else if (name === 'getDynamicDirections') {
    
    // In a production environment, we would fetch the live heatmap data from Firestore here:
    // const heatmapSnap = await db.collection('heatmap').get(); 
    // For the demonstration, let's mock a heavy crowd surge at STAIRS_2 (Gate B stairs)
    const liveCrowdHeatmap = {
      'STAIRS_2': { density: 95 } 
    };

    return calculateOptimalRoute(args.startNodeId, args.endNodeId, liveCrowdHeatmap);
  } else if (name === 'placeOrder') {
    return { status: 'success', message: `Order for ${args.item} placed!`, eta: '5 minutes', totalCost: '$12.00' };
  } else if (name === 'checkFanCam') {
    return { status: 'success', spotted: true, message: 'You were spotted in Section 112 at minute 45! Check the "Stadium Hub" tab in the app to claim your digital copy or enter the lucky draw for a free frame.' };
  }
  return { error: 'Tool not found' };
}

exports.chatWithGemini = functions.https.onCall(async (data, context) => {
  const { messages, agentType = 'fanAssist', language = 'en' } = data;
  
  try {
    const systemMsg = messages.find(m => m.role === 'system');
    let systemPrompt = SYSTEM_PROMPTS[agentType]?.(language) || SYSTEM_PROMPTS.fanAssist(language);
    if (systemMsg) {
      systemPrompt += '\n\n' + systemMsg.content;
    }

    const validMessages = messages.filter(m => m.role !== 'system');
    const lastMessage = validMessages.length > 0 ? validMessages.pop().content : '';

    const history = validMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    if (history.length > 0 && history[0].role === 'model') {
      history.unshift({
        role: 'user',
        parts: [{ text: 'Hello' }]
      });
    }

    const modelParams = {
      model: 'gemini-3.5-flash',
      contents: lastMessage,
      config: {
        systemInstruction: systemPrompt,
      }
    };
    
    if (agentType === 'fanAssist') {
      modelParams.config.tools = [
        { functionDeclarations },
        { googleSearch: {} } // Enable Agent Platform Web Search
      ];
    }

    const ai = getGenAI();
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: modelParams.config,
      history: history.map(h => ({ role: h.role, parts: h.parts }))
    });
    
    const result = await chat.sendMessage({ message: lastMessage });
    const response = result;
    
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolResult = await executeTool(call.name, call.args);
      
      const secondResult = await chat.sendMessage({
        message: [{
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        }]
      });
      return { response: secondResult.text };
    }

    return { response: response.text };
  } catch (err) {
    console.error('Gemini API error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Unknown error');
  }
});

exports.extractIntent = functions.https.onCall(async (data, context) => {
  const { query } = data;
  try {
    const prompt = `Analyze this stadium visitor query.
Extract the user's INTENT (one of: FIND_FOOD, FIND_MEDICAL, FIND_PARKING, UNKNOWN) and LOCATION (map to one of: GATE_A, GATE_B, GATE_C, GATE_D). Default location to GATE_A if none specified.
Query: "${query}"`;

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    return JSON.parse(result.text);
  } catch (error) {
    console.error('Extraction error:', error);
    return { intent: 'UNKNOWN', location: 'GATE_A' };
  }
});
