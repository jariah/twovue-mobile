// Whimsical Scientific Words for Game ID Generation
const SCIENTIFIC_ADJECTIVES = [
  'quantum', 'atomic', 'neural', 'stellar', 'cosmic', 'optical', 'kinetic', 
  'thermal', 'magnetic', 'electric', 'photonic', 'sonic', 'crystalline',
  'molecular', 'orbital', 'plasma', 'gamma', 'alpha', 'beta', 'delta',
  'micro', 'nano', 'meta', 'ultra', 'hyper', 'neo', 'proto', 'pseudo',
  'cyber', 'digital', 'analog', 'synthetic', 'organic', 'bionic', 'ionic',
  'spectral', 'temporal', 'spatial', 'dimensional', 'fractal', 'holographic'
];

const SCIENTIFIC_NOUNS = [
  'vector', 'matrix', 'prism', 'catalyst', 'reactor', 'generator', 'scanner',
  'analyzer', 'synthesizer', 'amplifier', 'detector', 'sensor', 'probe',
  'beacon', 'transmitter', 'receiver', 'oscillator', 'resonator', 'capacitor',
  'conductor', 'isolator', 'converter', 'processor', 'calculator', 'computer',
  'algorithm', 'protocol', 'sequence', 'pattern', 'frequency', 'wavelength',
  'spectrum', 'field', 'chamber', 'module', 'unit', 'device', 'apparatus',
  'instrument', 'mechanism', 'engine', 'turbine', 'dynamo', 'circuit',
  'array', 'grid', 'network', 'system', 'core', 'nexus', 'hub', 'node'
];

const SCIENTIFIC_SUFFIXES = [
  'alpha', 'beta', 'gamma', 'delta', 'omega', 'prime', 'max', 'ultra',
  'plus', 'neo', 'pro', 'x', 'z', 'one', 'two', 'three', 'seven', 'nine'
];

/**
 * Generates a whimsical scientific game ID
 * Format: ADJECTIVE-NOUN-SUFFIX (e.g., "quantum-vector-alpha")
 */
export function generateScientificGameId(): string {
  const adjective = SCIENTIFIC_ADJECTIVES[Math.floor(Math.random() * SCIENTIFIC_ADJECTIVES.length)];
  const noun = SCIENTIFIC_NOUNS[Math.floor(Math.random() * SCIENTIFIC_NOUNS.length)];
  const suffix = SCIENTIFIC_SUFFIXES[Math.floor(Math.random() * SCIENTIFIC_SUFFIXES.length)];
  
  return `${adjective}-${noun}-${suffix}`;
}

/**
 * Generates a shorter version for display (first 2 parts)
 * Format: ADJECTIVE-NOUN
 */
export function generateShortScientificId(): string {
  const adjective = SCIENTIFIC_ADJECTIVES[Math.floor(Math.random() * SCIENTIFIC_ADJECTIVES.length)];
  const noun = SCIENTIFIC_NOUNS[Math.floor(Math.random() * SCIENTIFIC_NOUNS.length)];
  
  return `${adjective}-${noun}`;
}

/**
 * Creates a display-friendly version of the game ID for UI
 */
export function formatGameIdForDisplay(gameId: string): string {
  return gameId.toUpperCase().replace(/-/g, ' ');
} 