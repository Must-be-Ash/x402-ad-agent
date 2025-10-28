#!/usr/bin/env tsx
/**
 * Setup help script
 * Provides guidance for setting up the x402 ad auction demo
 *
 * Usage: npm run setup:help
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          X402 AI Ad Auction Demo - Setup Guide                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Welcome! This guide will help you get the demo running.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 1: Environment Files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create your environment configuration files:

  cp .env.example .env.local
  cp agents/.env.example agents/.env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 2: Generate Server Wallet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a wallet key for the server (for handling refunds):

  # Generate a wallet and copy the output
  node -e "const {generatePrivateKey, privateKeyToAccount} = require('viem/accounts'); const pk = generatePrivateKey(); const addr = privateKeyToAccount(pk).address; console.log('Private Key:', pk); console.log('Address:', addr);"

Add the keys to .env:
  • SERVER_WALLET_PRIVATE_KEY=<private_key>
  • SERVER_WALLET_ADDRESS=<address>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 3: Setup Agent Wallets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agent A uses CDP wallet, Agent B uses Crossmint wallet.

Agent A - CDP Wallet Setup:
  1. Go to https://portal.cdp.coinbase.com/
  2. Create a new API key and save the credentials
  3. Add to .env:
     • CDP_API_KEY_ID=<your_api_key_id>
     • CDP_API_KEY_SECRET=<your_api_key_secret>
     • CDP_WALLET_SECRET=<generate_a_random_secret>
     • AGENT_A_CDP_WALLET_ID=<leave_empty_for_first_run>

Agent B - Crossmint Wallet Setup:
  1. Go to https://www.crossmint.com/console
  2. Create a server-side API key
  3. Create a custodial wallet (or use existing)
  4. Add to .env:
     • AGENT_B_CROSSMINT_API_KEY=<your_api_key>
     • AGENT_B_CROSSMINT_WALLET_LOCATOR=email:user@example.com:evm:smart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 4: Get Anthropic API Key (for AI agents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Go to https://console.anthropic.com/
  2. Sign up or log in
  3. Create a new API key
  4. Add to .env as BID_ANTHROPIC_API_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 5: Fund Wallets with Test USDC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your wallets need Base Sepolia USDC to place bids.

Option A - Automated (requires Coinbase CDP):
  1. Sign up at https://portal.cdp.coinbase.com/
  2. Add CDP credentials to .env.local (optional)
  3. Run: npm run fund:agents

Option B - Manual:
  1. Go to Base Sepolia Faucet
  2. Request test ETH and USDC for each wallet address
  3. Verify balances: npm run check:server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 6: Validate Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check that everything is configured correctly:

  npm run check:env

This will validate:
  ✅ Environment files exist
  ✅ Wallet keys are properly formatted
  ✅ Required variables are set

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 7: Start the Demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open 3 terminal windows and run:

Terminal 1 - Start Server:
  npm run dev

Terminal 2 - Start Agent A:
  npm run agent:ai:a

Terminal 3 - Start Agent B:
  npm run agent:ai:b

Then open your browser:
  http://localhost:3000/auction/demo-spot-1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Optional: MongoDB for Persistent Storage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By default, auction data is stored in-memory (lost on restart).

For persistent storage:
  1. Create free MongoDB at https://www.mongodb.com/cloud/atlas
  2. Get connection string
  3. Add to .env.local:
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
     MONGODB_DB_NAME=x402-auction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Troubleshooting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ "Insufficient USDC balance"
   → Fund wallets: npm run fund:agents

❓ "MongoDB connection failed"
   → Remove MONGODB_URI from .env.local to use in-memory mode

❓ "Agent not bidding"
   → Check BID_ANTHROPIC_API_KEY is set and valid
   → Ensure agent wallet has USDC
   → Check AGENT_X_MAX_BID is high enough

❓ "Port 3000 already in use"
   → Use different port: PORT=3001 npm run dev
   → Update BID_SERVER_URL in agents/.env

For more help, see README.md or open an issue on GitHub.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Quick Reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Helpful commands:
  npm run check:env       → Validate configuration
  npm run check:server    → Check server wallet balance
  npm run fund:agents     → Fund agent wallets (requires CDP)
  npm run dev             → Start Next.js server
  npm run agent:ai:a      → Start Agent A
  npm run agent:ai:b      → Start Agent B

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Happy bidding! 🚀
`);

