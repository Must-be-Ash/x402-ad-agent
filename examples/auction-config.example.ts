/**
 * Example: Auction Configuration
 *
 * This file demonstrates how to customize auction parameters
 * through environment variables.
 *
 * Add these to your .env.local file to customize auction behavior.
 */

// ============================================
// BASIC AUCTION PARAMETERS
// ============================================

// How long each auction runs (in minutes)
// Default: 5 minutes
// Example values: 1, 5, 10, 30, 60
// AUCTION_DURATION_MINUTES=10

// Starting bid amount in USDC
// Default: 1 USDC
// Example values: 0.5, 1, 5, 10
// STARTING_BID_USDC=2

// Minimum increment for each new bid in USDC
// Default: 1 USDC
// Example values: 0.25, 0.5, 1, 2.5, 5
// BID_INCREMENT_USDC=0.5

// ============================================
// EXAMPLE CONFIGURATIONS
// ============================================

/**
 * FAST AUCTION (for testing)
 * Quick 1-minute auctions with small increments
 *
 * AUCTION_DURATION_MINUTES=1
 * STARTING_BID_USDC=0.5
 * BID_INCREMENT_USDC=0.25
 */

/**
 * PREMIUM AUCTION (high-value placements)
 * Longer duration, higher starting bid, bigger increments
 *
 * AUCTION_DURATION_MINUTES=30
 * STARTING_BID_USDC=10
 * BID_INCREMENT_USDC=5
 */

/**
 * MICRO AUCTION (low-cost placements)
 * Standard duration, very low bids
 *
 * AUCTION_DURATION_MINUTES=5
 * STARTING_BID_USDC=0.1
 * BID_INCREMENT_USDC=0.1
 */

/**
 * COMPETITIVE AUCTION (active bidding)
 * Standard duration, moderate starting bid, small increments
 * Encourages more back-and-forth bidding
 *
 * AUCTION_DURATION_MINUTES=5
 * STARTING_BID_USDC=1
 * BID_INCREMENT_USDC=0.5
 */

// ============================================
// PROGRAMMATIC CONFIGURATION
// ============================================

/**
 * You can also set these programmatically before starting your server.
 * This is useful for dynamic configurations or multi-environment setups.
 */

// Example: Set auction parameters based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Fast auctions for testing
  process.env.AUCTION_DURATION_MINUTES = '1';
  process.env.STARTING_BID_USDC = '0.5';
  process.env.BID_INCREMENT_USDC = '0.25';
} else {
  // Production values
  process.env.AUCTION_DURATION_MINUTES = '30';
  process.env.STARTING_BID_USDC = '5';
  process.env.BID_INCREMENT_USDC = '2';
}

// ============================================
// MULTIPLE AD SPOT CONFIGURATIONS
// ============================================

/**
 * Different ad spots can have different values.
 * While this demo uses global settings, you could extend it to have
 * per-spot configurations in the database.
 *
 * Example structure:
 */

interface AdSpotConfig {
  id: string;
  name: string;
  startingBid: number;
  bidIncrement: number;
  auctionDuration: number; // in minutes
  description: string;
}

const adSpotConfigs: AdSpotConfig[] = [
  {
    id: 'homepage-hero',
    name: 'Homepage Hero Banner',
    startingBid: 10,
    bidIncrement: 2,
    auctionDuration: 30,
    description: 'Premium placement - above the fold on homepage'
  },
  {
    id: 'sidebar-prime',
    name: 'Sidebar Top Position',
    startingBid: 5,
    bidIncrement: 1,
    auctionDuration: 15,
    description: 'High-visibility sidebar placement'
  },
  {
    id: 'footer-banner',
    name: 'Footer Banner',
    startingBid: 1,
    bidIncrement: 0.5,
    auctionDuration: 5,
    description: 'Budget-friendly footer placement'
  }
];

// To implement per-spot configurations, you would modify:
// 1. lib/db.ts - Store config with each ad spot
// 2. lib/x402-config.ts - Use spot-specific config
// 3. app/api/bid/[adSpotId]/route.ts - Look up config per spot

export { adSpotConfigs };

