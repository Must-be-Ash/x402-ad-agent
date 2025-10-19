// Server-Sent Events broadcaster for real-time auction updates

import { storeEvent } from './db';

type EventController = ReadableStreamDefaultController;

// Store active SSE connections per ad spot
const connections = new Map<string, Set<EventController>>();

// Event type definitions
export type AuctionEventType =
  | 'agent_started'
  | 'scraping_started'
  | 'scraping_completed'
  | 'analytics_payment'
  | 'analytics_received'
  | 'analysis_started'
  | 'analysis_completed'
  | 'thinking'
  | 'bid_placed'
  | 'reflection'
  | 'refund'
  | 'withdrawal'
  | 'agent_skipped'
  | 'agent_error'
  | 'auction_ended'
  | 'ad_image_ready'
  | 'image_generating';

/**
 * Register a new SSE connection for an ad spot
 */
export function registerConnection(adSpotId: string, controller: EventController) {
  if (!connections.has(adSpotId)) {
    connections.set(adSpotId, new Set());
  }
  connections.get(adSpotId)!.add(controller);
  console.log(`📡 [SSE] Connection registered for "${adSpotId}" (${connections.get(adSpotId)!.size} total)`);
  console.log(`📡 [SSE] All active ad spots:`, Array.from(connections.keys()));
}

/**
 * Unregister an SSE connection
 */
export function unregisterConnection(adSpotId: string, controller: EventController) {
  const adSpotConnections = connections.get(adSpotId);
  if (adSpotConnections) {
    adSpotConnections.delete(controller);
    console.log(`📡 SSE connection closed for ${adSpotId} (${adSpotConnections.size} remaining)`);

    if (adSpotConnections.size === 0) {
      connections.delete(adSpotId);
    }
  }
}

/**
 * Broadcast an event to all connected clients for an ad spot
 * ALWAYS stores event in MongoDB for complete observability
 */
export async function broadcastEvent(adSpotId: string, event: Record<string, unknown>) {
  try {
    // ALWAYS store event in MongoDB first - ensures nothing is lost
    await storeEvent(adSpotId, event);

    const controllers = connections.get(adSpotId);
    if (!controllers || controllers.size === 0) {
      console.log(`📡 [STORED] No live connections for "${adSpotId}", event stored in DB:`, event.type);
      console.log(`📡 [DEBUG] Available connections:`, Array.from(connections.keys()));
      return;
    }

    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(event)}\n\n`;

    console.log(`📡 [SUCCESS] Broadcasting ${event.type} to ${controllers.size} client(s) for ${adSpotId}`);

    controllers.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch (error) {
        console.error('📡 [ERROR] Failed to send to client, removing connection:', error);
        controllers.delete(controller);
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`📡 [ERROR] Failed to broadcast event for "${adSpotId}":`, event.type, errorMessage);
  }
}

/**
 * Get the number of active connections for an ad spot
 */
export function getConnectionCount(adSpotId: string): number {
  return connections.get(adSpotId)?.size || 0;
}

