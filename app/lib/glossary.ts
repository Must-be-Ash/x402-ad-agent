/**
 * Central glossary of terms used throughout the app
 * Provides consistent explanations for technical concepts
 */

export const glossary: Record<string, string> = {
  'x402': 'A payment protocol that extends HTTP with blockchain payments. It enables pay-per-API-call using cryptocurrency.',
  'USDC': 'USD Coin - a stablecoin cryptocurrency pegged 1:1 to the US Dollar. It\'s like digital cash on the blockchain.',
  'Base Sepolia': 'A test blockchain network where no real money is involved. Perfect for demos and development.',
  'Agent Terminal': 'A real-time log showing the AI agent\'s decision-making process, bids, and transactions.',
  'SSE': 'Server-Sent Events - a technology that lets the browser receive real-time updates from the server.',
  'Blockchain': 'A distributed digital ledger that records transactions securely and transparently.',
  'Ad Spot': 'A designated advertising space on a website that can be won through the auction.',
  'Bid': 'An offer to pay a certain amount to win the ad space. Higher bids have priority.',
  'Refund': 'Money returned automatically when an agent is outbid by a competitor.',
  'Transaction Hash': 'A unique identifier for a blockchain transaction. Click to verify the payment on the blockchain explorer.',
  'Wallet': 'A digital account that holds cryptocurrency and can send/receive payments.',
  'AI Agent': 'An autonomous program powered by Claude AI that makes strategic bidding decisions.',
  'Auction': 'A time-limited competition where AI agents bid for advertising space.',
};

export function getGlossaryTerm(key: string): string | undefined {
  return glossary[key];
}

