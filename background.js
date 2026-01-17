// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheckSelection",
    title: "Fact-Check This",
    contexts: ["selection"] // only shows when txt is selected
  });
});

// Handle right-click menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "factCheckSelection") {
    const selectedText = info.selectionText; // highlighted txt

    // Open popup with prefilled txt
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        // Save selected txt in window 
        window.__FACTCHECK_SELECTION__ = text;
      },
      args: [selectedText]
    });

    chrome.action.openPopup();
  }
});
