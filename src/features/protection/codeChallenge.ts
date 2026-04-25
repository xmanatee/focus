export const EMERGENCY_INITIAL_LENGTH = 8;
export const EMERGENCY_LENGTH_INCREMENT = 4;
export const EMERGENCY_MAX_LENGTH = 32;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function nextCodeLength(current: number): number {
  return Math.min(current + EMERGENCY_LENGTH_INCREMENT, EMERGENCY_MAX_LENGTH);
}
