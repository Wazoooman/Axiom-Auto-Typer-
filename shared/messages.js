// Message constants for communication between extension contexts
export const MESSAGES = {
  START_TYPING: 'START_TYPING',
  CANCEL_TYPING: 'CANCEL_TYPING',
  TYPING_PROGRESS: 'TYPING_PROGRESS',
  TYPING_COMPLETE: 'TYPING_COMPLETE',
  TYPING_ERROR: 'TYPING_ERROR',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
};

// Message shapes for documentation
/*
START_TYPING: { text, config, tabId }
  - text: string to type
  - config: { wpm, accuracy, correctionSpeed, breakFrequency, breakMin, breakMax }
  - tabId: tab to attach debugger to

CANCEL_TYPING: {} (no payload)

TYPING_PROGRESS: { charsTyped, totalChars, currentAction }

TYPING_COMPLETE: {} (no payload)

TYPING_ERROR: { error }

GET_SETTINGS: {} (no payload)

SAVE_SETTINGS: { settings } where settings includes preset name and all config values

SETTINGS_UPDATED: { settings }
*/
