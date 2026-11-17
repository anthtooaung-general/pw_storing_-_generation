const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...bytes));
const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function derive(password, salt) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(salt), iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export const salt = () => b64(crypto.getRandomValues(new Uint8Array(16)));
export async function encrypt(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  return { iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) };
}
export async function decrypt(key, data) {
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(data.iv) }, key, bytes(data.ciphertext));
  return JSON.parse(new TextDecoder().decode(raw));
}
export function generate(length, groups) {
  if (!groups.length) throw new Error('Choose at least one character type.');
  const pick = chars => { const limit = 256 - 256 % chars.length; let n; do { n = crypto.getRandomValues(new Uint8Array(1))[0]; } while (n >= limit); return chars[n % chars.length]; };
  const chars = groups.join('');
  const result = groups.map(pick);
  while (result.length < length) result.push(pick(chars));
  for (let i = result.length - 1; i > 0; i--) { const indices = Array.from({length:i+1},(_,j)=>String.fromCharCode(j)).join(''); const j = pick(indices).charCodeAt(0); [result[i],result[j]]=[result[j],result[i]]; }
  return result.join('');
}
