// src/runtime/modules/crypto.js
const { op_md5_hash } = Deno.core.ops;

/**
 * Computes the MD5 hash of a given string.
 *
 * @param {string} data - The input string to hash.
 * @returns {string} The MD5 hash of the input string.
 * @throws {TypeError} If the input is not a string.
 */
export function md5(data) {
  if (typeof data !== 'string') {
    throw new TypeError('Data must be a string');
  }
  return op_md5_hash(data);
}
