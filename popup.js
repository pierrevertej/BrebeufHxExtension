document.addEventListener("DOMContentLoaded", async () => {
  const selectionDiv = document.getElementById("selection");
  const resultDiv = document.getElementById("result");
  const checkBtn = document.getElementById("checkBtn");

  // Get selected text from content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    },
    (res) => {
      const text = res[0].result || "";
      selectionDiv.textContent = text || "No text selected.";
      selectionDiv.dataset.selection = text;
    }
  );

  checkBtn.addEventListener("click", () => {
    const text = selectionDiv.dataset.selection;
    if (!text) {
      resultDiv.textContent = "No text selected!";
      return;
    }

    // MOCK fact-checking logic
    // Later we will replace this with AI API calls
    let mockScore = Math.floor(Math.random() * 101);
    let mockVerdict = mockScore < 30 ? "Likely True" :
                      mockScore < 70 ? "Uncertain" :
                      "Likely False";

    resultDiv.textContent = `${mockVerdict} (${mockScore}% inaccuracy)`;
  });
});
