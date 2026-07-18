const { VertexAI } = require('@google-cloud/vertexai');

async function test(modelName) {
  try {
    const vertex_ai = new VertexAI({
      project: 'semiotic-nexus-315405',
      location: 'us-central1'
    });

    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: modelName,
    });
    
    const response = await generativeModel.generateContent('Hello');
    console.log(`SUCCESS for ${modelName}:`, response.response.candidates[0].content.parts[0].text);
  } catch(e) {
    console.error(`ERROR for ${modelName}:`, e.message);
  }
}

async function run() {
  await test('gemini-3.5-flash');
}

run();
