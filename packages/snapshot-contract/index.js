export const SNAPSHOT_SCHEMA_VERSION = 1;
export const SNAPSHOT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function fields(value, names, type) {
  for (const name of names) {
    if (value[name] !== undefined && typeof value[name] !== type) throw new Error(`Invalid ${name}`);
  }
}

export function parseSnapshot(value) {
  const snapshot = object(value, 'snapshot');
  fields(snapshot, ['id', 'title', 'engine', 'engineLabel', 'displayCwd', 'generatedAt'], 'string');
  fields(snapshot, ['redacted', 'includeTools', 'includeToolOutput'], 'boolean');
  if (!Array.isArray(snapshot.turns)) throw new Error('snapshot.turns must be an array');
  for (const item of snapshot.turns) {
    const turn = object(item, 'snapshot turn');
    fields(turn, ['kind', 'role', 'name', 'text', 'html'], 'string');
    if (turn.images !== undefined) {
      if (!Array.isArray(turn.images)) throw new Error('Invalid turn images');
      for (const image of turn.images) {
        fields(object(image, 'snapshot image'), ['alt', 'mimeType', 'size', 'src', 'unavailableReason'], 'string');
      }
    }
  }
  return snapshot;
}

export function parseCreateSnapshotRequest(value) {
  const request = object(value, 'snapshot request');
  if (request.schemaVersion !== undefined && request.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) throw new Error('Unsupported snapshot schemaVersion');
  parseSnapshot(request.snapshot);
  if (request.shareId !== undefined && (typeof request.shareId !== 'string' || !SNAPSHOT_ID_PATTERN.test(request.shareId))) throw new Error('Invalid shareId');
  if (request.expiresInDays !== undefined && (!Number.isInteger(request.expiresInDays) || request.expiresInDays < 1 || request.expiresInDays > 3650)) throw new Error('expiresInDays must be an integer from 1 to 3650');
  fields(request, ['siteUrl'], 'string');
  return request;
}

export function parsePublishSnapshotResponse(value) {
  const response = object(value, 'publish response');
  if (response.schemaVersion !== SNAPSHOT_SCHEMA_VERSION || typeof response.id !== 'string' || !SNAPSHOT_ID_PATTERN.test(response.id)) throw new Error('Invalid Garden snapshot publish response');
  if (typeof response.url !== 'string' || !/^https?:\/\//.test(response.url)) throw new Error('Invalid snapshot share URL');
  for (const field of ['createdAt', 'updatedAt']) {
    if (typeof response[field] !== 'string' || !Number.isFinite(Date.parse(response[field]))) throw new Error(`Invalid ${field}`);
  }
  if (response.expiresAt !== null && (typeof response.expiresAt !== 'string' || !Number.isFinite(Date.parse(response.expiresAt)))) throw new Error('Invalid expiresAt');
  return response;
}

export function parseSnapshotResponse(value) {
  const response = object(value, 'snapshot response');
  if (response.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) throw new Error('Unsupported Garden snapshot response');
  const share = object(response.share, 'share');
  parsePublishSnapshotResponse({ ...share, schemaVersion: response.schemaVersion });
  fields(share, ['title', 'engine', 'engineLabel'], 'string');
  fields(share, ['redacted'], 'boolean');
  if (!Number.isInteger(share.turnCount) || share.turnCount < 0) throw new Error('Invalid turnCount');
  parseSnapshot(response.snapshot);
  return response;
}
