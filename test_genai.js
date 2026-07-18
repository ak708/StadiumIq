import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.VITE_AGENT_PLATFORM_API_KEY,
      vertexai: {
        project: 'semiotic-nexus-315405',
        location: 'us-central1'
      }
    });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Hello, world!',
    });
    console.log("SUCCESS:", response.text);
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}

test();
