/**
 * Example: Minimal Agent Setup
 *
 * The simplest possible agent configuration.
 * Good for testing or when you just want basic functionality.
 *
 * Usage:
 * 1. Set required environment variables in agents/.env
 * 2. Run: tsx examples/minimal-agent.ts
 */

import { IntelligentBiddingAgent } from '../agents/shared/intelligent-agent';
import { Hex } from 'viem';

// Minimal required configuration
const agent = new IntelligentBiddingAgent({
  privateKey: (process.env.AGENT_A_PRIVATE_KEY || '0x...') as Hex,
  agentName: 'MinimalAgent',
  maxBid: 5,
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',

  // Even minimal agents need a brand identity
  // The AI uses this to make strategic decisions
  brandIdentity: {
    brandName: 'Test Brand',
    productName: 'Test Product',
    industry: 'Technology',
    productDescription: 'A test product for demonstration',
    targetAudience: 'General audience',
    brandPersonality: 'Professional',
    marketingAngle: 'Simple and effective',
    visualStyle: 'Clean and modern',
    keyMessages: ['Reliable', 'Fast', 'Easy to use']
  }
});

agent.start('demo-spot-1');

process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

