import { randomInt } from 'crypto';

const BASE62_CHARACTERS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateShortCode(length = 6): string {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('Short code length must be a positive integer');
  }

  let code = '';

  for (let index = 0; index < length; index += 1) {
    const randomIndex = randomInt(BASE62_CHARACTERS.length);
    code += BASE62_CHARACTERS[randomIndex];
  }

  return code;
}
