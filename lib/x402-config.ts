export const facilitatorConfig = {
  url: process.env.FACILITATOR_URL || 'https://x402.org/facilitator'
};

export function calculateCurrentBidPrice(currentBid: number | null): string {
  if (!currentBid) {
    const startingBid = parseFloat(process.env.STARTING_BID_USDC || '1');
    return `$${startingBid.toFixed(2)}`;
  }

  const increment = parseFloat(process.env.BID_INCREMENT_USDC || '1');
  const nextBid = currentBid + increment;

  return `$${nextBid.toFixed(2)}`;
}

export function parseBidAmount(priceString: string): number {
  // Remove $ sign and parse as float
  return parseFloat(priceString.replace('$', ''));
}

export const AUCTION_DURATION_MS =
  (parseInt(process.env.AUCTION_DURATION_MINUTES || '5') * 60 * 1000);

export const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Freepik x402 Configuration (Base Mainnet)
export const FREEPIK_X402_CONFIG = {
  network: 'base', // Mainnet
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://x402.org/facilitator'
};
