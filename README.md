# Axiom AutoTyper

A Chrome extension (Manifest V3) that types text into Google Docs with humanized typing behavior. The goal is to make version history look like a human wrote the document over time, not like it was pasted in.

## Features

- **Configurable typing speed**: 0.5x to 3x multiplier on preset WPM
- **Realistic typos**: Randomly injects typos (adjacent keys, transpositions, skips, doubles) then corrects them
- **Humanized delays**: Jittered inter-character delays to simulate realistic typing patterns
- **Strategic breaks**: Pauses between words/sentences to simulate thinking
- **Age/skill presets**: 7 preset configurations from "Beginner 12-16 Years Old" to "Fast"
- **Advanced settings**: Fine-tune WPM, accuracy, correction speed, break frequency, and break durations

## What Works (v1 Vertical Slice)

✅ Extension loads and injects launcher pill on docs.google.com/document/*  
✅ Launcher pill opens/closes side panel  
✅ Panel UI matches design (all static elements visible)  
✅ Advanced settings modal: load presets, customize values, persist to storage  
✅ Typing engine: generates realistic action sequences with typos, delays, breaks  
✅ Service worker: attaches chrome.debugger, dispatches key events to Google Docs  
✅ Progress reporting: shows char count and progress bar during typing  
✅ Cancel button: stops typing mid-sequence  

## What's Stubbed (Not Implemented in v1)

❌ **Humanize button**: Stays disabled, no-op  
❌ **Formatting toolbar**: Buttons render but don't apply formatting  
❌ **Pro tier gating**: All features unlocked regardless of "Pro Mode" toggle  
❌ **Text highlighting**: Can't select a portion of text to type (types entire input)  
❌ **Backend**: No auth, payments, telemetry, or analytics  
❌ **Firefox/Edge**: Chrome only  
❌ **Other sites**: Google Docs only  

## Installation

### Load Unpacked (Development)

1. Clone or extract this repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (toggle top-right)
4. Click **Load unpacked**
5. Select the `axiom-autotyper/` folder
6. The Axiom icon should appear in your extensions tray

### Usage

1. Open a Google Doc at `https://docs.google.com/document/...`
2. Look for the **Axiom** pill (white + pink/magenta border) at bottom-right
3. Click the pill to open the side panel
4. Paste text into the textarea or type directly
5. Click **Start Typing** 
   - If skip confirmation is off (default): confirmation modal appears; click into your doc within 5s, typing auto-starts
   - If skip confirmation is on: typing starts immediately (make sure the doc has focus)
6. Watch the progress bar. Click **Cancel** to stop anytime.

## Settings

### Presets

- **Beginner 12-16 Years Old**: 25 WPM, 80% accuracy, high break frequency
- **Intermediate 12-16 Years Old** (default): 40 WPM, 88% accuracy, medium breaks
- **Expert 12-16 Years Old**: 65 WPM, 95% accuracy, low breaks
- **Beginner 17+ Years Old**: 35 WPM, 85% accuracy, high breaks
- **Intermediate 17+ Years Old**: 55 WPM, 92% accuracy, medium breaks
- **Expert 17+ Years Old**: 80 WPM, 97% accuracy, low breaks
- **Fast**: 120 WPM, 99% accuracy, minimal breaks

Open **Advanced settings** to pick a preset or customize individual values. Any manual edit switches the preset to **Custom**.

### Speed Slider (Main Panel)

Multiplies the preset WPM by 0.5x–3x. Default 1.00x. This is a convenience to slow down or speed up without re-configuring each value.

### Advanced Settings Fields

- **Preset**: Dropdown to select a pre-configured profile
- **Words per minute (WPM)**: 15–150. Base typing speed.
- **Accuracy**: 0–100%. Probability a character is typed correctly (lower = more typos).
- **Correction speed**: 0.1–10 seconds. Delay before backspacing and retyping a typo.
- **Break frequency**: 0–100%. Chance a pause is inserted after a space or punctuation.
- **Break durations**: Min–max in seconds. Length of pauses (uniformly sampled in range).

## Running Tests

### Typing Engine Unit Tests

The typing engine is pure JavaScript (no Chrome API dependencies), making it easily testable.

```bash
cd axiom-autotyper
node tests/typing-engine.test.js
```

Expected output:
```
Running Typing Engine Tests

Test: Basic character typing...
  ✓ Passed
Test: Hello World with 100% accuracy and no breaks...
  ✓ Passed
...
✅ All tests passed!
```

**What the tests validate:**
- Character and special character typing
- Capital letter shift handling
- Spaces, newlines, punctuation
- Break frequency scheduling
- Accuracy/typo injection
- WPM-based delay calculation
- Reproducibility with same seed

## Technical Details

### Architecture

```
axiom-autotyper/
  manifest.json                    # Manifest V3 definition
  background/
    service-worker.js              # Debugger attach/detach, message routing
    typing-engine.js               # Pure typing logic (testable)
    presets.js                     # Preset definitions
  content/
    content.js                     # Injects launcher pill + panel iframe
    launcher.css                   # Launcher pill styles
  panel/
    panel.html                     # Side panel UI
    panel.js                        # Panel state, messaging
    panel.css                       # Panel styles
    advanced.html                  # (Advanced settings now in modal within panel.html)
    advanced.js                    # (Logic in panel.js)
  shared/
    storage.js                     # chrome.storage.local wrapper
    messages.js                    # Message constants
  icons/
    16.png, 32.png, 48.png, 128.png
  tests/
    typing-engine.test.js          # Unit tests (Node.js)
  README.md                         # This file
```

### Key Decisions

**Chrome Debugger API**  
The extension uses `chrome.debugger.attach()` and `Input.dispatchKeyEvent` to type into Google Docs. Why?

- Google Docs runs on a canvas with a hidden iframe input layer and ignores untrusted keyboard events (e.g., `dispatchEvent(new KeyboardEvent())`).
- The debugger API produces trusted events at the browser level, which register in Docs version history as actual typing.
- **Known limitation**: Chrome displays a yellow "Extension is debugging this browser" banner while typing is active. This is unavoidable without a native messaging host.

**Pure Typing Engine**  
The `TypingEngine` class takes text and config, returns an action sequence. It has no Chrome dependencies, making it unit-testable in Node.js without a browser.

**Action Sequence**  
Each action specifies:
- `type`: `'keydown'`, `'keyup'`, or `'pause'`
- `key`, `code`: Keyboard event keys
- `text`: Printable character (for keydown)
- `delay`: Milliseconds to wait before dispatching
- `duration`: For pauses

The service worker loops through actions, awaiting delays, then calling `chrome.debugger.sendCommand()`.

**Content Script + Shadow DOM**  
The launcher pill is injected into a Shadow DOM to isolate styles and avoid Google Docs CSS conflicts. The panel is an iframe for the same reason.

**Message Passing**  
- Panel → Service Worker: `START_TYPING`, `CANCEL_TYPING`
- Service Worker → Panel: `TYPING_PROGRESS`, `TYPING_COMPLETE`, `TYPING_ERROR`
- Storage: `chrome.storage.local` (settings persist across sessions)

### Typo Algorithm

For each character, with probability `(1 - accuracy)`:
1. Pick a typo type (weighted):
   - 60% **adjacent key**: type a neighboring QWERTY key
   - 20% **transposition**: swap with next character
   - 15% **missed letter**: skip it, correct later
   - 5% **double letter**: type it twice, backspace once
2. Type the typo
3. Continue typing 0–4 more characters
4. Backspace to the error
5. Retype correctly
6. Delay before correction = `correctionSpeed ± jitter`

### Delay Jittering

Base delay per character: `60000 / (wpm * 5)` milliseconds (5 chars = 1 word)  
Jitter: ±20% of base delay  
Result: Delays are randomized but deterministic (seeded PRNG) for reproducibility

## Known Limitations & Future Work

**Known Limitations:**
- Yellow "debugger active" banner shown while typing (unavoidable without native host)
- Can't target a highlighted portion of text (always types full input)
- Humanize button non-functional (would ideally call a backend API in a real product)
- No auth/Pro tier (all features unlocked)
- Text highlighting in Google Docs for partial-text typing not supported

**Next Steps (Post-v1):**
1. **Humanize API endpoint**: Backend to process text and return optimal settings
2. **Pro gating**: Implement login, track free sessions, upsell
3. **Text selection**: Detect highlighted text in Google Docs, type only that portion
4. **Error handling polish**: Retry logic, better error messages, logging
5. **Performance**: Profile typing engine for very large texts (>10K chars)
6. **Formatting**: Implement toolbar buttons (bold, italic, etc.) using `chrome.debugger`
7. **Testing**: Add integration tests that spin up a real Google Doc iframe
8. **Analytics**: (if needed) Track usage, feature adoption, errors
9. **Firefox port**: Manifest V2 equivalent, test on Firefox
10. **UX polish**: Animations, tooltips, empty state, loading states

## Manifest Permissions Explained

```json
{
  "permissions": ["debugger", "storage", "activeTab", "scripting"],
  "host_permissions": ["https://docs.google.com/*"]
}
```

- **`debugger`**: Allows `chrome.debugger.attach()` to dispatch key events
- **`storage`**: Allows `chrome.storage.local` for settings persistence
- **`activeTab`**: Allows accessing the active tab's ID
- **`scripting`**: Allows content script injection
- **`host_permissions`**: Restricts debugger/content script to Google Docs only

## Debugging Tips

**Extension not loading?**
- Check for manifest errors: `chrome://extensions/` should show details
- Ensure `manifest_version: 3`
- Verify all file paths are relative to the manifest

**Typing not working?**
- Check DevTools (F12) > **Console** tab in the **Service Worker** context (chrome://extensions > Axiom > "Service Worker" link)
- Ensure the Google Doc tab is focused when typing starts
- Try the confirmation modal to ensure you have time to click into the doc

**Typos not appearing?**
- Check advanced settings: **Accuracy** < 100% enables typos
- Verify `correctionSpeed` is reasonable (1–2s is typical)
- Test with a simple text like "hello" at 50% accuracy

**Timing issues?**
- Adjust **WPM** and **Correction speed** in advanced settings
- Run tests to verify the engine: `node tests/typing-engine.test.js`

## Development

### File Structure Notes

- **ES Modules**: All code uses `import`/`export`. Service worker has `"type": "module"` in manifest.
- **No build step**: Code is vanilla JavaScript, directly inspectable in DevTools.
- **No dependencies**: Zero runtime dependencies. Test runner uses Node.js built-in `assert` module.

### To Add a New Preset

Edit `background/presets.js`:
```javascript
export const PRESETS = {
  'My Custom Preset': {
    wpm: 50,
    accuracy: 90,
    correctionSpeed: 1.2,
    breakFrequency: 20,
    breakMin: 0.8,
    breakMax: 2.5,
  },
  // ...
};
```

The preset will automatically appear in the Advanced Settings dropdown.

### To Extend Typo Types

Edit `background/typing-engine.js`, method `injectTypo()`. Current types (60%, 20%, 15%, 5%) can be rebalanced or new types added (e.g., phonetic errors).

## License

Unlicensed (example/educational project). Use freely.

---

**Status**: v1 Vertical Slice  
**Last Updated**: May 2026  
**Browser**: Chrome/Chromium (Manifest V3)
