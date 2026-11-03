import assert from "node:assert/strict";
import test from "node:test";
import { api, ApiError } from "../lib/api.ts";

test("HTTP conflicts preserve their status so a stale game can refresh instead of resubmitting", async (t) => {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Результат уже сохранён" }), { status: 409 });
  t.after(() => { globalThis.window = originalWindow; globalThis.fetch = originalFetch; });
  await assert.rejects(api('/api/sessions', { method: 'POST', body: '{}' }), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.message, 'Результат уже сохранён');
    return true;
  });
});

for (const status of [502, 503, 504]) test(`GET recovers from a transient ${status}`, async t => {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  globalThis.window = { setTimeout, clearTimeout };
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? new Response('gateway error', {status}) : Response.json({privacy_accepted:true});
  t.after(() => { globalThis.window = originalWindow; globalThis.fetch = originalFetch; });
  assert.deepEqual(await api('/api/children/1/consent'), {privacy_accepted:true});
  assert.equal(calls, 2);
});
test('GET recovers from a network failure; writes and denials are not retried', async t => {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  globalThis.window = { setTimeout, clearTimeout };
  t.after(() => { globalThis.window = originalWindow; globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => { if (++calls === 1) throw new TypeError('fetch failed'); return Response.json({ok:true}); };
  assert.deepEqual(await api('/api/children'), {ok:true});
  assert.equal(calls,2);
  for (const method of ['GET','POST']) {
    calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({detail:'Denied'}, {status:method === 'GET'?403:503}); };
    await assert.rejects(api('/api/children/1/consent',{method}), ApiError);
    assert.equal(calls,1);
  }
});
test('an already cancelled read never starts a request', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => { throw new Error('must not fetch'); };
  const controller = new AbortController(); controller.abort();
  await assert.rejects(api('/api/children', {signal:controller.signal}), {name:'AbortError'});
});
