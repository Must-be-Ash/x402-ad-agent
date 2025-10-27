/**
 * Example: Custom Brand Agent
 *
 * This example shows how to create an agent with a custom brand identity.
 * Customize the brandIdentity object below to match your brand.
 *
 * Usage:
 * 1. Copy this file to agents/myBrandAgent.ts
 * 2. Customize the brand identity
 * 3. Add your wallet key to agents/.env as MY_BRAND_AGENT_KEY
 * 4. Add npm script to package.json: "agent:mybrand": "tsx agents/myBrandAgent.ts"
 * 5. Run: npm run agent:mybrand
 */

import { IntelligentBiddingAgent } from '../agents/shared/intelligent-agent';
import dotenv from 'dotenv';
import { Hex } from 'viem';

dotenv.config({ path: 'agents/.env' });

const customBrandAgent = new IntelligentBiddingAgent({
  // Wallet configuration
  privateKey: process.env.MY_BRAND_AGENT_KEY as Hex,
  agentName: 'MyBrand', // Name shown in UI and logs
  maxBid: 15, // Maximum bid in USDC

  // Server configuration
  serverUrl: process.env.BID_SERVER_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',

  // Brand identity - this is what the AI uses to make decisions
  brandIdentity: {
    // Basic brand info
    brandName: 'Your Brand Name',
    productName: 'Your Product or Service',
    industry: 'Your Industry (e.g., Technology, Fashion, Food & Beverage)',

    // Detailed product description
    productDescription: `
      A comprehensive description of your product or service.
      Include what makes it unique, key features, benefits,
      and why customers choose you over competitors.
    `.trim(),

    // Target audience definition
    targetAudience: `
      Be specific: demographics (age, location), psychographics
      (interests, values), behaviors (tech-savvy, early adopters),
      and pain points your product solves.
      Example: "Tech-savvy millennials and Gen-Z who value sustainability"
    `.trim(),

    // Brand personality
    brandPersonality: `
      Adjectives that describe your brand's character.
      Example: "Innovative, trustworthy, approachable, premium, fun"
    `.trim(),

    // Marketing angle / unique selling proposition
    marketingAngle: `
      Your key marketing message or unique selling point.
      What makes you different? Why should someone choose you?
      Example: "The fastest way to build crypto applications - no blockchain knowledge required"
    `.trim(),

    // Visual style for ad creatives
    visualStyle: `
      Describe your visual aesthetic, colors, imagery style, and design approach.
      Example: "Bold modern design with vibrant gradients (purple, blue),
      high-energy photography, diverse representation, mobile-first layouts"
    `.trim(),

    // Key messages to emphasize
    keyMessages: [
      'First key benefit or message',
      'Second unique selling point',
      'Third trust factor or social proof',
      'Fourth call-to-action or value prop',
      'Fifth additional message'
    ]
  }
});

// Start bidding on the specified ad spot
const adSpotId = process.env.AD_SPOT_ID || 'demo-spot-1';
console.log(`\n🎯 Starting ${customBrandAgent['agentName']} agent for ad spot: ${adSpotId}\n`);
customBrandAgent.start(adSpotId);

// Handle graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down agent...');
  customBrandAgent.stop();
  process.exit(0);
});

/**
 * Tips for effective brand identity:
 *
 * 1. Be specific - Generic descriptions lead to generic decisions
 * 2. Include context - Help the AI understand your market position
 * 3. Emphasize differentiation - What makes you unique?
 * 4. Target audience matters - The AI considers audience fit
 * 5. Visual style helps - Even though this demo doesn't generate images,
 *    the AI uses this to assess brand-placement fit
 */

