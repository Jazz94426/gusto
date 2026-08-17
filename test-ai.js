const { GoogleGenAI } = require("@google/genai");
const client = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
async function run() {
  try {
    const res = await client.interactions.create({
      model: "gemini-3.6-flash",
      input: [
        { type: "text", text: "What is this?" },
        { type: "image", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", mime_type: "image/png" }
      ]
    });
    console.log("SUCCESS:", res.output_text);
  } catch (err) {
    console.error("ERROR", err.message);
  }
}
run();
