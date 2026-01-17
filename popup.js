document.addEventListener("DOMContentLoaded", async () => {
  const selectionDiv = document.getElementById("selection");
  const manualInput = document.getElementById("manualInput");
  const resultDiv = document.getElementById("result");
  const checkBtn = document.getElementById("checkBtn");
  const insightsBtn = document.getElementById("insightsBtn");
  const insightsDiv = document.getElementById("insights");
  const meterContainer = document.getElementById("meter-container");
  const meterFill = document.getElementById("meter-fill");
  const voiceBtn = document.getElementById("voiceBtn");

  // State
  let lastScore = null;
  let insightsVisible = false;

  // Initialize buttons
  insightsBtn.disabled = true;
  voiceBtn.classList.add("hidden");
  voiceBtn.disabled = true;

  // Get highlighted text from page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, func: () => window.getSelection().toString().trim() },
    (res) => {
      const selectedText = res?.[0]?.result || "";
      if (selectedText) {
        selectionDiv.textContent = `Selected: "${selectedText}"`;
        selectionDiv.dataset.selection = selectedText;
        selectionDiv.classList.remove("hidden");
        manualInput.classList.add("hidden");
      } else {
        selectionDiv.classList.add("hidden");
        selectionDiv.dataset.selection = "";
        manualInput.classList.remove("hidden");
      }
    }
  );

async function getAccuracy(sentence) {
  const response = await fetch("http://localhost:5000/api/accuracy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentence })
  });

  const data = await response.json();
  return data.accuracy;
}

async function getInsight(sentence, accuracy) {
  const response = await fetch("http://localhost:5000/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentence, accuracy })
  });

  const data = await response.json();
  return data.insight;
}

  // Fact Check function
  async function runFactCheck() {
  const textToCheck = selectionDiv.dataset.selection || manualInput.value.trim();
  if (!textToCheck) {
    resultDiv.textContent = "Please select text or type a statement.";
    return false;
  }

  resultDiv.textContent = "Analyzing . . .";
  meterContainer.classList.add("hidden");
  meterFill.style.width = "0%";

  try {
    const score = await getAccuracy(textToCheck);   

    const verdict =
      score < 30 ? "Likely True" :
      score < 70 ? "Uncertain" :
      "Likely False";

    resultDiv.textContent = `${verdict} (${score} inaccuracy score)`;

    lastScore = score;
    insightsBtn.disabled = false;

    // Show meter
    meterContainer.classList.remove("hidden");
    meterContainer.style.display = "block";

    // Reset animation
    meterFill.style.width = "0%";
    void meterFill.offsetWidth;

    // Special case: -1 (Not a statement)
    if (score === -1) {
      meterFill.style.width = "100%";
      meterFill.style.background = "#000"; // Black
      resultDiv.textContent = "Not a factual statement (N/A)";
    } 
    else {
      meterFill.style.width = `${score}%`;

      if (score < 30) meterFill.style.background = "#34a853";      // Green
      else if (score < 70) meterFill.style.background = "#fbbc05"; // Yellow
      else meterFill.style.background = "#ea4335"; 
    }

    // Hide insights and voice button
    insightsDiv.classList.add("hidden");
    insightsDiv.textContent = "";
    insightsVisible = false;
    voiceBtn.classList.add("hidden");
    voiceBtn.disabled = true;

    return true;

    } catch (err) {
    console.error(err);
    resultDiv.textContent = "Backend error. Flask running?";
    return false;
    }
  }

  function resetMeter() {
    meterContainer.classList.add("hidden");
    meterFill.style.width = "0%";
  }

  checkBtn.addEventListener("click", () => runFactCheck());

  // Insights Button 
  insightsBtn.addEventListener("click", async () => {
    if (insightsVisible) {
      // Toggle off
      insightsDiv.classList.add("hidden");
      insightsVisible = false;
      voiceBtn.classList.add("hidden");
      return;
    }

    // Run Fact Check first if not run yet
    if (lastScore === null) {
      const success = await runFactCheck();
      if (!success) return;
    }

    // Show analyzing message in Insights
    insightsDiv.textContent = "Analyzing . . .";
    insightsDiv.classList.remove("hidden");
    insightsVisible = true;

    // Allow browser to render
    await new Promise(r => setTimeout(r, 100));

    const textToCheck = selectionDiv.dataset.selection || manualInput.value.trim();

    try {
      const explanation = await getInsight(textToCheck, lastScore);
      insightsDiv.textContent = explanation;
    } catch (err) {
      console.error(err);
      insightsDiv.textContent = "Failed to load insights.";
    }

    // Show and enable voice button
    voiceBtn.classList.remove("hidden");
    voiceBtn.disabled = false;
  });

  // Voice Button 
  voiceBtn.addEventListener("click", async () => {
    if (!insightsDiv.textContent) return;

    voiceBtn.disabled = true;
    voiceBtn.textContent = "Playing...";

    try {
      const API_KEY = "sk_4aecdfc1033414a9cffea1649a2023a201764f4afbf9662d"; 
      const VOICE_ID = "8IbUB2LiiCZ85IJAHNnZ";
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": API_KEY
        },
        body: JSON.stringify({
          text: insightsDiv.textContent,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });

      const audioBlob = await response.blob();
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);
      audio.play();

      audio.onended = () => {
        voiceBtn.disabled = false;
        voiceBtn.textContent = "Listen";
      };
    } catch (err) {
      console.error("TTS error:", err);
      voiceBtn.disabled = false;
      voiceBtn.textContent = "Listen";
    }
  });
});
