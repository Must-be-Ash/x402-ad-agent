import { AdSpotRecord } from '@/types';

// In-memory storage for the demo
const inMemoryStorage = {
  adSpotRecords: new Map<string, AdSpotRecord>(),
  analyticalEvents: [] as StoredEvent[]
};

console.log('📦 Using in-memory storage (data will not persist between server restarts)');

// Event storage interface
export interface StoredEvent {
  adSpotId: string;
  event: Record<string, unknown>;
  timestamp: Date;
}

// Ad Spot functions
export async function getAdSpotRecord(adSpotId: string): Promise<AdSpotRecord | null> {
  return inMemoryStorage.adSpotRecords.get(adSpotId) || null;
}

export async function updateAdSpotRecord(
  adSpotId: string,
  update: Partial<AdSpotRecord>
): Promise<void> {
  const existing = inMemoryStorage.adSpotRecords.get(adSpotId);
  const updated = {
    ...existing,
    ...update,
    adSpotId,
    updatedAt: new Date(),
    createdAt: existing?.createdAt || new Date()
  } as AdSpotRecord;
  inMemoryStorage.adSpotRecords.set(adSpotId, updated);
}

export async function addBidToHistory(
  adSpotId: string,
  bid: AdSpotRecord['bidHistory'][0]
): Promise<void> {
  const existing = inMemoryStorage.adSpotRecords.get(adSpotId);
  if (existing) {
    existing.bidHistory = existing.bidHistory || [];
    existing.bidHistory.push(bid);
    existing.updatedAt = new Date();
    inMemoryStorage.adSpotRecords.set(adSpotId, existing);
  }
}

// Event storage for complete observability
export async function storeEvent(adSpotId: string, event: Record<string, unknown>): Promise<void> {
  try {
    inMemoryStorage.analyticalEvents.push({
      adSpotId,
      event,
      timestamp: new Date()
    });
    console.log(`💾 [DB] ✅ Stored event for ${adSpotId}:`, event.type);
  } catch (error) {
    // Log error but don't throw - we don't want to break the event flow
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`💾 [DB] ❌ Failed to store event for ${adSpotId}:`, event.type, errorMessage);
  }
}

export async function getStoredEvents(adSpotId: string, since?: Date): Promise<StoredEvent[]> {
  let events = inMemoryStorage.analyticalEvents.filter(e => e.adSpotId === adSpotId);
  if (since) {
    events = events.filter(e => e.timestamp >= since);
  }
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  console.log(`📖 [DB] Retrieved ${events.length} stored events for ${adSpotId}`);
  return events;
}
