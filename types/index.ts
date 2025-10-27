/**
 * Type definitions for the x402 ad auction system
 *
 * Core data structures:
 * - AdSpotRecord: Complete auction state stored in database
 * - AgentConfig: Agent wallet and bidding configuration
 * - BidEvent: Real-time event for UI updates
 */

import { ObjectId } from 'mongodb';

/**
 * Ad Spot Record - Complete auction state
 *
 * Represents a single ad spot auction with full bid history and metadata.
 * Stored in MongoDB (or in-memory if MongoDB not configured).
 */
export interface AdSpotRecord {
  /** MongoDB document ID */
  _id?: ObjectId;

  /** Unique identifier for this ad spot (e.g., "homepage-banner-1") */
  adSpotId: string;

  /** Current highest bid amount in USDC */
  currentBid: number;

  /** Current winning bidder information */
  currentWinner: {
    /** Agent's display name */
    agentId: string;
    /** Agent's blockchain wallet address */
    walletAddress: string;
    /** x402 external ID for payment tracking */
    externalId: string;
    /** When this bid was placed */
    timestamp: Date;
  } | null;

  /** Complete history of all bids placed */
  bidHistory: {
    /** Agent's display name */
    agentId: string;
    /** Agent's blockchain wallet address */
    walletAddress: string;
    /** Bid amount in USDC */
    amount: number;
    /** When bid was placed */
    timestamp: Date;
    /** Blockchain transaction hash (if settled) */
    txHash?: string;
    /** AI's reasoning before bidding */
    thinking?: string;
    /** Bidding strategy used */
    strategy?: string;
    /** Detailed reasoning for bid amount */
    reasoning?: string;
    /** Post-bid reflection/analysis */
    reflection?: string;
  }[];

  /** When auction started */
  auctionStartTime: Date;

  /** When auction ends/ended */
  auctionEndTime: Date;

  /** Current auction status */
  status: 'active' | 'ended' | 'displaying_ad';

  /** Agents who explicitly withdrew from auction */
  withdrawnAgents?: string[];

  /** Agents who decided not to bid on this spot */
  skippedAgents?: string[];

  /** Whether auction ended (including early endings) */
  auctionEnded?: boolean;

  /** Reason for auction ending */
  auctionEndReason?: string;

  /** Final winner's agent ID */
  winner?: string;

  /** Ad image URL (if winner generated/provided image) */
  winnerAdImage?: string;

  /** Record creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

// Legacy interface for backwards compatibility (deprecated)
export interface BidRecord extends Omit<AdSpotRecord, 'adSpotId'> {
  basename: string;
}

/**
 * Agent configuration for bidding
 */
export interface AgentConfig {
  /** Agent display name */
  name: string;
  /** Agent's private key for signing transactions */
  privateKey: `0x${string}`;
  /** Agent's wallet address */
  walletAddress: string;
  /** Maximum bid this agent will place (in USDC) */
  maxBid: number;
}

/**
 * Real-time auction event for UI updates
 *
 * Events are stored in the database and polled by the frontend
 * to update the auction UI in real-time.
 */
export interface BidEvent {
  /** Event type */
  type: 'bid' | 'refund' | 'auction_end' | 'transfer_complete';
  /** Agent ID that triggered this event */
  agentId: string;
  /** Amount involved (USDC) */
  amount: number;
  /** When event occurred */
  timestamp: Date;
  /** Human-readable event description */
  message: string;
}
