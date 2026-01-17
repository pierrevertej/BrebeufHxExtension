document.addEventListener("DOMContentLoaded", async () => {
  const selectionDiv = document.getElementById("selection");
  const manualInput = document.getElementById("manualInput");
  const resultDiv = document.getElementById("result");
  const checkBtn = document.getElementById("checkBtn");
  const insightsBtn = document.getElementById("insightsBtn");
  const insightsDiv = document.getElementById("insights");

  let lastScore = null;
  let lastVerdict = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Load highlighted text
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

  // Fact Check button
  checkBtn.addEventListener("click", () => {
    const textToCheck = selectionDiv.dataset.selection || manualInput.value.trim();
    if (!textToCheck) {
      resultDiv.textContent = "Please select text or type a statement.";
      return;
    }

    // MOCK score
    const score = Math.floor(Math.random() * 101);
    const verdict =
      score < 30 ? "Likely True" :
      score < 70 ? "Uncertain" :
      "Likely False";

    resultDiv.textContent = `${verdict} (${score}% inaccuracy score)`;

    // Save for Insights
    lastScore = score;
    lastVerdict = verdict;

    // Hide previous insights
    insightsDiv.classList.add("hidden");
    insightsDiv.textContent = "";
  });

  // Insights button
  insightsBtn.addEventListener("click", () => {
    if (lastScore === null) {
      insightsDiv.textContent = "Run a fact check first!";
      insightsDiv.classList.remove("hidden");
      return;
    }

    // Generate explanation (mock)
    let explanation = "";
    if (lastScore < 30) explanation = "The statement appears mostly accurate based on AI analysis.";
    else if (lastScore < 70) explanation = "The statement contains some uncertain claims; verify sources.";
    else explanation = "The statement is likely false or misleading.";

    insightsDiv.textContent = explanation;
    insightsDiv.classList.remove("hidden");
  });
});
