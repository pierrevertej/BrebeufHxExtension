document.addEventListener("mouseup", () => {
  const text = window.getSelection().toString().trim();

  if (text) {
    chrome.storage.session.set({ lastSelection: text });
  }
});
