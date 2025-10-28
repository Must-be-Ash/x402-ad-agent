/**
 * Intelligent Agent A - CDP Wallet Integration Demo
 *
 * Demonstrates AI-powered bidding agent using Coinbase Developer Platform (CDP) wallet.
 * Showcases gasless transactions, smart wallet features, and x402 payment integration.
 *
 * Wallet: Coinbase Developer Platform (CDP)
 * Features: Gasless transactions via paymaster, smart accounts, enterprise-ready
 *
 * Usage: npm run agent:ai:a
 */

import { IntelligentBiddingAgent } from './shared/intelligent-agent';
import dotenv from 'dotenv';

// Load environment variables from root .env file
dotenv.config({ path: '.env' });

const agentA = new IntelligentBiddingAgent({
  walletType: 'cdp',
  cdpWalletId: process.env.AGENT_A_CDP_WALLET_ID, // Optional - will create new wallet if not provided
  agentName: process.env.AGENT_A_NAME || 'CDP Agent',
  maxBid: parseFloat(process.env.AGENT_A_MAX_BID || '10'),
  serverUrl: process.env.BID_SERVER_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',
  brandIdentity: {
    brandName: 'CDP Agent',
    productName: 'Coinbase Developer Platform',
    industry: 'Blockchain Wallet Infrastructure',
    productDescription: 'Enterprise-grade smart wallet platform with gasless transactions and developer-friendly APIs for building autonomous payment systems',
    targetAudience: 'Developers building agent-to-agent payment systems and autonomous blockchain applications',
    brandPersonality: 'Reliable, innovative, developer-focused, professional, cutting-edge',
    marketingAngle: 'Build the future of autonomous payments with enterprise-grade wallet infrastructure',
    visualStyle: 'Clean, technical, Coinbase blue branding, professional developer aesthetic, modern fintech design',
    keyMessages: [
      'Gasless transactions via paymaster',
      'Smart wallet accounts',
      'x402 payment integration',
      'Enterprise-ready infrastructure',
      'Developer-friendly APIs'
    ]
  }
});

const adSpotId = process.env.AD_SPOT_ID || 'homepage-banner-1';
agentA.start(adSpotId);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Intelligent Agent A...');
  agentA.stop();
  process.exit(0);
});

