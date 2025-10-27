/**
 * x402 Protocol and Auction Configuration
 *
 * Central configuration for:
 * - x402 payment protocol settings
 * - Auction parameters (duration, starting bid, increments)
 * - Blockchain addresses and constants
 *
 * All values can be customized via environment variables.
 */

/**
 * x402 facilitator configuration
 * The facilitator handles payment verification and settlement
 */
export const facilitatorConfig = {
  url: process.env.FACILITATOR_URL || 'https://x402.org/facilitator'
};

/**
 * Calculate the minimum bid required for the current auction state
 *
 * If no bids exist, returns the starting bid.
 * Otherwise, returns current bid + increment.
 *
 * @param currentBid - Current highest bid, or null if no bids yet
 * @returns Formatted price string (e.g., "$5.00")
 */
export function calculateCurrentBidPrice(currentBid: number | null): string {
  if (!currentBid) {
    const startingBid = parseFloat(process.env.STARTING_BID_USDC || '1');
    return `$${startingBid.toFixed(2)}`;
  }

  const increment = parseFloat(process.env.BID_INCREMENT_USDC || '1');
  const nextBid = currentBid + increment;

  return `$${nextBid.toFixed(2)}`;
}

/**
 * Parse a formatted price string into a number
 *
 * @param priceString - Formatted price (e.g., "$5.00")
 * @returns Numeric value (e.g., 5.00)
 */
export function parseBidAmount(priceString: string): number {
  // Remove $ sign and parse as float
  return parseFloat(priceString.replace('$', ''));
}

/**
 * Auction duration in milliseconds
 * Configurable via AUCTION_DURATION_MINUTES environment variable
 * Default: 5 minutes
 */
export const AUCTION_DURATION_MS =
  (parseInt(process.env.AUCTION_DURATION_MINUTES || '5') * 60 * 1000);

/**
 * USDC token contract address on Base Sepolia testnet
 * This is the payment token used for all bids and refunds
 */
export const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
