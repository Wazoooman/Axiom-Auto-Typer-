// Preset configurations for different typing styles
export const PRESETS = {
  'Beginner 12-16 Years Old': {
    wpm: 25,
    accuracy: 80,
    correctionSpeed: 2.0,
    breakFrequency: 40,
    breakMin: 1.0,
    breakMax: 4.0,
  },
  'Intermediate 12-16 Years Old': {
    wpm: 40,
    accuracy: 88,
    correctionSpeed: 1.0,
    breakFrequency: 25,
    breakMin: 1.0,
    breakMax: 2.0,
  },
  'Expert 12-16 Years Old': {
    wpm: 65,
    accuracy: 95,
    correctionSpeed: 0.6,
    breakFrequency: 15,
    breakMin: 0.5,
    breakMax: 1.5,
  },
  'Beginner 17+ Years Old': {
    wpm: 35,
    accuracy: 85,
    correctionSpeed: 1.5,
    breakFrequency: 30,
    breakMin: 1.0,
    breakMax: 3.0,
  },
  'Intermediate 17+ Years Old': {
    wpm: 55,
    accuracy: 92,
    correctionSpeed: 0.8,
    breakFrequency: 20,
    breakMin: 0.5,
    breakMax: 2.0,
  },
  'Expert 17+ Years Old': {
    wpm: 80,
    accuracy: 97,
    correctionSpeed: 0.4,
    breakFrequency: 10,
    breakMin: 0.5,
    breakMax: 1.5,
  },
  'Fast': {
    wpm: 120,
    accuracy: 99,
    correctionSpeed: 0.25,
    breakFrequency: 5,
    breakMin: 0.3,
    breakMax: 0.8,
  },
};

export function getPresetConfig(presetName) {
  return PRESETS[presetName] || PRESETS['Intermediate 12-16 Years Old'];
}

export function getAllPresetNames() {
  return Object.keys(PRESETS);
}
