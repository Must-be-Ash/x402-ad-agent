import { NextRequest, NextResponse } from 'next/server';
import { getAdSpotRecord, updateAdSpotRecord } from '@/lib/db';
import { AUCTION_DURATION_MS } from '@/lib/x402-config';
import { broadcastEvent } from '@/lib/events';

// Helper function to get brand ad image URL for an agent
function getAgentAdImageUrl(agentId: string): string {
  const brandMap: Record<string, string> = {
    'IceCo': '/iceco.png',
    'FizzUp': '/fizzup.png',
    'AgentA': '/iceco.png',
    'AgentB': '/fizzup.png',
    'Coinbase CDP': '/coinbase.png',
    'Crossmint': '/crossmint.png',
  };
  return brandMap[agentId] || '/iceco.png';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adSpotId = searchParams.get('adSpotId');

  if (!adSpotId) {
    return NextResponse.json({ error: 'adSpotId is required' }, { status: 400 });
  }

  try {
    const bidRecord = await getAdSpotRecord(adSpotId);

    if (!bidRecord) {
      return NextResponse.json({
        adSpotId,
        currentBid: null,
        timeRemaining: null,
        bidHistory: [],
        auctionEnded: false,
        winnerAdImage: null,
      });
    }

    // Get auction end time (use stored value or calculate from start time)
    const auctionEndTime = bidRecord.auctionEndTime ||
      new Date(bidRecord.auctionStartTime.getTime() + AUCTION_DURATION_MS);
    const timeRemaining = Math.max(0, Math.floor((auctionEndTime.getTime() - Date.now()) / 1000));

    // Check if auction time has expired and finalize if needed
    if (timeRemaining === 0 && !bidRecord.auctionEnded) {
      console.log(`⏰ [STATUS] Auction timer expired for ${adSpotId} - finalizing auction`);

      // Get winner's ad image URL
      const winnerAdImage = bidRecord.currentWinner?.agentId
        ? getAgentAdImageUrl(bidRecord.currentWinner.agentId)
        : undefined;

      // Mark auction as ended in database
      await updateAdSpotRecord(adSpotId, {
        auctionEnded: true,
        auctionEndReason: 'Timer expired',
        status: 'ended',
        winnerAdImage,
      });

      // Broadcast auction ended event
      await broadcastEvent(adSpotId, {
        type: 'auction_ended',
        winner: bidRecord.currentWinner,
        finalBid: bidRecord.currentBid,
        reason: 'Timer expired',
        timestamp: new Date().toISOString(),
      });

      // Broadcast ad image ready event
      if (winnerAdImage && bidRecord.currentWinner) {
        await broadcastEvent(adSpotId, {
          type: 'ad_image_ready',
          winner: bidRecord.currentWinner,
          imageUrl: winnerAdImage,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`🏁 [STATUS] Auction ended for ${adSpotId} - Winner: ${bidRecord.currentWinner?.agentId || 'none'}`);
      if (winnerAdImage) {
        console.log(`🖼️  [STATUS] Winner ad image set: ${winnerAdImage}`);
      }

      // Update bidRecord for response
      bidRecord.auctionEnded = true;
      if (winnerAdImage) {
        bidRecord.winnerAdImage = winnerAdImage;
      }
    }

    return NextResponse.json({
      adSpotId,
      currentBid: bidRecord.currentBid,
      currentWinner: bidRecord.currentWinner,
      timeRemaining,
      auctionEndTime: auctionEndTime instanceof Date ? auctionEndTime.toISOString() : auctionEndTime,
      auctionEnded: bidRecord.auctionEnded || false,
      winnerAdImage: bidRecord.winnerAdImage || null,
      bidHistory: bidRecord.bidHistory.map((bid) => ({
        agentId: bid.agentId,
        amount: bid.amount,
        timestamp: bid.timestamp,
        txHash: bid.txHash,
        thinking: bid.thinking,
        strategy: bid.strategy,
        reasoning: bid.reasoning,
        reflection: bid.reflection,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching auction status:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch auction status' },
      { status: 500 }
    );
  }
}
