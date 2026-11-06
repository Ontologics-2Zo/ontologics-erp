import { createHash, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allowed = new Map([
  ['olimex-poe', 'ESP32-POE/images/ESP32-POE.jpg'],
  ['olimex-poeiso', 'ESP32-POE-ISO/images/ESP32-POE-ISO-1.jpg'],
  ['olimex-evb', 'ESP32-EVB/images/ESP32-EVB-1.jpg'],
  ['olimex-gateway', 'ESP32-GATEWAY/images/ESP32-GATEWAY-1.jpg'],
]);
const digest = data => createHash('sha256').update(data).digest('hex');

function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length !== allowed.size) {
    throw new Error('Expected reference-media manifest version 1 with four assets.');
  }
  const seen = new Set();
  for (const asset of manifest.assets) {
    const suffix = allowed.get(asset.id);
    const url = `https://www.olimex.com/Products/IoT/ESP32/${suffix}`;
    if (!suffix || seen.has(asset.id) || asset.path !== `public/media/${asset.id}.jpg` || asset.url !== url
      || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > 5_000_000
      || !/^[0-9a-f]{64}$/.test(asset.sha256)) {
      throw new Error('Invalid reference-media entry; only the four fixed OLIMEX HTTPS URLs are allowed.');
    }
    seen.add(asset.id);
  }
}

async function existingMatches(target, asset) {
  let stat;
  try {
    stat = await lstat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== asset.bytes
    || digest(await readFile(target)) !== asset.sha256) {
    throw new Error(`${asset.id}: existing file differs; it was preserved. Move it aside manually before retrying.`);
  }
  return true;
}

async function download(asset) {
  const response = await fetch(asset.url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  if (!response.ok || !/^image\/jpeg(?:;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body) {
    await response.body?.cancel();
    throw new Error(`${asset.id}: expected a successful JPEG response.`);
  }
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) !== asset.bytes) {
    await response.body.cancel();
    throw new Error(`${asset.id}: server file size changed; nothing was written.`);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > asset.bytes) throw new Error(`${asset.id}: response exceeds the expected size.`);
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);
  if (size !== asset.bytes || digest(data) !== asset.sha256
    || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
    throw new Error(`${asset.id}: size, SHA-256, or JPEG signature mismatch; nothing was written.`);
  }
  return data;
}

async function restore(asset) {
  const target = resolve(root, asset.path);
  if (await existingMatches(target, asset)) {
    console.log(`${asset.id}: verified existing file; preserved.`);
    return;
  }
  const data = await download(asset);
  const directory = dirname(target);
  await mkdir(directory, { recursive: true });
  if (!(await lstat(directory)).isDirectory()) throw new Error('Media directory must be a real directory.');
  const temporary = resolve(directory, `.${asset.id}.${randomUUID()}.tmp`);
  let ownsTemporary = false;
  try {
    const file = await open(temporary, 'wx');
    ownsTemporary = true;
    try { await file.writeFile(data); } finally { await file.close(); }
    try {
      // A hard link publishes the complete file atomically and cannot replace an existing target.
      await link(temporary, target);
    } catch (error) {
      if (error.code !== 'EEXIST' || !(await existingMatches(target, asset))) throw error;
    }
  } finally {
    if (ownsTemporary) await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  console.log(`${asset.id}: restored and verified.`);
}

try {
  const manifest = JSON.parse(await readFile(resolve(root, 'docs/reference-media.json'), 'utf8'));
  validateManifest(manifest);
  for (const asset of manifest.assets) await restore(asset);
  console.log('Reference photos are for local use; this does not establish redistribution rights.');
} catch (error) {
  console.error(`Reference media restoration failed: ${error.message}`);
  process.exitCode = 1;
}
