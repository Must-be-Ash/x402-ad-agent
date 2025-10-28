import { NextRequest, NextResponse } from 'next/server';
import { getAdSpotRecord, updateAdSpotRecord } from '@/lib/db';
import { sendRefund } from '@/lib/wallet';
import { broadcastEvent } from '@/lib/events';

// Helper function to get wallet logo for winning agent
function getAgentAdImageUrl(agentId: string): string {
  const brandMap: Record<string, string> = {
    'CDP Agent': '/coinbase.png',
    'Crossmint Agent': '/crossmint.png',
    'CDP': '/coinbase.png',
    'Crossmint': '/crossmint.png',
    // Legacy support
    'IceCo': '/coinbase.png',
    'FizzUp': '/crossmint.png',
    'AgentA': '/coinbase.png',
    'AgentB': '/crossmint.png',
  };
  return brandMap[agentId] || '/coinbase.png';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adSpotId: string }> }
) {
  const { adSpotId } = await params;
  const body = await request.json();
  const { agentId, walletAddress, reasoning } = body;

  if (!agentId || !walletAddress) {
    return NextResponse.json(
      { error: 'agentId and walletAddress are required' },
      { status: 400 }
    );
  }

  try {
    const bidRecord = await getAdSpotRecord(adSpotId);

    // If no auction record exists yet, the agent hasn't placed any bids
    // This is expected if agent starts with 0 balance - no withdrawal needed
    if (!bidRecord) {
      console.log(`ℹ️  [${agentId}] No auction record yet - agent has not placed any bids`);
      return NextResponse.json({
        success: true,
        refunded: 0,
        message: 'No withdrawal needed - you have not placed any bids yet',
        auctionEnded: false,
      });
    }

    // Find the agent's last bid in history
    const agentBids = bidRecord.bidHistory.filter(bid => bid.agentId === agentId);

    // If agent has no bid history, no refund is needed
    if (agentBids.length === 0) {
      console.log(`ℹ️  [${agentId}] No bid history - no withdrawal needed`);
      return NextResponse.json({
        success: true,
        refunded: 0,
        message: 'No withdrawal needed - you have not placed any bids',
        auctionEnded: false,
      });
    }

    const lastBid = agentBids[agentBids.length - 1];

    // Check if this agent is currently the highest bidder
    if (bidRecord.currentWinner?.agentId === agentId) {
      return NextResponse.json(
        { error: 'Cannot withdraw - you are currently winning. Wait to be outbid first.' },
        { status: 400 }
      );
    }

    // Verify the wallet address matches
    if (bidRecord.currentWinner?.walletAddress !== walletAddress &&
      !bidRecord.bidHistory.some(bid => bid.agentId === agentId)) {
      return NextResponse.json(
        { error: 'Wallet address does not match bid records' },
        { status: 403 }
      );
    }

    console.log(`🏳️ [${agentId}] Requesting withdrawal from auction for ${adSpotId}`);
    console.log(`   Reasoning: ${reasoning || 'No reasoning provided'}`);

    // Mark agent as withdrawn
    const withdrawnAgents = bidRecord.withdrawnAgents || [];
    if (!withdrawnAgents.includes(agentId)) {
      withdrawnAgents.push(agentId);
    }

    // Issue refund for their last bid amount
    const refundAmount = lastBid.amount;
    console.log(`💸 Issuing withdrawal refund of ${refundAmount} USDC to ${agentId}...`);

    const refundTxHash = await sendRefund(walletAddress, refundAmount);
    console.log(`✅ Withdrawal refund completed: ${refundTxHash}`);

    // Update bid record with withdrawal
    await updateAdSpotRecord(adSpotId, {
      withdrawnAgents,
    });

    // Broadcast withdrawal event
    broadcastEvent(adSpotId, {
      type: 'withdrawal',
      agentId,
      amount: refundAmount,
      reasoning: reasoning || 'Agent decided to stop bidding',
      transactionHash: refundTxHash,
      timestamp: new Date().toISOString(),
    });

    // Check if auction should end (only one active bidder remaining)
    const totalBidders = new Set(bidRecord.bidHistory.map(bid => bid.agentId)).size;
    const activeAgents = totalBidders - withdrawnAgents.length;

    if (activeAgents <= 1) {
      console.log(`🏁 Auction ending - only ${activeAgents} active bidder(s) remaining`);

      // Get winner's ad image URL
      const winnerAdImage = bidRecord.currentWinner?.agentId
        ? getAgentAdImageUrl(bidRecord.currentWinner.agentId)
        : undefined;

      // Broadcast auction end event
      broadcastEvent(adSpotId, {
        type: 'auction_ended',
        winner: bidRecord.currentWinner,
        finalBid: bidRecord.currentBid,
        reason: 'All other bidders withdrew',
        timestamp: new Date().toISOString(),
      });

      // Broadcast ad image ready event
      if (winnerAdImage && bidRecord.currentWinner) {
        broadcastEvent(adSpotId, {
          type: 'ad_image_ready',
          winner: bidRecord.currentWinner,
          imageUrl: winnerAdImage,
          timestamp: new Date().toISOString(),
        });
      }

      // Mark auction as ended
      await updateAdSpotRecord(adSpotId, {
        auctionEnded: true,
        auctionEndReason: 'withdrawal',
        status: 'ended',
        winnerAdImage,
      });

      if (winnerAdImage) {
        console.log(`🖼️  [REFUND] Winner ad image set: ${winnerAdImage}`);
      }
    }

    return NextResponse.json({
      success: true,
      refunded: refundAmount,
      transactionHash: refundTxHash,
      auctionEnded: activeAgents <= 1,
      message: activeAgents <= 1
        ? 'Refund issued. Auction has ended - opponent won!'
        : 'Refund issued. You have withdrawn from the auction.',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Refund request failed:`, errorMessage);
    return NextResponse.json(
      { error: `Failed to process refund: ${errorMessage}` },
      { status: 500 }
    );
  }
}

