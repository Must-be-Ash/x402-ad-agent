import { NextRequest, NextResponse } from 'next/server';
import { broadcastEvent } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: { adSpotId: string } }
) {
  const adSpotId = params.adSpotId;
  const body = await request.json();

  const { agentId, status, message, imageUrl, taskId } = body;

  console.log(`[image-status] ${adSpotId} - ${agentId}: ${status}`);

  // Broadcast to SSE clients
  broadcastEvent(adSpotId, {
    type: 'image_generation_update',
    agentId,
    status, // 'started', 'progress', 'completed', 'failed'
    message,
    imageUrl,
    taskId,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({ success: true });
}
