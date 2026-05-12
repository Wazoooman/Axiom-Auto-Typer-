// Typing engine: generates a sequence of timed actions simulating humanized typing
// This is a pure module with no Chrome API dependencies, making it testable

/**
 * Seedable pseudo-random number generator for reproducible behavior
 */
class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextRange(min, max) {
    return min + this.next() * (max - min);
  }
}

/**
 * QWERTY keyboard adjacency map for typo generation
 */
const QWERTY_NEIGHBORS = {
  a: ['s', 'q', 'w', 'z', 'x'],
  b: ['v', 'g', 'h', 'n', 'm'],
  c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'c', 'f', 'x'],
  e: ['w', 'r', 'd', 's'],
  f: ['d', 'r', 't', 'c', 'g', 'v'],
  g: ['f', 't', 'y', 'v', 'h', 'b'],
  h: ['g', 'y', 'u', 'b', 'j', 'n'],
  i: ['u', 'o', 'k', 'j'],
  j: ['h', 'u', 'i', 'm', 'k', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'],
  m: ['n', 'j', 'k'],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'p', 'l', 'k'],
  p: ['o', 'l'],
  q: ['w', 'a'],
  r: ['e', 't', 'd', 'f'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'y', 'f', 'g'],
  u: ['y', 'i', 'j', 'k'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'e', 'a', 's'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'u', 'g', 'h'],
  z: ['a', 's', 'x'],
};

/**
 * Special character to keyboard event mapping
 */
const SPECIAL_CHAR_MAP = {
  ' ': { key: ' ', code: 'Space', text: ' ', virtualKeyCode: 32 },
  '.': { key: '.', code: 'Period', text: '.', virtualKeyCode: 190, shift: false },
  ',': { key: ',', code: 'Comma', text: ',', virtualKeyCode: 188, shift: false },
  '!': { key: '!', code: 'Digit1', text: '!', virtualKeyCode: 49, shift: true },
  '?': { key: '?', code: 'Slash', text: '?', virtualKeyCode: 191, shift: true },
  "'": { key: "'", code: 'Quote', text: "'", virtualKeyCode: 222, shift: false },
  '"': { key: '"', code: 'Quote', text: '"', virtualKeyCode: 222, shift: true },
  '\n': { key: 'Enter', code: 'Enter', virtualKeyCode: 13 },
  '\t': { key: 'Tab', code: 'Tab', virtualKeyCode: 9 },
};

/**
 * TypingEngine: pure module for generating typing action sequences
 */
export class TypingEngine {
  constructor(text, config = {}) {
    this.text = text;
    this.config = {
      wpm: config.wpm || 40,
      accuracy: config.accuracy || 0.95, // 0-1
      correctionSpeed: config.correctionSpeed || 1.0,
      breakFrequency: config.breakFrequency || 0.25, // 0-1
      breakMin: config.breakMin || 0.5,
      breakMax: config.breakMax || 2.0,
      seed: config.seed || Date.now(),
    };
    
    this.rng = new SeededRandom(this.config.seed);
    this.charIndex = 0;
    this.actions = [];
    this.typos = new Set(); // Track positions we've already marked as typo
  }

  /**
   * Generate complete action sequence
   */
  generate() {
    const baseDelay = 60000 / (this.config.wpm * 5); // ms per character
    
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      
      // Typo injection (use seeded RNG for reproducibility)
      if (this.rng.next() < (1 - this.config.accuracy)) {
        this.injectTypo(i, baseDelay);
      }
      
      // Type the character
      this.typeCharacter(char, baseDelay);
      
      // Break scheduling (on space or punctuation)
      if (char === ' ' || char === '.' || char === '!') {
        if (this.rng.next() < this.config.breakFrequency) {
          const breakDuration = this.rng.nextRange(this.config.breakMin, this.config.breakMax);
          this.actions.push({
            type: 'pause',
            duration: Math.round(breakDuration * 1000),
          });
        }
      }
    }
    
    return this.actions;
  }

  /**
   * Inject a typo at the current position
   */
  injectTypo(pos, baseDelay) {
    if (this.typos.has(pos)) return;
    this.typos.add(pos);
    
    const char = this.text[pos].toLowerCase();
    const typoType = this.rng.next(); // Use seeded RNG
    let typoChar;

    if (typoType < 0.6) {
      // Adjacent key (60%)
      const neighbors = QWERTY_NEIGHBORS[char] || [];
      if (neighbors.length > 0) {
        const idx = Math.floor(this.rng.next() * neighbors.length);
        typoChar = neighbors[idx];
      } else {
        return; // No neighbors, skip typo
      }
    } else if (typoType < 0.8) {
      // Transposition (20%): type next char, then come back
      if (pos + 1 < this.text.length) {
        typoChar = this.text[pos + 1].toLowerCase();
      } else {
        return;
      }
    } else if (typoType < 0.95) {
      // Missed letter (15%): skip this one, fix later
      // Don't type it at all, but continue to next
      this.typeCharacter(this.text[pos + 1] || '', baseDelay);
      // Correction pass will fix it
      setTimeout(() => this.correctTypo(pos, baseDelay), this.config.correctionSpeed * 1000);
      return;
    } else {
      // Double letter (5%): type the same character twice
      this.typeCharacter(char, baseDelay);
      this.typeCharacter(char, baseDelay);
      
      // Correct by backspacing one
      this.backspace(baseDelay);
      return;
    }

    // Type the typo character
    this.typeCharacter(typoChar, baseDelay);
    
    // Correct after some delay
    const charsAfterTypo = Math.floor(this.rng.nextRange(0, 4));
    const correctionDelay = this.config.correctionSpeed * 1000 + this.rng.nextRange(-100, 100);
    
    // Type 0-4 more characters before correcting
    for (let i = 0; i < charsAfterTypo && pos + 1 + i < this.text.length; i++) {
      this.typeCharacter(this.text[pos + 1 + i], baseDelay);
    }
    
    // Then backspace and correct
    setTimeout(() => {
      for (let i = 0; i < charsAfterTypo + 1; i++) {
        this.backspace(baseDelay);
      }
      this.typeCharacter(char, baseDelay);
    }, correctionDelay);
  }

  /**
   * Correct a typo at a position
   */
  correctTypo(pos, baseDelay) {
    // Backspace and retype
    this.backspace(baseDelay);
    this.typeCharacter(this.text[pos], baseDelay);
  }

  /**
   * Type a single character with shift handling
   */
  typeCharacter(char, baseDelay) {
    if (!char) return;

    const isSpecial = SPECIAL_CHAR_MAP[char];
    
    if (isSpecial) {
      if (isSpecial.shift) {
        // Hold shift (keydown)
        this.actions.push({
          type: 'keydown',
          key: 'Shift',
          code: 'ShiftLeft',
          delay: Math.round(baseDelay * 0.5),
        });
      }
      
      // Type the special character
      this.actions.push({
        type: 'keydown',
        key: isSpecial.key,
        code: isSpecial.code,
        text: isSpecial.text,
        delay: Math.round(baseDelay + this.rng.nextRange(-baseDelay * 0.2, baseDelay * 0.2)),
      });
      
      this.actions.push({
        type: 'keyup',
        key: isSpecial.key,
        code: isSpecial.code,
        delay: Math.round(baseDelay * 0.3),
      });
      
      if (isSpecial.shift) {
        // Release shift (keyup)
        this.actions.push({
          type: 'keyup',
          key: 'Shift',
          code: 'ShiftLeft',
          delay: Math.round(baseDelay * 0.3),
        });
      }
    } else if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      // Capital letter: shift down, letter, shift up
      this.actions.push({
        type: 'keydown',
        key: 'Shift',
        code: 'ShiftLeft',
        delay: Math.round(baseDelay * 0.5),
      });
      
      const lowerChar = char.toLowerCase();
      this.actions.push({
        type: 'keydown',
        key: lowerChar,
        code: `Key${char.toUpperCase()}`,
        text: char,
        delay: Math.round(baseDelay + this.rng.nextRange(-baseDelay * 0.2, baseDelay * 0.2)),
      });
      
      this.actions.push({
        type: 'keyup',
        key: lowerChar,
        code: `Key${char.toUpperCase()}`,
        delay: Math.round(baseDelay * 0.3),
      });
      
      this.actions.push({
        type: 'keyup',
        key: 'Shift',
        code: 'ShiftLeft',
        delay: Math.round(baseDelay * 0.3),
      });
    } else {
      // Regular lowercase letter
      const lowerChar = char.toLowerCase();
      this.actions.push({
        type: 'keydown',
        key: lowerChar,
        code: `Key${lowerChar.toUpperCase()}`,
        text: lowerChar,
        delay: Math.round(baseDelay + this.rng.nextRange(-baseDelay * 0.2, baseDelay * 0.2)),
      });
      
      this.actions.push({
        type: 'keyup',
        key: lowerChar,
        code: `Key${lowerChar.toUpperCase()}`,
        delay: Math.round(baseDelay * 0.3),
      });
    }
  }

  /**
   * Add backspace action
   */
  backspace(baseDelay) {
    const delay = Math.round(baseDelay * 1.5); // Backspace slightly slower
    this.actions.push({
      type: 'keydown',
      key: 'Backspace',
      code: 'Backspace',
      delay,
    });
    this.actions.push({
      type: 'keyup',
      key: 'Backspace',
      code: 'Backspace',
      delay: Math.round(baseDelay * 0.3),
    });
  }
}

/**
 * Generator version for streaming actions (useful for testing)
 */
export function* typingGenerator(text, config) {
  const engine = new TypingEngine(text, config);
  const actions = engine.generate();
  for (const action of actions) {
    yield action;
  }
}
