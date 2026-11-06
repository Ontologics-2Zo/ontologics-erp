/** Development-only, in-memory read-model transport. This is not an ERP authority,
 * an RDF engine, a production authentication system, or a finalized public API.
 * Browser facts stay explicitly marked as local mock data. No business writes occur.
 */
import {createHash, randomBytes} from 'node:crypto';

export const DEFAULT_ALLOWED_ORIGINS = [
  'http://127.0.0.1:5175', 'http://localhost:5175',
  'http://127.0.0.1:5177', 'http://localhost:5177',
];
const MAX_BODY = 4 * 1024 * 1024;
const token = () => randomBytes(32).toString('base64url');
const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
class RequestError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const invalid = message => { throw new RequestError(400, 'INVALID_SNAPSHOT', message); };
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function text(value, field, max = 8000, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max) invalid(`${field} 형식이 올바르지 않습니다.`);
}
function integer(value, field, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) invalid(`${field}는 ${minimum} 이상의 정수여야 합니다.`);
}
function fields(value, allowed, field) {
  if (!isRecord(value) || Object.keys(value).some(key => !allowed.includes(key))) invalid(`${field} 필드를 확인하세요.`);
}
function strings(value, field, max = 100) {
  if (!Array.isArray(value) || value.length > max) invalid(`${field} 목록을 확인하세요.`);
  value.forEach(item => text(item, field));
}
function date(value, field) { text(value, field, 100); if (!Number.isFinite(Date.parse(value))) invalid(`${field} 시각을 확인하세요.`); }

export function validateProjection(value, session) {
  fields(value, ['schema', 'companyId', 'sourceId', 'sequence', 'ledgerVersion', 'asOf', 'publishedAt', 'selectedId', 'entities', 'relations', 'metrics', 'reviews'], 'snapshot');
  if (value.schema !== 1) invalid('지원하지 않는 읽기 모델 형식입니다.');
  if (value.companyId !== session.companyId || value.sourceId !== session.sourceId) {
    throw new RequestError(403, 'SCOPE_MISMATCH', '연결된 회사·업무 창의 범위와 일치하지 않습니다.');
  }
  integer(value.sequence, 'sequence', 1); integer(value.ledgerVersion, 'ledgerVersion', 1);
  date(value.asOf, 'asOf'); date(value.publishedAt, 'publishedAt');
  if (!Array.isArray(value.entities) || value.entities.length > 5000 || !Array.isArray(value.relations) || value.relations.length > 10000) invalid('전체 읽기 모델의 객체·관계 한도를 초과했습니다. 일부만 보내 완료로 처리하지 마세요.');
  const ids = new Set();
  for (const entity of value.entities) {
    fields(entity, ['id', 'type', 'name', 'company', 'revision', 'status', 'source', 'properties', 'evidence', 'photo'], 'entity');
    for (const key of ['id', 'type', 'name', 'revision', 'status', 'source']) text(entity[key], `entity.${key}`);
    if (entity.company !== session.companyId) throw new RequestError(403, 'SCOPE_MISMATCH', '다른 회사의 객체는 이 연결에 포함할 수 없습니다.');
    if (ids.has(entity.id)) invalid('중복 객체 ID가 있습니다.');
    ids.add(entity.id);
    if (!isRecord(entity.properties) || Object.keys(entity.properties).length > 100) invalid('객체 속성 목록을 확인하세요.');
    for (const [key, property] of Object.entries(entity.properties)) { text(key, 'property key', 300); text(property, 'property value', 8000, true); }
    strings(entity.evidence, 'entity.evidence');
    if (entity.photo !== undefined) {
      fields(entity.photo, ['assetId', 'url', 'kind', 'source', 'sourceUrl', 'subject', 'createdAt', 'evidenceEligible', 'rights', 'targetId', 'scope', 'match', 'revisionMatch'], 'photo');
      for (const key of ['assetId', 'url', 'kind', 'source', 'subject', 'createdAt', 'rights', 'targetId', 'scope', 'match', 'revisionMatch']) text(entity.photo[key], `photo.${key}`);
      if (!/^\/media\/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp|svg)$/.test(entity.photo.url) || entity.photo.targetId !== entity.id || entity.photo.evidenceEligible !== false) invalid('사진은 기존 객체에 연결된 로컬 참고 자산이어야 합니다.');
      if (entity.photo.sourceUrl !== undefined && !/^https:\/\//.test(entity.photo.sourceUrl)) invalid('사진 출처 URL을 확인하세요.');
    }
  }
  if (value.selectedId !== null && !ids.has(value.selectedId)) invalid('선택 객체가 전달된 회사 범위에 없습니다.');
  const relationIds = new Set();
  for (const relation of value.relations) {
    fields(relation, ['id', 'from', 'to', 'type', 'label', 'scope', 'evidence', 'validFrom', 'validTo'], 'relation');
    for (const key of ['id', 'from', 'to', 'label', 'scope', 'evidence']) text(relation[key], `relation.${key}`);
    if (!['design', 'mount', 'flow', 'substitution', 'reservation'].includes(relation.type)) invalid('관계 유형을 확인하세요.');
    if (relationIds.has(relation.id) || !ids.has(relation.from) || !ids.has(relation.to)) invalid('중복 관계 ID 또는 범위 밖 연결점이 있습니다.');
    relationIds.add(relation.id);
    for (const key of ['validFrom', 'validTo']) if (relation[key] !== undefined) text(relation[key], `relation.${key}`, 200);
  }
  fields(value.metrics, ['required', 'reserved', 'receiptPass', 'materialAllocated', 'unsecured', 'bomApplied', 'demandConfirmed', 'unallocatedPass', 'unreservedOriginal'], 'metrics');
  for (const key of ['required', 'reserved', 'materialAllocated', 'unsecured', 'unreservedOriginal']) integer(value.metrics[key], `metrics.${key}`);
  for (const key of ['receiptPass', 'unallocatedPass']) if (value.metrics[key] !== null) integer(value.metrics[key], `metrics.${key}`);
  if (typeof value.metrics.bomApplied !== 'boolean' || typeof value.metrics.demandConfirmed !== 'boolean') invalid('BOM 반영·수요 확인 상태를 확인하세요.');
  if (!Array.isArray(value.reviews) || value.reviews.length > 1000) invalid('검토 목록의 크기를 확인하세요.');
  const reviewIds = new Set();
  for (const review of value.reviews) {
    fields(review, ['id', 'version', 'hash', 'status', 'author', 'approvedBy', 'base'], 'review');
    for (const key of ['id', 'hash', 'status', 'author']) text(review[key], `review.${key}`, 1000);
    for (const key of ['version', 'base']) integer(review[key], `review.${key}`, 1);
    if (review.approvedBy !== undefined) text(review.approvedBy, 'review.approvedBy', 100);
    if (reviewIds.has(review.id)) invalid('중복 검토 ID가 있습니다.');
    reviewIds.add(review.id);
  }
  return structuredClone(value);
}

async function body(req) {
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) throw new RequestError(415, 'JSON_REQUIRED', 'JSON 요청이 필요합니다.');
  let length = 0; const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) throw new RequestError(413, 'TOO_LARGE', '읽기 모델 전달 크기를 초과했습니다.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError(400, 'INVALID_JSON', 'JSON 형식이 올바르지 않습니다.'); }
}

export function createGraphService({allowedOrigins = DEFAULT_ALLOWED_ORIGINS, delayMs = 400, ttlMs = 2 * 60 * 60 * 1000, now = Date.now, maxSessions = 20} = {}) {
  const origins = new Set(allowedOrigins), sessions = new Map(), capabilities = new Map();
  const stamp = () => new Date(now()).toISOString();
  const remove = session => {
    clearTimeout(session.timer); sessions.delete(session.id);
    capabilities.delete(session.producerToken); capabilities.delete(session.readToken);
  };
  const purge = () => { for (const session of sessions.values()) if (now() - session.createdAt >= ttlMs) remove(session); };
  const status = session => ({
    mode: 'local-mock-projection', sessionId: session.id, companyId: session.companyId, sourceId: session.sourceId,
    state: session.state, ledgerVersion: session.received?.ledgerVersion ?? null, graphVersion: session.snapshot?.ledgerVersion ?? null,
    receivedSequence: session.received?.sequence ?? null, projectedSequence: session.snapshot?.sequence ?? null,
    receivedAt: session.receivedAt, projectedAt: session.projectedAt, error: session.error, simulationDelayMs: delayMs,
  });
  const authenticate = (req, producer = false) => {
    const bearer = /^Bearer ([A-Za-z0-9_-]+)$/.exec(String(req.headers.authorization ?? ''))?.[1];
    const capability = bearer && capabilities.get(bearer);
    const session = capability && sessions.get(capability.sessionId);
    if (!session || (producer && capability.role !== 'producer')) throw new RequestError(401, 'CONNECTION_REQUIRED', '연결이 없거나 만료되었습니다. 업무 화면에서 다시 연결하세요.');
    return session;
  };
  const send = (res, code, value) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}); res.end(JSON.stringify(value)); };
  const middleware = async (req, res, next = () => { res.writeHead(404); res.end(); }) => {
    let pathname;
    try {
      const host = new URL('http://' + req.headers.host);
      if (!['127.0.0.1', 'localhost'].includes(host.hostname) || host.username || host.password) throw new Error('host');
      pathname = new URL(req.url, host).pathname;
    } catch { send(res, 403, {code: 'LOOPBACK_ONLY', error: '로컬 개발 연결만 허용합니다.'}); return; }
    if (!pathname.startsWith('/local-graph/')) { next(); return; }
    try {
      purge();
      const origin = req.headers.origin;
      const ownOrigin = 'http://' + req.headers.host;
      if (origin && !origins.has(origin) && origin !== ownOrigin) throw new RequestError(403, 'ORIGIN_DENIED', '허용된 로컬 업무 창에서 연결하세요.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      if (req.method === 'OPTIONS') {
        if (!origin) throw new RequestError(403, 'ORIGIN_DENIED', '연결 출처를 확인할 수 없습니다.');
        res.writeHead(204, {'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '600'}); res.end(); return;
      }
      if (['POST', 'PUT', 'DELETE'].includes(req.method) && (!origin || !origins.has(origin))) throw new RequestError(403, 'ORIGIN_DENIED', '허용된 로컬 업무 창에서 요청하세요.');
      if (pathname === '/local-graph/health' && req.method === 'GET') {
        send(res, 200, {mode: 'local-mock-projection', state: 'ready', ephemeral: true, simulationDelayMs: delayMs}); return;
      }
      if (pathname === '/local-graph/sessions' && req.method === 'POST') {
        const input = await body(req);
        fields(input, ['companyId', 'sourceId'], 'session');
        if (input.companyId !== 'A') throw new RequestError(403, 'SCOPE_UNAVAILABLE', '이 로컬 데모에서 연결할 수 없는 회사 범위입니다.');
        text(input.sourceId, 'sourceId', 200);
        if (!/^[A-Za-z0-9._:-]+$/.test(input.sourceId)) invalid('업무 창 식별자를 확인하세요.');
        if (sessions.size >= maxSessions) throw new RequestError(429, 'SESSION_LIMIT', '로컬 연결 수 한도입니다. 사용하지 않는 연결을 해제하세요.');
        const session = {id: token(), producerToken: token(), readToken: token(), companyId: input.companyId, sourceId: input.sourceId, createdAt: now(), state: 'empty', received: null, snapshot: null, receivedAt: null, projectedAt: null, receivedHash: null, error: null, timer: undefined};
        sessions.set(session.id, session);
        capabilities.set(session.producerToken, {sessionId: session.id, role: 'producer'});
        capabilities.set(session.readToken, {sessionId: session.id, role: 'read'});
        send(res, 201, {sessionId: session.id, producerToken: session.producerToken, readToken: session.readToken, status: status(session)}); return;
      }
      if (pathname === '/local-graph/session' && req.method === 'DELETE') {
        remove(authenticate(req, true)); res.writeHead(204, {'Cache-Control': 'no-store'}); res.end(); return;
      }
      if (pathname === '/local-graph/status' && req.method === 'GET') { send(res, 200, status(authenticate(req))); return; }
      if (pathname === '/local-graph/snapshot' && req.method === 'GET') {
        const session = authenticate(req); send(res, 200, {status: status(session), snapshot: session.snapshot}); return;
      }
      if (pathname === '/local-graph/projection' && req.method === 'PUT') {
        const session = authenticate(req, true), value = validateProjection(await body(req), session), digest = hash(value);
        if (!sessions.has(session.id)) throw new RequestError(401, 'CONNECTION_REQUIRED', '연결이 해제되었습니다.');
        if (session.received && value.sequence === session.received.sequence) {
          if (session.receivedHash !== digest) throw new RequestError(409, 'SEQUENCE_CONFLICT', '같은 순번에 다른 내용이 전달되었습니다.');
          send(res, 200, status(session)); return;
        }
        if (session.received && (value.sequence < session.received.sequence || value.ledgerVersion < session.received.ledgerVersion)) throw new RequestError(409, 'STALE_PROJECTION', '이전 순번·데이터 버전으로 그래프를 되돌릴 수 없습니다.');
        clearTimeout(session.timer);
        session.received = value; session.receivedHash = digest; session.receivedAt = stamp(); session.state = 'queued'; session.error = null;
        session.timer = setTimeout(() => {
          if (!sessions.has(session.id) || session.receivedHash !== digest) return;
          try { session.snapshot = structuredClone(value); session.projectedAt = stamp(); session.state = 'ready'; }
          catch { session.state = 'failed'; session.error = '로컬 읽기 모델 갱신에 실패했습니다. 업무 기록은 변경하지 않았습니다.'; }
        }, delayMs);
        session.timer.unref?.();
        send(res, 202, status(session)); return;
      }
      send(res, 404, {code: 'NOT_FOUND', error: '지원하지 않는 로컬 연결 요청입니다.'});
    } catch (error) {
      send(res, error instanceof RequestError ? error.status : 500, {code: error instanceof RequestError ? error.code : 'LOCAL_ERROR', error: error instanceof RequestError ? error.message : '로컬 그래프 연결 처리에 실패했습니다.'});
    }
  };
  return {middleware, close() { for (const session of sessions.values()) remove(session); }};
}
