const { GoogleGenAI } = require("@google/genai");
const client = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
async function run() {
  try {
    const res = await client.interactions.create({
      model: "gemini-3.6-flash",
      input: "What is the recipe in this tiktok video? https://www.tiktok.com/@gordonramsayofficial/video/7331580211158568224",
      tools: [{ type: "google_search" }]
    });
    console.log("SUCCESS:", res.output_text);
  } catch (err) {
    console.error("ERROR", err.message);
  }
}
run();
