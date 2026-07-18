const { GoogleGenAI } = require('@google/genai');

async function test(modelName) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.VITE_AGENT_PLATFORM_API_KEY,
      vertexai: {
        project: 'semiotic-nexus-315405',
        location: 'us-central1'
      }
    });
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: 'Hello, world!',
    });
    console.log(`SUCCESS for ${modelName}:`, response.text);
  } catch(e) {
    console.error(`ERROR for ${modelName}:`, e.message);
  }
}

async function run() {
  await test('gemini-3.5-flash');
}

run();
