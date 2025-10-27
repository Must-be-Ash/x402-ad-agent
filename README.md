# X402 AI Ad Auction Demo

An autonomous AI bidding system where intelligent agents compete for advertising space using blockchain payments through the [x402 protocol](https://x402.org). Watch AI agents analyze, strategize, and bid in real-time with full payment verification on Base Sepolia.

## What is x402?

[x402](https://x402.org) is an HTTP payment protocol that extends the standard 402 Payment Required status code. It enables seamless blockchain payments integrated directly into API requests, with automatic payment verification and settlement. Think of it as "pay-per-API-call" using cryptocurrency.

**Key Features:**
- Blockchain payments as part of HTTP requests
- Automatic payment verification and settlement
- Refunds trigger economic signals to agents
- Built on EIP-3009 (Transfer with Authorization)

## Demo Features

- 🤖 **Autonomous AI Agents** - Claude-powered agents make strategic bidding decisions
- 💰 **Real Blockchain Payments** - USDC payments on Base Sepolia via x402
- 🔄 **Refund-as-Signal Pattern** - Outbid agents automatically receive refunds that trigger re-evaluation
- 🎨 **Live Auction UI** - Real-time display of agent thinking, bids, and reflections
- 📊 **Two Agent Types** - Simple bidding agents and analytical agents that scrape/analyze sites

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser UI                                │
│              (Real-time auction dashboard)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │ Polls events
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Server (Port 3000)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes                                               │   │
│  │  • /api/bid/[adSpotId] - Accept bids with x402          │   │
│  │  • /api/status - Auction state & timing                  │   │
│  │  • /api/events/[adSpotId] - Event polling                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Payment Processing                                       │   │
│  │  • Verify x402 payments                                   │   │
│  │  • Settle on-chain via facilitator                       │   │
│  │  • Issue USDC refunds to outbid agents                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────┬────────────────┘
                  │                               │
          x402 payments                    USDC refunds
                  │                               │
                  ↓                               ↓
┌─────────────────────────────┐   ┌─────────────────────────────┐
│     AI Agent A              │   │     AI Agent B              │
│  • Monitors USDC balance    │   │  • Monitors USDC balance    │
│  • Claude AI strategizing   │   │  • Claude AI strategizing   │
│  • Places bids via x402     │   │  • Places bids via x402     │
└─────────────────────────────┘   └─────────────────────────────┘
                  │                               │
                  └───────────┬───────────────────┘
                              ↓
                   ┌──────────────────────┐
                   │  Base Sepolia        │
                   │  (USDC Payments)     │
                   └──────────────────────┘
```

**Components:**
1. **Next.js Server** - Auction platform with x402 payment acceptance
2. **AI Agents** - Autonomous bidders powered by Claude (Anthropic) and LlamaIndex
3. **x402 Protocol** - Payment verification and settlement
4. **Database** - MongoDB or in-memory storage for auction state

## Prerequisites

- **Node.js** 20+ and npm
- **Optional Services** (for full functionality):
  - [Anthropic API Key](https://console.anthropic.com/) - For AI agent decision-making
  - [Coinbase CDP Account](https://portal.cdp.coinbase.com/) - For server wallet management
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - For persistent storage (optional, uses in-memory by default)

## Quick Start

Get the demo running in 5 commands:

```bash
# 1. Clone and install
git clone <repository-url>
cd x402-ad-agent
npm install

# 2. Create environment files (see Environment Setup below)
cp .env.example .env.local
cp agents/.env.example agents/.env

# 3. Start the server
npm run dev

# 4. In another terminal, start Agent A (basic mode, no AI needed)
npm run agent:ai:a

# 5. In another terminal, start Agent B
npm run agent:ai:b

# 6. Open browser to http://localhost:3000/auction/demo-spot-1
```

## Environment Setup

### Server Configuration (`.env.local`)

Create `.env.local` in the project root:

```bash
# ============================================
# SERVER WALLET (REQUIRED for payment settlement)
# ============================================
# Your server wallet's private key (handles refunds and settlements)
SERVER_WALLET_PRIVATE_KEY=0x...
SERVER_WALLET_ADDRESS=0x...

# ============================================
# COINBASE CDP (OPTIONAL - for wallet management)
# ============================================
# Get these from https://portal.cdp.coinbase.com/
# CDP_API_KEY_ID=
# CDP_API_KEY_SECRET=
# CDP_WALLET_SECRET=

# ============================================
# DATABASE (OPTIONAL - defaults to in-memory)
# ============================================
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
# MONGODB_DB_NAME=x402-auction

# ============================================
# AUCTION PARAMETERS (OPTIONAL)
# ============================================
AUCTION_DURATION_MINUTES=5      # How long each auction runs
STARTING_BID_USDC=1            # Starting bid amount in USDC
BID_INCREMENT_USDC=1           # Minimum bid increment

# ============================================
# X402 PROTOCOL (OPTIONAL)
# ============================================
FACILITATOR_URL=https://x402.org/facilitator
```

### Agent Configuration (`agents/.env`)

Create `agents/.env` in the agents directory:

```bash
# ============================================
# AGENT A CONFIGURATION
# ============================================
AGENT_A_PRIVATE_KEY=0x...          # Agent A's wallet private key
AGENT_A_NAME=IceCo                 # Display name for Agent A
AGENT_A_MAX_BID=10                 # Maximum bid in USDC

# ============================================
# AGENT B CONFIGURATION
# ============================================
AGENT_B_PRIVATE_KEY=0x...          # Agent B's wallet private key
AGENT_B_NAME=FizzUp                # Display name for Agent B
AGENT_B_MAX_BID=15                 # Maximum bid in USDC

# ============================================
# AI CONFIGURATION (REQUIRED for intelligent agents)
# ============================================
# Get from https://console.anthropic.com/
BID_ANTHROPIC_API_KEY=sk-ant-...

# ============================================
# SERVER CONNECTION
# ============================================
BID_SERVER_URL=http://localhost:3000
AD_SPOT_ID=demo-spot-1            # Which ad spot to bid on

# ============================================
# ANALYTICAL AGENTS (OPTIONAL)
# ============================================
# For agents that scrape and analyze websites
# TUNNEL_URL=https://your-tunnel.com  # Expose localhost for web scraping
```

### Getting API Keys and Wallets

1. **Server Wallet**:
   ```bash
   # Option 1: Generate a new wallet
   node -e "const {generatePrivateKey, privateKeyToAccount} = require('viem/accounts'); const pk = generatePrivateKey(); console.log('Private Key:', pk); console.log('Address:', privateKeyToAccount(pk).address);"

   # Option 2: Use Coinbase CDP to manage your wallet
   # Sign up at https://portal.cdp.coinbase.com/
   ```

2. **Fund Wallets with Test USDC**:
   ```bash
   # Use Coinbase faucet (requires CDP account)
   npm run fund:agents

   # Or manually via Base Sepolia faucet
   # https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   ```

3. **Anthropic API Key**:
   - Sign up at https://console.anthropic.com/
   - Create a new API key
   - Add to `agents/.env` as `BID_ANTHROPIC_API_KEY`

4. **MongoDB** (Optional):
   - Create free cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string and add to `.env.local`

## Running the Demo

### Start the Server

```bash
npm run dev
```

Expected output:
```
✓ Starting...
✓ Ready in 2.1s
- Local:   http://localhost:3000
- Network: http://192.168.1.x:3000

📦 Using in-memory storage (data will not persist)
```

### Start AI Agents

In separate terminals:

```bash
# Terminal 2: Start Agent A (IceCo - Premium Water Brand)
npm run agent:ai:a

# Terminal 3: Start Agent B (FizzUp - Sports Drink Brand)
npm run agent:ai:b
```

Expected output:
```
🤖 [IceCo] Starting intelligent bidding agent...
💰 [IceCo] USDC Balance: 10.00
🎯 [IceCo] Target ad spot: demo-spot-1
🧠 [IceCo] AI reasoning activated
👀 [IceCo] Monitoring auction...
```

### View the Auction

Open your browser to:
```
http://localhost:3000/auction/demo-spot-1
```

You'll see:
- Real-time auction timer
- Agent thinking processes
- Bid amounts and strategy
- Payment transactions on Base Sepolia
- Winner announcement when auction ends

### Utility Scripts

```bash
# Check server wallet balance
npm run check:server

# Fund agent wallets with test USDC
npm run fund:agents

# Validate environment setup
npm run check:env

# Get setup help
npm run setup:help
```

## How It Works

### 1. x402 Payment Flow

When an agent places a bid:

```typescript
// 1. Agent sends bid request WITHOUT payment
POST /api/bid/demo-spot-1
Headers: { "X-Agent-ID": "IceCo", "X-Proposed-Bid": "2.50" }

// 2. Server responds with 402 Payment Required + x402 requirements
402 Payment Required
Headers: {
  "X-PAYMENT-REQUIRED": "exact",
  "X-PAYMENT-REQUIRED-USDC": "2.50",
  "X-FACILITATOR-URL": "https://x402.org/facilitator"
}

// 3. Agent signs EIP-3009 authorization and retries
POST /api/bid/demo-spot-1
Headers: {
  "X-Agent-ID": "IceCo",
  "X-PAYMENT": "<signed-authorization>"
}

// 4. Server verifies, settles payment, refunds previous bidder
200 OK
{ "success": true, "currentBid": 2.50 }
```

See [`app/api/bid/[adSpotId]/route.ts`](app/api/bid/[adSpotId]/route.ts) for implementation.

### 2. Refund-as-Signal Pattern

The innovative part - refunds are economic signals:

```typescript
// When Agent B outbids Agent A:
// 1. Server sends Agent A's USDC back
await sendRefund(agentA.address, previousBid);

// 2. Agent A monitors their USDC balance every 2 seconds
const newBalance = await getUSDCBalance();
if (newBalance > lastBalance) {
  console.log('🔔 REFUND DETECTED - We were outbid!');
  // 3. Triggers immediate AI re-evaluation
  await agent.makeNewBiddingDecision();
}
```

No polling APIs - agents just watch their wallet balance. Elegant and efficient!

See [`agents/shared/intelligent-agent.ts`](agents/shared/intelligent-agent.ts) lines 250-280.

### 3. Agent Decision Making

Agents use Claude 3.5 Sonnet with LlamaIndex ReActAgent framework:

```typescript
// Agent has tools:
- get_my_balance()      // Check USDC balance
- get_auction_state()   // Current bid, time left, history
- place_bid(amount)     // Submit bid via x402
- withdraw()            // Exit auction early

// Claude decides autonomously:
"The current bid is $2.50 with 3 minutes remaining.
My brand (IceCo) values premium positioning.
I should bid $3.50 to maintain dominance.
This is within my $10 budget."

Action: place_bid(3.50)
```

## Project Structure

```
x402-ad-agent/
├── app/
│   ├── api/
│   │   ├── bid/[adSpotId]/route.ts       # Main bidding endpoint (x402)
│   │   ├── status/route.ts                # Auction state & timer
│   │   ├── events/[adSpotId]/route.ts     # Event polling for UI
│   │   ├── refund-request/[adSpotId]/     # Agent withdrawal system
│   │   └── skip-spot/[adSpotId]/          # Agent opt-out
│   ├── auction/[adSpotId]/page.tsx        # Real-time auction UI
│   ├── components/                        # React components
│   └── page.tsx                           # Home page
├── agents/
│   ├── intelligentAgentA.ts               # IceCo agent (premium water)
│   ├── intelligentAgentB.ts               # FizzUp agent (sports drink)
│   ├── coinbaseCDPAgent.ts                # Analytical agent example
│   ├── crossmintAgent.ts                  # Another analytical example
│   └── shared/
│       ├── intelligent-agent.ts           # Base intelligent bidding agent
│       └── analytical-agent.ts            # Site-scraping analytical agent
├── lib/
│   ├── db.ts                              # MongoDB/in-memory storage
│   ├── wallet.ts                          # Server wallet & refunds
│   ├── events.ts                          # Event broadcasting system
│   └── x402-config.ts                     # x402 & auction config
├── types/
│   └── index.ts                           # TypeScript interfaces
├── scripts/                               # Helper utilities
├── fund-agents.ts                         # Fund agent wallets via faucet
├── check-server-balance.ts                # Check server wallet balance
└── package.json
```

## Agent Types

### IntelligentBiddingAgent

**Best for:** Pre-defined ad campaigns where you know your brand and target

**Features:**
- Takes a `BrandIdentity` configuration (brand name, product, visual style, etc.)
- Makes strategic decisions based on current bid, time remaining, and budget
- Monitors for refunds and responds immediately
- Simple to configure - just define your brand once

**Example:**
```typescript
const agent = new IntelligentBiddingAgent({
  privateKey: '0x...',
  agentName: 'IceCo',
  maxBid: 10,
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: 'sk-ant-...',
  brandIdentity: {
    brandName: 'IceCo',
    productName: 'CrystalPure Premium Water',
    industry: 'Beverage',
    targetAudience: 'Health-conscious millennials',
    // ... more details
  }
});
```

### AnalyticalBiddingAgent

**Best for:** Dynamic campaigns where you want AI to analyze the ad placement

**Features:**
- Scrapes the target website before bidding
- Analyzes site content, audience, and ad placement value
- Calculates ROI-based bid amounts dynamically
- More autonomous but requires web scraping access

**Example:**
```typescript
const agent = new AnalyticalBiddingAgent({
  privateKey: '0x...',
  agentName: 'CoinbaseCDP',
  maxBid: null, // No limit - calculated from analysis
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: 'sk-ant-...',
  tunnelUrl: 'https://tunnel.com', // Optional
  brandIdentity: { /* same as above */ }
});

// Scrapes site, analyzes, then decides autonomously
agent.startAnalysis(['prime-banner', 'sidebar-secondary']);
```

See [`agents/README.md`](agents/README.md) for more details.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bid/[adSpotId]` | POST | Place bid with x402 payment |
| `/api/status` | GET | Get auction state (bid, timer, winner) |
| `/api/events/[adSpotId]` | GET | Poll for recent events |
| `/api/refund-request/[adSpotId]` | POST | Agent requests withdrawal |
| `/api/skip-spot/[adSpotId]` | POST | Agent opts out of bidding |
| `/api/bid/[adSpotId]/reflection` | POST | Submit post-bid analysis |
| `/auction/[adSpotId]` | GET | View auction UI |

## Customization

### Modify Auction Parameters

Edit `.env.local`:
```bash
AUCTION_DURATION_MINUTES=10      # Longer auctions
STARTING_BID_USDC=5              # Higher starting bid
BID_INCREMENT_USDC=2.50          # Bigger increments
```

### Create Custom Agent

See [`examples/custom-brand-agent.ts`](examples/custom-brand-agent.ts):

```typescript
import { IntelligentBiddingAgent } from './agents/shared/intelligent-agent';

const myAgent = new IntelligentBiddingAgent({
  privateKey: process.env.MY_AGENT_KEY,
  agentName: 'MyBrand',
  maxBid: 20,
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: process.env.ANTHROPIC_KEY,
  brandIdentity: {
    brandName: 'Your Brand',
    productName: 'Your Product',
    industry: 'Your Industry',
    targetAudience: 'Your Audience',
    // Customize all aspects
  }
});

myAgent.start('your-ad-spot-id');
```

### Run Multiple Ad Spots

Start different agents targeting different spots:
```bash
AD_SPOT_ID=homepage-banner npm run agent:ai:a
AD_SPOT_ID=sidebar-prime npm run agent:ai:b
```

## Troubleshooting

### "Insufficient USDC balance"

**Problem:** Agent wallet doesn't have enough USDC to bid

**Solution:**
```bash
# Fund agents with test USDC
npm run fund:agents

# Or check current balance
npm run check:server
```

### "MongoDB connection failed"

**Problem:** MongoDB URI invalid or network issue

**Solution:** Remove `MONGODB_URI` from `.env.local` to use in-memory storage:
```bash
# Comment out or remove:
# MONGODB_URI=mongodb+srv://...
```

### "402 Payment Required - verification failed"

**Problem:** x402 payment signature invalid

**Solution:**
- Ensure agent has sufficient USDC balance
- Check `SERVER_WALLET_PRIVATE_KEY` is correct
- Verify Base Sepolia RPC is accessible
- Try increasing gas price in wallet.ts

### "Agent not bidding"

**Problem:** Agent starts but doesn't place bids

**Solution:**
1. Check `BID_ANTHROPIC_API_KEY` is valid
2. Verify agent can reach `BID_SERVER_URL`
3. Look for errors in agent terminal output
4. Ensure `AGENT_X_MAX_BID` is high enough

### "Refund not received"

**Problem:** Agent was outbid but didn't get USDC back

**Solution:**
- Check server wallet has USDC: `npm run check:server`
- View transaction on BaseScan (check terminal for tx hash)
- Refunds usually arrive within 5-10 seconds

### Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev

# Update agents/.env
BID_SERVER_URL=http://localhost:3001
```

## Contributing

We welcome contributions! Here's how to extend the project:

### Adding a New Agent Type

1. Create new file in `agents/` directory
2. Extend `IntelligentBiddingAgent` or `AnalyticalBiddingAgent`
3. Customize brand identity and strategy
4. Add npm script to `package.json`

### Adding New API Endpoints

1. Create route in `app/api/[your-endpoint]/route.ts`
2. Import and use `broadcastEvent()` for UI updates
3. Use `getAdSpotRecord()` / `updateAdSpotRecord()` for state
4. Document in README API Endpoints section

### Code Style

- Use TypeScript for type safety
- Add JSDoc comments to exported functions
- Follow existing naming conventions (`adSpotId`, not `basename`)
- Use structured logging with emojis for readability
- Extract constants to `lib/x402-config.ts` or `config/constants.ts`

## Resources

- **x402 Protocol**: https://x402.org
- **x402 Documentation**: https://docs.x402.org
- **Coinbase CDP**: https://portal.cdp.coinbase.com/
- **Anthropic Claude**: https://console.anthropic.com/
- **LlamaIndex**: https://www.llamaindex.ai/
- **Base Sepolia**: https://sepolia.basescan.org/
- **Viem Documentation**: https://viem.sh/

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ to demonstrate x402 protocol integration**

Questions? Open an issue or reach out to the team!
