// Content script injected into Google Docs pages
// Injects launcher pill and handles messaging with the side panel

import { MESSAGES } from '../shared/messages.js';

(() => {
  /**
   * Inject floating panel as iframe
   */
  function injectPanel() {
    // Container for floating panel
    const panelContainer = document.createElement('div');
    panelContainer.id = 'axiom-panel-container';
    panelContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create iframe for panel
    const iframe = document.createElement('iframe');
    iframe.id = 'axiom-panel-iframe';
    iframe.src = chrome.runtime.getURL('panel/panel.html');
    iframe.style.cssText = `
      border: none;
      width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    `;

    panelContainer.appendChild(iframe);
    document.body.appendChild(panelContainer);
    console.log('Axiom panel injected as iframe');
  }

  /**
   * Inject trigger button (separate circle at bottom-right)
   */
  function injectTriggerButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'axiom-trigger-container';
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 420px;
      right: 20px;
      z-index: 999999;
    `;

    // Attach shadow DOM for button
    const shadow = buttonContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .axiom-trigger-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        padding: 0;
      }

      .axiom-trigger-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .axiom-trigger-btn:active {
        transform: scale(0.95);
      }

      .axiom-trigger-btn svg {
        color: #000;
      }
    `;
    shadow.appendChild(style);

    const button = document.createElement('button');
    button.className = 'axiom-trigger-btn';
    button.title = 'Axiom AutoTyper';

    // Graduation cap SVG icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    // Graduation cap path (simplified)
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M4 10l8-6 8 6m-8 0v12m0 0H4m8 0h8m-8-12l-8 6m8-6l8 6');
    
    svg.appendChild(path1);
    button.appendChild(svg);

    button.addEventListener('click', () => {
      const panelContainer = document.getElementById('axiom-panel-container');
      if (panelContainer) {
        panelContainer.style.display = panelContainer.style.display === 'none' ? 'block' : 'none';
      }
    });

    shadow.appendChild(button);
    document.body.appendChild(buttonContainer);
    console.log('Axiom trigger button injected');
  }

  /**
   * Wait for DOM and inject both panel and trigger button
   */
  function waitForDomAndInject() {
    if (document.body) {
      injectPanel();
      injectTriggerButton();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        injectPanel();
        injectTriggerButton();
      });
    }
  }

  waitForDomAndInject();

  // Listen for messages from panel iframe
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === MESSAGES.START_TYPING) {
      console.log('Content script received START_TYPING');
      sendResponse({ success: true });
    } else if (message.action === MESSAGES.CANCEL_TYPING) {
      console.log('Content script received CANCEL_TYPING');
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('Axiom content script loaded on Google Docs');
})();

