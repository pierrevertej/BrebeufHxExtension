document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const selectionDiv = document.getElementById("selection");
  const manualInput = document.getElementById("manualInput");
  const resultDiv = document.getElementById("result");
  const checkBtn = document.getElementById("checkBtn");
  const insightsBtn = document.getElementById("insightsBtn");
  const insightsDiv = document.getElementById("insights");
  const meterContainer = document.getElementById("meter-container");
  const meterFill = document.getElementById("meter-fill");

  // State
  let lastScore = null;
  let lastVerdict = null;
  let insightsVisible = false;

  // Initially disable Insights button
  insightsBtn.disabled = true;

  // Get highlighted text from the page
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

  // Central Fact Check function
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
    const score = await getAccuracy(textToCheck);   // ✅ await

    const verdict =
      score < 30 ? "Likely True" :
      score < 70 ? "Uncertain" :
      "Likely False";

    resultDiv.textContent = `${verdict} (${score} inaccuracy score)`;

    lastScore = score;
    lastVerdict = verdict;
    insightsBtn.disabled = false;

    // Show meter
    meterContainer.classList.remove("hidden");
    meterContainer.style.display = "block";

    // Reset animation
    meterFill.style.width = "0%";
    void meterFill.offsetWidth;

    // Special case: -1 (Not a factual statement)
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

    insightsDiv.classList.add("hidden");
    insightsVisible = false;

    return true;

  } catch (err) {
    console.error(err);
    resultDiv.textContent = "Backend error. Is Flask running?";
    return false;
  }
}


  // Fact Check button
  checkBtn.addEventListener("click", () => runFactCheck());

  // Insights button (toggleable, auto-Fact Check if needed)
  insightsBtn.addEventListener("click", async () => {
    if (insightsVisible) {
      // Toggle off
      insightsDiv.classList.add("hidden");
      insightsVisible = false;
      return;
    }

    // Run Fact Check first if not run yet
    if (lastScore === null) {
      const success = await runFactCheck();
      if (!success) return; // no text entered
    }

    // Show analyzing message in Insights
    insightsDiv.textContent = "Analyzing . . .";
    insightsDiv.classList.remove("hidden");
    insightsVisible = true;

    // Allow browser to render "Analyzing…"
    await new Promise(r => setTimeout(r, 100));

    // MOCK explanation based on score
    const textToCheck = selectionDiv.dataset.selection || manualInput.value.trim();

    try {
      const explanation = await getInsight(textToCheck, lastScore);
      insightsDiv.textContent = explanation;
    } catch (err) {
      console.error(err);
      insightsDiv.textContent = "Failed to load insights.";
    }
  });
});
