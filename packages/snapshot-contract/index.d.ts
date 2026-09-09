export const SNAPSHOT_SCHEMA_VERSION: 1;
export const SNAPSHOT_ID_PATTERN: RegExp;
export interface SnapshotImage { alt?: string; mimeType?: string; size?: string; src?: string; unavailableReason?: string }
export interface SnapshotTurn { kind?: string; role?: string; name?: string; text?: string; html?: string; images?: SnapshotImage[]; [key: string]: unknown }
export interface SnapshotPayload {
  id?: string; title?: string; engine?: string; engineLabel?: string; displayCwd?: string; generatedAt?: string;
  redacted?: boolean; includeTools?: boolean; includeToolOutput?: boolean; turns: SnapshotTurn[];
  [key: string]: unknown;
}
export interface CreateSnapshotRequest { schemaVersion?: 1; snapshot: SnapshotPayload; shareId?: string; siteUrl?: string; expiresInDays?: number }
export interface PublishSnapshotResponse { schemaVersion: 1; id: string; url: string; createdAt: string; updatedAt: string; expiresAt: string | null }
export interface SnapshotShare extends Omit<PublishSnapshotResponse, 'schemaVersion'> { title: string; engine?: string; engineLabel?: string; redacted: boolean; turnCount: number }
export interface SnapshotResponse { schemaVersion: 1; share: SnapshotShare; snapshot: SnapshotPayload }
export function parseSnapshot(value: unknown): SnapshotPayload;
export function parseCreateSnapshotRequest(value: unknown): CreateSnapshotRequest;
export function parsePublishSnapshotResponse(value: unknown): PublishSnapshotResponse;
export function parseSnapshotResponse(value: unknown): SnapshotResponse;
