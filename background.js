/**
 * BACKGROUND SERVICE WORKER
 * Responsibilities: API Calls, Consensus Logic, Security.
 */

const GEMINI_API_KEY = "YOUR_GEMINI_KEY";
const OPENAI_API_KEY = "YOUR_OPENAI_KEY";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "factCheck") {
    runMultiModelCheck(request.text).then(sendResponse);
    return true; // Required to keep the message channel open for async
  }
});

async function runMultiModelCheck(text) {
  const prompt = `Analyze this claim: "${text}". 
  Respond ONLY in JSON format: {"score": 0-100, "verdict": "string"}. 
  Score 0 is definitely true, 100 is definitely false.`;

  try {
    // Call both models simultaneously
    const [gemini, openai] = await Promise.allSettled([
      callGemini(prompt),
      callOpenAI(prompt)
    ]);

    const results = [];
    if (gemini.status === "fulfilled") results.push(gemini.value);
    if (openai.status === "fulfilled") results.push(openai.value);

    if (results.length === 0) throw new Error("Both AI models failed.");

    // Calculate Average (The Consensus)
    const avgScore = results.reduce((a, b) => a + b.score, 0) / results.length;
    const finalVerdict = results[0].verdict; // Use the first model's description

    return { score: avgScore, verdict: finalVerdict };

  } catch (error) {
    return { error: error.message };
  }
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function callOpenAI(prompt) {
  // Logic would be similar to Gemini but using OpenAI's endpoint
  // Replace with your OpenAI fetch logic if using both
  return { score: 50, verdict: "Simulated OpenAI Result" }; 
}