// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheckSelection",
    title: "Fact-Check This",
    contexts: ["selection"] // only shows when text is selected
  });
});

// Handle right-click context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "factCheckSelection") {
    const selectedText = info.selectionText; // text user highlighted

    // Option 1: Open popup with prefilled text
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        // Save selected text in window for popup.js to read
        window.__FACTCHECK_SELECTION__ = text;
      },
      args: [selectedText]
    });

    // Open the extension popup programmatically (or just focus it)
    chrome.action.openPopup();
  }
});
