// src/runtime/modules/crypto.js
const { op_md5_hash } = Deno.core.ops;

export function md5(data) {
  if (typeof data !== 'string') {
    throw new TypeError('Data must be a string');
  }
  return op_md5_hash(data);
}
