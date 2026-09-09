import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseSnapshot, SNAPSHOT_ID_PATTERN } from '../packages/snapshot-contract/index.js';

// Offline migration: stop Garden writers and back up both stores before replacing the file.
export function migrateSnapshotShares(existing, rows, publisherUserId) {
  if (!existing || typeof existing !== 'object' || Array.isArray(existing) || !Array.isArray(rows)) throw new Error('Invalid migration input');
  if (!publisherUserId) throw new Error('An explicit source publisher is required');
  const result = structuredClone(existing);
  let summariesConverted = 0;
  for (const [id, record] of Object.entries(result)) {
    if (!SNAPSHOT_ID_PATTERN.test(id) || record.id !== id || !Number.isFinite(record.createdAt)) throw new Error(`Invalid existing record: ${id}`);
    const payload = record.data?.snapshot ?? record.data;
    if (!Array.isArray(payload?.turns) && typeof payload?.summary === 'string') {
      const converted = { ...payload, turns: [{ kind: 'message', role: 'assistant', text: payload.summary }] };
      record.data = record.data?.snapshot ? { ...record.data, snapshot: converted } : converted;
      summariesConverted++;
    }
    parseSnapshot(record.data?.snapshot ?? record.data);
  }
  const time = (value, label) => {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}`);
    return parsed;
  };
  for (const row of rows) {
    if (!SNAPSHOT_ID_PATTERN.test(row.id) || Object.hasOwn(result, row.id)) throw new Error(`Invalid or conflicting share ID: ${row.id}`);
    if (row.publisher?.userId !== publisherUserId) throw new Error(`Unexpected publisher: ${row.id}`);
    const snapshot = parseSnapshot(row.payload);
    result[row.id] = {
      id: row.id,
      createdAt: time(row.created_at, 'created_at'),
      updatedAt: time(row.updated_at, 'updated_at'),
      expiresAt: row.expires_at ? time(row.expires_at, 'expires_at') : null,
      ownerUserId: 'garden:snapshot-publisher',
      title: row.title,
      siteUrl: 'https://ffffhx.github.io/garden-lab',
      data: snapshot,
    };
  }
  return { store: result, report: { imported: rows.length, summariesConverted, total: Object.keys(result).length } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [existingPath, rowsPath, outputPath, publisherUserId] = process.argv.slice(2);
  if (!outputPath) throw new Error('Usage: node scripts/migrate-snapshot-shares.mjs existing.json postgres-rows.json output.json publisherUserId');
  const { store, report } = migrateSnapshotShares(JSON.parse(fs.readFileSync(existingPath, 'utf8')), JSON.parse(fs.readFileSync(rowsPath, 'utf8')), publisherUserId);
  fs.writeFileSync(outputPath, JSON.stringify(store, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(report));
}
