import type { Engagement, IntakeFields } from "../types";

export type StorageAdapterName = "file" | "cloudflare";

export interface EngagementStore {
  listEngagements(): Promise<Engagement[]>;
  getEngagement(id: string): Promise<Engagement | null>;
  createEngagementRecord(intake: IntakeFields): Promise<Engagement>;
  saveEngagement(next: Engagement): Promise<Engagement>;
  putUpload(storedName: string, bytes: Uint8Array): Promise<void>;
  getUpload(storedName: string): Promise<Uint8Array | null>;
}
