/** Separate loopback process for the local graph view. Run with npm run graph. */
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createServer as createViteServer} from 'vite';
import {createGraphService, DEFAULT_ALLOWED_ORIGINS} from './graph-service.mjs';

const args = process.argv.slice(2);
const valueOf = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const port = Number(valueOf('--port') ?? 5176);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use a local port between 1024 and 65535.');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const server = createServer();
const vite = await createViteServer({root, appType: 'mpa', server: {middlewareMode: true, hmr: {server}, host: '127.0.0.1'}, clearScreen: false});
const configuredOrigins = process.env.ONTO_GRAPH_ALLOWED_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean);
if (configuredOrigins?.some(origin => !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))) throw new Error('Graph development origins must be explicit HTTP loopback origins.');
const service = createGraphService({allowedOrigins: configuredOrigins ?? DEFAULT_ALLOWED_ORIGINS});
server.on('request', (req, res) => {
  service.middleware(req, res, () => {
    if (req.url === '/' || req.url?.startsWith('/?')) req.url = '/graph.html' + (req.url === '/' ? '' : req.url.slice(1));
    vite.middlewares(req, res);
  });
});
server.on('error', async error => { console.error(error.message); service.close(); await vite.close(); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`ontologics local graph: http://127.0.0.1:${port}/\nDevelopment only · in-memory read model · business authority remains browser Mock.`));
let closing = false;
async function close() { if (closing) return; closing = true; service.close(); await vite.close(); server.close(() => process.exit(0)); server.closeAllConnections(); }
process.on('SIGINT', close); process.on('SIGTERM', close);
