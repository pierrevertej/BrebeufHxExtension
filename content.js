/**
 * CONTENT SCRIPT
 * Responsibilities: UI, Selection Detection, Shadow DOM.
 */

const container = document.createElement("div");
container.id = "fact-check-extension-container";
const shadow = container.attachShadow({ mode: "open" });

// Add styles to the Shadow DOM so the website doesn't break our UI
const style = document.createElement("style");
style.textContent = `
  #bubble {
    position: fixed;
    pointer-events: auto;
    background: #ffffff;
    color: #333;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 2147483649;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    border: 1px solid #ddd;
    width: 180px;
    transition: opacity 0.2s;
  }
  .meter-bg {
    width: 100%;
    background: #eee;
    border-radius: 5px;
    height: 8px;
    margin: 8px 0;
  }
  #meter-fill {
    width: 0%; 
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease, background 0.5s;
  }
  .label { font-size: 12px; font-weight: bold; }
  .status { font-size: 10px; color: #666; }
  #fact-check-extension-container {
  pointer-events: none; /* Let clicks pass through the container... */
  }
  #bubble {
  pointer-events: auto; /* ...but stop at the bubble itself! */
  }
`;
shadow.appendChild(style);
document.body.appendChild(container);

document.addEventListener("mouseup", (e) => {
  const selection = window.getSelection().toString().trim();
  
  // Remove bubble if clicking away
  if (!selection) {
    const existing = shadow.getElementById("bubble");
    if (existing) existing.remove();
    return;
  }

  // Create/Position the bubble
  let bubble = shadow.getElementById("bubble");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "bubble";
    shadow.appendChild(bubble);
  }

  bubble.style.top = `${e.clientY + 10}px`;
  bubble.style.left = `${e.clientX}px`;
  bubble.innerHTML = `<div class="label">🔍 Analyze Claim</div>`;

  // Trigger Fact Check on Click
  bubble.onclick = (event) => {
  debugger;
  event.stopPropagation(); // Prevents the click from "falling through" to the page
  
  console.log("Bubble clicked!"); // Check if this appears in the main F12 console
  
  chrome.runtime.sendMessage({ action: "factCheck", text: selection }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Connection Error:", chrome.runtime.lastError.message);
      return;
    }
    updateUI(response.score, response.verdict);
  });
};
});

function updateUI(score, verdict) {
  const fill = shadow.getElementById("meter-fill");
  const status = shadow.getElementById("status-text");
  
  fill.style.width = `${score}%`;
  status.innerText = `${verdict} (${score}% inaccuracy)`;

  // Color logic
  if (score < 30) fill.style.background = "#34a853"; // Green
  else if (score < 70) fill.style.background = "#fbbc05"; // Yellow
  else fill.style.background = "#ea4335"; // Red
}