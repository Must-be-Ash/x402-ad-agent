import { NextRequest } from 'next/server';
import { registerConnection, unregisterConnection } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adSpotId: string }> }
) {
  const { adSpotId } = await params;

  console.log(`📡 [SSE] New connection request for ad spot: "${adSpotId}"`);

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      registerConnection(adSpotId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      const connectMsg = { type: 'connected', adSpotId, timestamp: new Date().toISOString() };
      console.log(`📡 [SSE] Sending connection confirmation:`, connectMsg);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`)
      );

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


