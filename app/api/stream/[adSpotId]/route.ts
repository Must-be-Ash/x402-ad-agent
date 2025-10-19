import { NextRequest } from 'next/server';
import { registerConnection, unregisterConnection } from '@/lib/events';
import { getStoredEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adSpotId: string }> }
) {
  const { adSpotId } = await params;

  console.log(`📡 [SSE] New connection request for ad spot: "${adSpotId}"`);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const connectMsg = { type: 'connected', adSpotId, timestamp: new Date().toISOString() };
      console.log(`📡 [SSE] Sending connection confirmation:`, connectMsg);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`)
      );

      // REPLAY ALL STORED EVENTS - ensures complete observability
      console.log(`📖 [SSE] Fetching stored events for "${adSpotId}"...`);
      const storedEvents = await getStoredEvents(adSpotId);
      console.log(`📖 [SSE] Replaying ${storedEvents.length} stored events to new connection`);

      for (const { event } of storedEvents) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch (error) {
          console.error(`📡 [ERROR] Failed to replay event:`, error);
        }
      }

      console.log(`✅ [SSE] Event replay complete, registering for live events`);

      // NOW register for live events
      registerConnection(adSpotId, controller);

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`: heartbeat\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unregisterConnection(adSpotId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


