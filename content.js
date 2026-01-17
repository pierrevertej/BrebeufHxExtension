document.addEventListener("mouseup", (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Remove existing bubble if it exists
  const oldBubble = document.getElementById("fact-check-bubble");
  if (oldBubble) oldBubble.remove();

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create the bubble element
    const bubble = document.createElement("div");
    bubble.id = "fact-check-bubble";
    bubble.innerText = "🔍 Check Fact";
    
    // Position it above the selection
    bubble.style.position = "fixed";
    bubble.style.top = `${rect.top - 30 + window.scrollY}px`;
    bubble.style.left = `${rect.left + (rect.width / 2)}px`;
    bubble.style.transform = "translateX(-50%)";
    bubble.style.zIndex = "9999";

    // Handle clicking the bubble
    bubble.onclick = () => {
      alert(`Analyzing: "${selectedText}"`);
      // Here you would send a message to background.js to call your API
      bubble.remove();
    };

    document.body.appendChild(bubble);
  }
});

// Remove bubble when clicking elsewhere
document.addEventListener("mousedown", (e) => {
  if (e.target.id !== "fact-check-bubble") {
    const oldBubble = document.getElementById("fact-check-bubble");
    if (oldBubble) oldBubble.remove();
  }
});