/**
 * Intelligent Agent B - Crossmint Wallet Integration Demo
 *
 * Demonstrates AI-powered bidding agent using Crossmint custodial wallet.
 * Showcases email-based wallet creation, seamless Web3 onboarding, and x402 payment integration.
 *
 * Wallet: Crossmint Custodial Wallet
 * Features: Email-based authentication, custodial security, enterprise-ready
 *
 * Usage: npm run agent:ai:b
 */

import { IntelligentBiddingAgent } from './shared/intelligent-agent';
import dotenv from 'dotenv';

// Load environment variables from root .env file
dotenv.config({ path: '.env' });

const agentB = new IntelligentBiddingAgent({
  walletType: 'crossmint',
  crossmintApiKey: process.env.AGENT_B_CROSSMINT_API_KEY || '',
  crossmintWalletLocator: process.env.AGENT_B_CROSSMINT_WALLET_LOCATOR || '',
  agentName: process.env.AGENT_B_NAME || 'Crossmint Agent',
  maxBid: parseFloat(process.env.AGENT_B_MAX_BID || '15'),
  serverUrl: process.env.BID_SERVER_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',
  brandIdentity: {
    brandName: 'Crossmint Agent',
    productName: 'Crossmint Custodial Wallets',
    industry: 'Blockchain Wallet Infrastructure',
    productDescription: 'Enterprise custodial wallet solution with email-based authentication and seamless Web3 onboarding for mainstream adoption',
    targetAudience: 'Developers building agent-to-agent payment systems and autonomous blockchain applications',
    brandPersonality: 'Accessible, secure, enterprise-grade, user-focused, innovative',
    marketingAngle: 'Simplify Web3 payments with enterprise custodial wallets and seamless integration',
    visualStyle: 'Clean, modern, Crossmint green branding, approachable developer aesthetic, vibrant fintech design',
    keyMessages: [
      'Email-based wallet creation',
      'Custodial security',
      'x402 payment integration',
      'Seamless Web3 onboarding',
      'Enterprise-ready solution'
    ]
  }
});

const adSpotId = process.env.AD_SPOT_ID || 'homepage-banner-1';
agentB.start(adSpotId);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Intelligent Agent B...');
  agentB.stop();
  process.exit(0);
});

