/**
 * Example: Minimal Agent Setup
 *
 * The simplest possible agent configuration for wallet integration testing.
 * Demonstrates basic CDP wallet integration with x402 payment protocol.
 *
 * Prerequisites:
 * 1. Set up CDP credentials in .env (CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET)
 * 2. Set BID_ANTHROPIC_API_KEY in .env
 * 3. Run: tsx examples/minimal-agent.ts
 *
 * Note: This example uses CDP wallet. You can also use Crossmint wallet
 * by setting walletType: 'crossmint' and providing the required credentials.
 */

import { IntelligentBiddingAgent } from '../agents/shared/intelligent-agent';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Minimal required configuration using CDP wallet
const agent = new IntelligentBiddingAgent({
  walletType: 'cdp',
  cdpWalletId: process.env.AGENT_A_CDP_WALLET_ID, // Optional - creates new wallet if not provided
  agentName: 'MinimalAgent',
  maxBid: 5,
  serverUrl: process.env.BID_SERVER_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',

  // Optional: Brand identity for AI decision-making context
  // For wallet demos, keep it focused on technical features
  brandIdentity: {
    brandName: 'Test Agent',
    productName: 'Wallet Integration Demo',
    industry: 'Blockchain Infrastructure',
    productDescription: 'Testing CDP wallet integration with x402 protocol',
    targetAudience: 'Developers testing wallet integration',
    brandPersonality: 'Technical, straightforward',
    marketingAngle: 'Demonstrating autonomous payment capabilities',
    visualStyle: 'Clean and technical',
    keyMessages: ['Wallet integration', 'x402 protocol', 'Autonomous payments']
  }
});

agent.start('demo-spot-1');

process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

