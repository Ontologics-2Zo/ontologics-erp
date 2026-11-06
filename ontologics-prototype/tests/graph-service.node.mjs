import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer, request as httpRequest} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {createGraphService} from '../server/graph-service.mjs';

const origin = 'http://127.0.0.1:5175';
const snapshot = (sequence = 1, ledgerVersion = 1) => ({
  schema: 1, companyId: 'A', sourceId: 'test-window', sequence, ledgerVersion,
  asOf: '2026-09-20T12:00:00+09:00', publishedAt: '2026-11-05T12:00:00.000Z', selectedId: 'PART-TPS',
  entities: [
    {id: 'PART-TPS', type: '사내 품목', name: 'TPS2375D', company: 'A', revision: '1', status: '부족', source: '합성 예시', properties: {'미확보': '100 EA'}, evidence: ['SYN-01']},
    {id: 'LOT-L07', type: '부품 로트', name: 'L07', company: 'A', revision: '1', status: '이력 조사', source: '합성 예시', properties: {}, evidence: ['SYN-01']},
  ],
  relations: [{id: 'r2', from: 'PART-TPS', to: 'LOT-L07', type: 'flow', label: '재고 로트', scope: '회사 A', evidence: 'SYN-STOCK-01'}],
  metrics: {required: 100, reserved: 0, receiptPass: null, materialAllocated: 0, unsecured: 100, bomApplied: false, demandConfirmed: false, unallocatedPass: null, unreservedOriginal: 80},
  reviews: [],
});
async function setup(t, options = {}) {
  const service = createGraphService({delayMs: 35, ...options});
  const server = createServer(service.middleware);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { service.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const request = async (path, {method = 'GET', token, data, requestOrigin = origin, headers = {}} = {}) => {
    const response = await fetch(base + '/local-graph/' + path, {method, headers: {
      ...(requestOrigin ? {Origin: requestOrigin} : {}), ...(token ? {Authorization: 'Bearer ' + token} : {}),
      ...(data === undefined ? {} : {'Content-Type': 'application/json'}), ...headers,
    }, ...(data === undefined ? {} : {body: JSON.stringify(data)})});
    return {code: response.status, data: response.status === 204 ? null : await response.json(), headers: response.headers};
  };
  const connect = async () => { const result = await request('sessions', {method: 'POST', data: {companyId: 'A', sourceId: 'test-window'}}); assert.equal(result.code, 201); return result.data; };
  return {request, connect, base};
}

test('local graph: scope, browser origin and capability gates do not reveal another session', async t => {
  const {request, connect} = await setup(t);
  assert.equal((await request('sessions', {method: 'POST', requestOrigin: null, data: {companyId: 'A', sourceId: 'test-window'}})).code, 403);
  assert.equal((await request('sessions', {method: 'POST', requestOrigin: 'https://example.com', data: {companyId: 'A', sourceId: 'test-window'}})).code, 403);
  const company = await request('sessions', {method: 'POST', data: {companyId: 'B', sourceId: 'test-window'}});
  assert.equal(company.code, 403); assert.equal(JSON.stringify(company.data).includes('TPS2375D'), false);
  assert.equal((await request('snapshot')).code, 401);
  const session = await connect(), separate = await connect();
  assert.equal((await request('projection', {method: 'PUT', token: session.readToken, data: snapshot()})).code, 401);
  const invalid = snapshot(); invalid.entities[0].company = 'B';
  assert.equal((await request('projection', {method: 'PUT', token: session.producerToken, data: invalid})).code, 403);
  const input = snapshot(); input.relations[0].to = 'OTHER-COMPANY-OBJECT';
  assert.equal((await request('projection', {method: 'PUT', token: session.producerToken, data: input})).code, 400);
  await request('projection', {method: 'PUT', token: session.producerToken, data: snapshot()});
  await delay(60);
  assert.equal((await request('snapshot', {token: separate.readToken})).data.snapshot, null);
  assert.equal((await request('snapshot', {token: session.readToken, requestOrigin: 'https://example.com'})).code, 403);
});

test('local graph: ledger receipt and completed projection carry separate versions and times', async t => {
  const {request, connect} = await setup(t, {delayMs: 70}); const session = await connect();
  const publish = value => request('projection', {method: 'PUT', token: session.producerToken, data: value});
  const queued = await publish(snapshot());
  assert.equal(queued.code, 202); assert.equal(queued.data.state, 'queued');
  assert.equal(queued.data.ledgerVersion, 1); assert.equal(queued.data.graphVersion, null);
  assert.equal(queued.data.receivedSequence, 1); assert.equal(queued.data.projectedSequence, null);
  await delay(95);
  const ready = await request('snapshot', {token: session.readToken});
  assert.equal(ready.data.status.state, 'ready'); assert.equal(ready.data.status.graphVersion, 1);
  assert.equal(ready.data.status.projectedSequence, 1); assert.ok(ready.data.status.projectedAt);
  assert.equal(ready.data.snapshot.entities[0].id, 'PART-TPS');
  const next = snapshot(2, 2); next.metrics.reserved = 60; next.metrics.unsecured = 40;
  const waiting = await publish(next);
  assert.equal(waiting.data.ledgerVersion, 2); assert.equal(waiting.data.graphVersion, 1);
  const stillOld = await request('snapshot', {token: session.readToken});
  assert.equal(stillOld.data.snapshot.metrics.reserved, 0);
  await delay(95);
  const updated = await request('snapshot', {token: session.readToken});
  assert.equal(updated.data.snapshot.metrics.reserved, 60); assert.equal(updated.data.status.graphVersion, 2);
});

test('local graph: duplicate delivery is idempotent; conflicting and stale deliveries cannot roll back', async t => {
  const {request, connect} = await setup(t); const session = await connect();
  const publish = value => request('projection', {method: 'PUT', token: session.producerToken, data: value});
  const input = snapshot(3, 5);
  assert.equal((await publish(input)).code, 202);
  assert.equal((await publish(structuredClone(input))).code, 200);
  const conflicting = structuredClone(input); conflicting.metrics.reserved = 5;
  assert.equal((await publish(conflicting)).data.code, 'SEQUENCE_CONFLICT');
  assert.equal((await publish(snapshot(2, 5))).data.code, 'STALE_PROJECTION');
  assert.equal((await publish(snapshot(4, 4))).data.code, 'STALE_PROJECTION');
  await delay(60);
  const state = await request('snapshot', {token: session.readToken});
  assert.equal(state.data.status.graphVersion, 5); assert.equal(state.data.status.projectedSequence, 3);
  assert.equal(state.data.snapshot.metrics.reserved, 0);
});

test('local graph: later review sequence supersedes queued read model without claiming a ledger write', async t => {
  const {request, connect} = await setup(t, {delayMs: 60}); const session = await connect();
  const publish = value => request('projection', {method: 'PUT', token: session.producerToken, data: value});
  const first = snapshot(); first.reviews = [{id: 'D1', version: 1, hash: 'fixed-content-hash', status: '검토 요청', author: 'Alice', base: 1}];
  await publish(first); await delay(20);
  const next = structuredClone(first); next.sequence = 2; next.reviews[0].status = '승인'; next.reviews[0].approvedBy = 'Bob';
  await publish(next); await delay(85);
  const state = await request('snapshot', {token: session.readToken});
  assert.equal(state.data.status.projectedSequence, 2); assert.equal(state.data.status.graphVersion, 1);
  assert.equal(state.data.snapshot.reviews[0].status, '승인'); assert.equal(state.data.snapshot.metrics.bomApplied, false);
});

test('local graph: revocation and expiry invalidate both capability roles', async t => {
  let clock = Date.now(); const {request, connect} = await setup(t, {now: () => clock, ttlMs: 100});
  const session = await connect();
  assert.equal((await request('session', {method: 'DELETE', token: session.readToken})).code, 401);
  assert.equal((await request('session', {method: 'DELETE', token: session.producerToken})).code, 204);
  assert.equal((await request('snapshot', {token: session.readToken})).code, 401);
  assert.equal((await request('status', {token: session.producerToken})).code, 401);
  const expired = await connect(); clock += 101;
  assert.equal((await request('status', {token: expired.readToken})).code, 401);
  assert.equal((await request('projection', {method: 'PUT', token: expired.producerToken, data: snapshot()})).code, 401);
});

test('local graph: malformed identity, duplicated objects, unregistered fields and hostile Host are rejected', async t => {
  const {request, connect, base} = await setup(t); const session = await connect();
  const publish = value => request('projection', {method: 'PUT', token: session.producerToken, data: value});
  const foreign = snapshot(); foreign.companyId = 'B';
  assert.equal((await publish(foreign)).code, 403);
  const duplicate = snapshot(); duplicate.entities.push(duplicate.entities[0]);
  assert.equal((await publish(duplicate)).code, 400);
  const extra = snapshot(); extra.businessState = {drafts: ['not part of read-model contract']};
  assert.equal((await publish(extra)).code, 400);
  const invalid = snapshot(); invalid.metrics.reserved = -1;
  assert.equal((await publish(invalid)).code, 400);
  const hostileHostCode = await new Promise((resolve, reject) => {
    const req = httpRequest(base + '/local-graph/health', {headers: {Host: 'attacker.example:5176'}}, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.end();
  });
  assert.equal(hostileHostCode, 403);
  assert.equal((await request('health', {requestOrigin: null})).data.ephemeral, true);
});
