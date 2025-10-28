import axios from 'axios';

/**
 * AuctionMonitor
 *
 * Manages refund and auction end monitoring for bidding agents.
 * Handles periodic polling and callback execution when events are detected.
 */
export class AuctionMonitor {
  private refundInterval: NodeJS.Timeout | null = null;
  private auctionEndInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring for refunds (when agent is outbid)
   *
   * @param getBalance - Function to get current USDC balance
   * @param onRefund - Callback when refund is detected
   * @param agentName - Agent name for logging
   * @param checkInterval - How often to check (default: 2000ms)
   */
  async startRefundMonitoring(
    getBalance: () => Promise<number>,
    onRefund: (amount: number) => Promise<void>,
    agentName: string,
    checkInterval: number = 2000
  ): Promise<void> {
    if (this.refundInterval) {
      return; // Already monitoring
    }

    console.log(`👀 [${agentName}] Monitoring for refunds...`);

    // Get initial balance to establish baseline
    let previousBalance = await getBalance();
    console.log(`   📊 Baseline balance: ${previousBalance.toFixed(2)} USDC`);

    this.refundInterval = setInterval(async () => {
      try {
        const currentBalance = await getBalance();

        if (currentBalance > previousBalance) {
          const refundAmount = currentBalance - previousBalance;
          console.log(`\n🔔 [${agentName}] REFUND DETECTED: ${refundAmount.toFixed(2)} USDC`);

          // Execute callback
          await onRefund(refundAmount);
        }

        previousBalance = currentBalance;
      } catch (error: any) {
        console.error(`❌ [${agentName}] Error checking balance:`, error.message);
      }
    }, checkInterval);
  }

  /**
   * Start monitoring for auction end
   *
   * @param serverUrl - Server URL
   * @param adSpotId - Ad spot ID to monitor
   * @param onAuctionEnd - Callback when auction ends
   * @param agentName - Agent name for logging
   * @param checkInterval - How often to check (default: 5000ms)
   */
  startAuctionEndMonitoring(
    serverUrl: string,
    adSpotId: string,
    onAuctionEnd: (winner: string | null, finalBid: number) => void,
    agentName: string,
    checkInterval: number = 5000
  ): void {
    if (this.auctionEndInterval) {
      return; // Already monitoring
    }

    console.log(`👀 [${agentName}] Monitoring for auction end...`);

    this.auctionEndInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/status?adSpotId=${adSpotId}`
        );
        const state = response.data;

        if (state.auctionEnded) {
          const winner = state.currentWinner?.agentId || state.currentWinner;
          const finalBid = state.currentBid || 0;

          if (winner === agentName) {
            console.log(`\n🎉 [${agentName}] WE WON THE AUCTION!`);
            console.log(`🖼️  [${agentName}] Wallet logo will be displayed`);
          } else {
            console.log(`\n😔 [${agentName}] Auction ended - we lost to ${winner || 'unknown'}`);
            console.log(`🏁 [${agentName}] Final bid: $${finalBid}`);
          }

          // Execute callback
          onAuctionEnd(winner, finalBid);

          // Stop monitoring
          this.stop();
        }
      } catch (error: any) {
        console.error(`❌ [${agentName}] Error monitoring auction end:`, error.message);
      }
    }, checkInterval);
  }

  /**
   * Stop all monitoring
   */
  stop(): void {
    if (this.refundInterval) {
      clearInterval(this.refundInterval);
      this.refundInterval = null;
    }

    if (this.auctionEndInterval) {
      clearInterval(this.auctionEndInterval);
      this.auctionEndInterval = null;
    }
  }

  /**
   * Check if currently monitoring refunds
   */
  isMonitoringRefunds(): boolean {
    return this.refundInterval !== null;
  }

  /**
   * Check if currently monitoring auction end
   */
  isMonitoringAuctionEnd(): boolean {
    return this.auctionEndInterval !== null;
  }
}
