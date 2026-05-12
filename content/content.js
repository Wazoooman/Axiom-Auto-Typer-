// Content script injected into Google Docs pages
// Receives typing commands from the side panel via messaging

import { MESSAGES } from '../shared/messages.js';

(() => {
  // Listen for START_TYPING and CANCEL_TYPING messages from the side panel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === MESSAGES.START_TYPING) {
      // Panel sends text and config; message forwarding to service worker happens via panel
      // The panel already has the tabId, so it sends directly to service worker
      console.log('Content script received START_TYPING (forwarding responsibility to panel)');
      sendResponse({ success: true });
    } else if (message.action === MESSAGES.CANCEL_TYPING) {
      console.log('Content script received CANCEL_TYPING');
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('Axiom content script loaded on Google Docs');
})();

