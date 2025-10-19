import { NextRequest, NextResponse } from 'next/server';
import { getAdSpotRecord, updateAdSpotRecord } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adSpotId: string }> }
) {
  const { adSpotId } = await params;

  try {
    const body = await request.json();
    const { agentId, reflection } = body;

    if (!agentId || !reflection) {
      return NextResponse.json(
        { error: 'Missing agentId or reflection' },
        { status: 400 }
      );
    }

    // Get current bid record
    const bidRecord = await getAdSpotRecord(adSpotId);

    if (!bidRecord) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Find the most recent bid from this agent and add reflection
    const bidHistory = bidRecord.bidHistory || [];
    const lastBidIndex = bidHistory.map(b => b.agentId).lastIndexOf(agentId);

    if (lastBidIndex !== -1) {
      bidHistory[lastBidIndex] = {
        ...bidHistory[lastBidIndex],
        reflection,
      };

      await updateAdSpotRecord(adSpotId, {
        bidHistory,
      });

      console.log(`📝 [${agentId}] Reflection added: ${reflection.substring(0, 100)}...`);

      // Broadcast reflection event
      broadcastEvent(adSpotId, {
        type: 'reflection',
        agentId,
        reflection,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'No bid found for this agent' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Error storing reflection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

