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

  // Central Fact Check function
  async function runFactCheck() {
    const textToCheck = selectionDiv.dataset.selection || manualInput.value.trim();
    if (!textToCheck) {
      resultDiv.textContent = "Please select text or type a statement.";
      return false; // failed
    }

    // Show analyzing message
    resultDiv.textContent = "Analyzing . . .";

    // Hide meter during analysis
    meterContainer.classList.add("hidden");
    meterFill.style.width = "0%";

    // Simulate backend/API delay
    await new Promise(r => setTimeout(r, 600));

    // MOCK score and verdict
    const score = Math.floor(Math.random() * 101);
    const verdict =
      score < 30 ? "Likely True" :
      score < 70 ? "Uncertain" :
      "Likely False";

    // Update result
    resultDiv.textContent = `${verdict} (${score} inaccuracy score)`;

    // Save for Insights
    lastScore = score;
    lastVerdict = verdict;

    // Enable Insights button
    insightsBtn.disabled = false;

    // Show meter container
    meterContainer.style.display = "block";
    meterFill.style.width = "0%";       
    void meterFill.offsetWidth;
    
    // Update meter
    meterContainer.classList.remove("hidden");
    meterFill.style.width = `${score}%`;
    if (score < 30) meterFill.style.background = "#34a853";      // Green
    else if (score < 70) meterFill.style.background = "#fbbc05"; // Yellow
    else meterFill.style.background = "#ea4335";                 // Red

    // Hide previous insights
    insightsDiv.classList.add("hidden");
    insightsDiv.textContent = "";
    insightsVisible = false;

    return true;
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
    let explanation = "";
    if (lastScore < 30) explanation = "The statement appears mostly accurate based on AI analysis.";
    else if (lastScore < 70) explanation = "The statement contains some uncertain claims; verify sources.";
    else explanation = "The statement is likely false or misleading.";

    insightsDiv.textContent = explanation;
  });
});
