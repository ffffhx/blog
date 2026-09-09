import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSnapshotShares } from './migrate-snapshot-shares.mjs';

const row = { id: 'snap_Original-ID', publisher: { userId: 'github:owner' }, title: 'Title', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', expires_at: '2026-03-01T00:00:00Z', payload: { turns: [{ role: 'assistant', text: 'const value: <T>', images: [{ src: 'data:image/png;base64,eA==' }] }], extra: { preserved: true } } };
test('preserves payload, IDs, timestamps and expiry; converts legacy summaries without losing metadata', () => {
  const existing = { legacy: { id: 'legacy', createdAt: 1, data: { title: 'old', summary: 'original summary', extra: 42 } } };
  const { store, report } = migrateSnapshotShares(existing, [row], 'github:owner');
  assert.deepEqual(store[row.id].data, row.payload);
  assert.equal(store[row.id].expiresAt, Date.parse(row.expires_at));
  assert.equal(store[row.id].createdAt, Date.parse(row.created_at));
  assert.equal(store[row.id].ownerUserId, 'garden:snapshot-publisher');
  assert.equal(store.legacy.data.turns[0].text, 'original summary');
  assert.equal(store.legacy.data.extra, 42);
  assert.equal(existing.legacy.data.turns, undefined);
  assert.deepEqual(report, { imported: 1, summariesConverted: 1, total: 2 });
});
test('refuses conflicts, unexpected publishers, invalid dates and malformed payloads', () => {
  assert.throws(() => migrateSnapshotShares({}, [row, row], 'github:owner'), /conflicting/);
  assert.throws(() => migrateSnapshotShares({}, [row], 'other'), /publisher/);
  assert.throws(() => migrateSnapshotShares({}, [{ ...row, created_at: 'bad' }], 'github:owner'), /created_at/);
  assert.throws(() => migrateSnapshotShares({}, [{ ...row, payload: {} }], 'github:owner'), /turns/);
});
