import { NextRequest } from 'next/server';
import { getStoredEvents, getAdSpotRecord } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint for real-time auction updates
 * Streams events to the browser as they happen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adSpotId: string }> }
) {
  const { adSpotId } = await params;

  console.log(`\n🔌 [SSE] New connection for "${adSpotId}"`);

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let lastEventTime = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection success message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        adSpotId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Send initial state
      try {
        const adSpot = await getAdSpotRecord(adSpotId);
        if (adSpot) {
          const stateMessage = `data: ${JSON.stringify({
            type: 'initial_state',
            adSpotId,
            currentBid: adSpot.currentBid,
            currentWinner: adSpot.currentWinner,
            auctionEnded: adSpot.auctionEnded,
            auctionEndTime: adSpot.auctionEndTime,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(stateMessage));
        }
      } catch (error) {
        console.error(`[SSE] Error fetching initial state:`, error);
      }

      // Poll for new events every 1 second
      intervalId = setInterval(async () => {
        try {
          // Get events since last check
          const events = await getStoredEvents(adSpotId, lastEventTime);

          // Send each new event
          for (const { event, timestamp } of events) {
            const message = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(message));

            // Update last event time
            if (timestamp > lastEventTime) {
              lastEventTime = timestamp;
            }
          }

          // Also send periodic status updates
          const adSpot = await getAdSpotRecord(adSpotId);
          if (adSpot) {
            const statusMessage = `data: ${JSON.stringify({
              type: 'status_update',
              currentBid: adSpot.currentBid,
              currentWinner: adSpot.currentWinner,
              auctionEnded: adSpot.auctionEnded,
              auctionEndTime: adSpot.auctionEndTime,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(statusMessage));
          }

          // Send keepalive comment (prevents connection timeout)
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch (error) {
          console.error(`[SSE] Error in polling loop:`, error);
        }
      }, 1000);
    },
    cancel() {
      console.log(`🔌 [SSE] Connection closed for "${adSpotId}"`);
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

