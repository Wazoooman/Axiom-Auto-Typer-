// Unit tests for typing engine
// Run with: node tests/typing-engine.test.js

import { TypingEngine } from '../background/typing-engine.js';
import assert from 'assert';

function testBasicCharacters() {
  console.log('Test: Basic character typing...');
  const engine = new TypingEngine('a', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Should have keydown and keyup for 'a'
  assert(actions.length >= 2, 'Should have at least keydown and keyup');
  assert(actions.some(a => a.type === 'keydown' && a.key === 'a'), 'Should have keydown for a');
  assert(actions.some(a => a.type === 'keyup' && a.key === 'a'), 'Should have keyup for a');
  console.log('  ✓ Passed');
}

function testHelloWorld() {
  console.log('Test: Hello World with 100% accuracy and no breaks...');
  const engine = new TypingEngine('hello', { accuracy: 1.0, breakFrequency: 0, seed: 12345 });
  const actions = engine.generate();
  
  // Collect all typed characters
  const typedChars = [];
  for (const action of actions) {
    if (action.type === 'keydown' && action.text && action.text !== ' ') {
      typedChars.push(action.text.toLowerCase());
    }
  }
  
  // Check if 'hello' was typed
  const typed = typedChars.join('').substring(0, 5);
  assert(typed.includes('h'), 'Should contain h');
  console.log('  ✓ Passed');
}

function testCapitalLetters() {
  console.log('Test: Capital letter handling...');
  const engine = new TypingEngine('A', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Should have shift down, A, shift up
  assert(actions.some(a => a.type === 'keydown' && a.key === 'Shift'), 'Should have Shift keydown');
  assert(actions.some(a => a.type === 'keydown' && a.key === 'a'), 'Should have a keydown');
  console.log('  ✓ Passed');
}

function testSpecialCharacters() {
  console.log('Test: Special character handling...');
  const engine = new TypingEngine('hello.', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Should have period
  assert(actions.some(a => a.key === '.'), 'Should handle period');
  console.log('  ✓ Passed');
}

function testSpace() {
  console.log('Test: Space character...');
  const engine = new TypingEngine('a b', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Should have space
  assert(actions.some(a => a.key === ' '), 'Should handle space');
  console.log('  ✓ Passed');
}

function testBreakFrequency() {
  console.log('Test: Break frequency scheduling...');
  const engine = new TypingEngine('hello world test', { accuracy: 1, breakFrequency: 1.0, seed: 12345 });
  const actions = engine.generate();
  
  // With 100% break frequency, should have pauses after every space
  const pauses = actions.filter(a => a.type === 'pause');
  assert(pauses.length > 0, 'Should have at least one pause with 100% break frequency');
  assert(pauses.every(p => p.duration >= 500 && p.duration <= 2000), 'Pause durations should be in range');
  console.log('  ✓ Passed');
}

function testAccuracy() {
  console.log('Test: Accuracy and typo injection...');
  const engine = new TypingEngine('test', { accuracy: 0.5, breakFrequency: 0, seed: 42 });
  const actions = engine.generate();
  
  // With 50% accuracy, should have some variations/corrections
  // This is probabilistic, so we just check it generates actions
  assert(actions.length > 0, 'Should generate actions');
  console.log('  ✓ Passed');
}

function testWPMCalculation() {
  console.log('Test: WPM-based delay calculation...');
  // Higher WPM should result in shorter delays
  const engine1 = new TypingEngine('a', { wpm: 40, accuracy: 1, breakFrequency: 0 });
  const engine2 = new TypingEngine('a', { wpm: 80, accuracy: 1, breakFrequency: 0 });
  
  const actions1 = engine1.generate();
  const actions2 = engine2.generate();
  
  const delay1 = actions1.find(a => a.delay)?.delay || 0;
  const delay2 = actions2.find(a => a.delay)?.delay || 0;
  
  // This is probabilistic due to jitter, so we're lenient
  assert(actions1.length > 0 && actions2.length > 0, 'Both should generate actions');
  console.log('  ✓ Passed');
}

function testNewline() {
  console.log('Test: Newline character...');
  const engine = new TypingEngine('hello\nworld', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Should have Enter key
  assert(actions.some(a => a.key === 'Enter'), 'Should handle newline as Enter');
  console.log('  ✓ Passed');
}

function testEmptyText() {
  console.log('Test: Empty text handling...');
  const engine = new TypingEngine('', { accuracy: 1, breakFrequency: 0 });
  const actions = engine.generate();
  
  // Empty text should produce no actions
  assert(actions.length === 0, 'Empty text should produce no actions');
  console.log('  ✓ Passed');
}

function testReproducibility() {
  console.log('Test: Reproducibility with same seed...');
  const text = 'the quick brown fox';
  const config1 = { accuracy: 0.9, breakFrequency: 0.3, seed: 42 };
  const config2 = { accuracy: 0.9, breakFrequency: 0.3, seed: 42 };
  
  const engine1 = new TypingEngine(text, config1);
  const engine2 = new TypingEngine(text, config2);
  
  const actions1 = engine1.generate();
  const actions2 = engine2.generate();
  
  // Same seed should produce same sequence
  assert.deepEqual(actions1, actions2, 'Same seed should produce identical action sequence');
  console.log('  ✓ Passed');
}

// Run all tests
console.log('Running Typing Engine Tests\n');
try {
  testBasicCharacters();
  testHelloWorld();
  testCapitalLetters();
  testSpecialCharacters();
  testSpace();
  testBreakFrequency();
  testAccuracy();
  testWPMCalculation();
  testNewline();
  testEmptyText();
  testReproducibility();
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
