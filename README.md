# Autonomous AI Advertising Agents with x402

> **Outdated, not maintained.** This is an x402 v1 example. x402 v2 has since been released; we recommend updating to v2 ([migration guide](https://docs.x402.org/guides/migration-v1-to-v2)).

> **Demonstrating autonomous agent-to-agent commerce through x402 micropayments on Base**

Intelligent AI agents that autonomously research websites, analyze traffic data, compete for advertising space, and generate creative content - all coordinated through economic signals powered by x402 micropayments.

---

## What This Is

This project demonstrates **autonomous AI advertising agents** that use **x402 micropayments** to discover opportunities, make data-driven decisions, compete economically, and deliver tangible outcomes - all without human intervention.

### The Demo

**Analytical Ad Agents** - Two competing AI agents (Crossmint and Coinbase CDP) autonomously:
1. **Research** websites by scraping content via Firecrawl (x402, ~$0.01)
2. **Purchase** traffic analytics data from publishers (x402, $0.01)
3. **Analyze** site relevance and ROI with Claude AI
4. **Compete** for advertising space through bidding (x402, $1-100)
5. **Generate** creative ad images via Freepik (x402, ~$0.10)
6. **Display** winning ads on the publisher's website

**Core Innovation**: Economic signals as coordination mechanism. When an agent gets refunded after being outbid, they detect the state change through their balance and automatically re-evaluate their strategy. No polling, no webhooks - just HTTP + x402.

---

## Quick Start

### Prerequisites

- Node.js 18+
- [Coinbase CDP Account](https://portal.cdp.coinbase.com/) (for server wallet)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier works)
- [Anthropic API Key](https://console.anthropic.com/) (for AI agents)
- [Firecrawl API Key](https://firecrawl.dev/) (for web scraping)
- [Freepik API Key](https://www.freepik.com/api) (for image generation)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/x402-ad-bid.git
cd x402-ad-bid
npm install
```

### 2. Configure Server Environment

Create `.env.local`:

```bash
# CDP Server Wallet (get from https://portal.cdp.coinbase.com/)
CDP_API_KEY_ID=your-cdp-key-id
CDP_API_KEY_SECRET=your-cdp-secret
CDP_WALLET_SECRET=your-wallet-secret

# MongoDB (get from https://www.mongodb.com/cloud/atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=ad-bid

# x402
FACILITATOR_URL=https://x402.org/facilitator

# External Services
FIRECRAWL_API_KEY=your-firecrawl-key  # Get from https://firecrawl.dev/
FREEPIK_API_KEY=your-freepik-key      # Get from https://www.freepik.com/api
```

### 3. Configure Agent Environment

Create `agents/.env`:

```bash
# Crossmint Agent
CROSSMINT_PRIVATE_KEY=0x...  # Generate with: openssl rand -hex 32
CROSSMINT_AGENT_NAME=CrossmintAgent
CROSSMINT_MAX_BID=50

# Coinbase CDP Agent
CDP_AGENT_PRIVATE_KEY=0x...  # Generate with: openssl rand -hex 32
CDP_AGENT_NAME=CoinbaseCDPAgent
CDP_MAX_BID=75

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Server
SERVER_URL=http://localhost:3000

# Ad Spots (comma-separated list)
AD_SPOTS=devnews-banner,devnews-sidebar
```

### 4. Fund Wallets

```bash
# Fund server wallet with ETH and USDC (Base Sepolia for testing, Base Mainnet for production)
npm run fund

# Fund agent wallets with USDC
npm run fund:agents
```

### 5. Run the System

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start Crossmint agent
npm run agent:crossmint

# Terminal 3: Start Coinbase CDP agent
npm run agent:cdp

# Browser: Watch the competition
open http://localhost:3000/analytical-agents

# Browser: View the publisher site with winning ads
open http://localhost:3000/devnews
```

You can also view detailed auction activity for specific ad spots at:
```
http://localhost:3000/auction/devnews-banner
http://localhost:3000/auction/devnews-sidebar
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│  AI Agents       ├─ Claude 3.5 Sonnet (LlamaIndex)         │
│  - Crossmint     ├─ x402-axios (auto payment handling)      │
│  - CoinbaseCDP   ├─ Viem wallet (Base Sepolia + Mainnet)   │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTP + x402
                           │
┌─────────────────────────────────────────────────────────────┐
│  Next.js Server  ├─ Handles 402 responses                   │
│  /api/bid        ├─ Verifies & settles payments             │
│  /api/analytics  ├─ x402-hono middleware                    │
│  /api/generate   ├─ CDP Server Wallet                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MongoDB Atlas   ├─ Stores ad spot records                  │
│  - adSpotRecords ├─ Stores events for polling               │
│  - events        │                                           │
└─────────────────────────────────────────────────────────────┘
```

### Payment Flow Architecture

**Core Innovation**: x402 enables agents to use HTTP status code `402 Payment Required` for seamless micropayments.

```
1. Agent makes request → Server
2. Server responds 402 with payment requirements
3. x402-axios intercepts → Signs EIP-3009 authorization → Auto-retries
4. Server verifies → Settles via facilitator → Updates state
5. If someone was winning → Server refunds them (economic signal!)
```

### Autonomous Advertising Pipeline

```
┌──────────┐   $0.01   ┌──────────┐   $0.01   ┌───────────┐
│ Scrape   │─────x402──│ Fetch    │─────x402──│ AI        │
│ Website  │ Firecrawl │ Analytics│  Server   │ Analysis  │
└──────────┘           └──────────┘           └───────────┘
                                                     │
                                                     ▼
┌──────────┐   $0.10   ┌──────────┐  $1-100   ┌───────────┐
│ Display  │◄────x402──│ Generate │◄────x402──│ Compete   │
│ Ad       │ Freepik   │ Creative │  Server   │ & Bid     │
└──────────┘           └──────────┘           └───────────┘
```

### Two Network Architecture

| Network        | Purpose                          | Payments                     |
|----------------|----------------------------------|------------------------------|
| Base Sepolia   | Ad bidding & analytics (testnet) | $0.01-100 USDC (test tokens) |
| Base Mainnet   | External services (production)   | $0.01-0.50 USDC (real)       |

**Why?** Test bidding with free tokens, but pay real services (Firecrawl, Freepik) with real USDC.

---

## How It Works

### Phase 1: Website Research ($0.01)

Agents discover advertising opportunities by scraping publisher websites:
- Pay Firecrawl via x402 to extract content
- Analyze site topic, industry, and audience
- Identify available ad spots

### Phase 2: Analytics Purchase ($0.01)

Agents pay the publisher for traffic data:
- Request analytics via x402 payment to server
- Receive visitor counts, demographics, engagement metrics
- Store data for AI analysis

### Phase 3: AI Decision Making

Claude AI analyzes the opportunity:
- Evaluate site relevance to agent's brand
- Calculate expected ROI based on traffic
- Determine strategic bid amount (not hardcoded!)
- Decide whether to compete

### Phase 4: Economic Competition ($1-100)

Agents bid on ad spots using x402:
- Propose bid amount to server
- Server responds 402 with exact price requirement
- Agent pays via EIP-3009 authorization
- Server refunds previous highest bidder (economic signal!)
- Outbid agents detect refund and re-evaluate

### Phase 5: Creative Generation ($0.10)

Winning agent generates ad creative:
- Pay Freepik via x402 for AI image generation
- Provide brand-specific prompt
- Receive production-ready ad image

### Phase 6: Ad Display

Publisher automatically displays winning ad:
- Frontend polls for `ad_image_ready` events
- Renders winning agent's creative
- Shows brand, image, and ad spot metadata

---

## Key Innovations

### 1. Economic Signals as Coordination

Traditional: Webhooks, polling, external event systems
**x402 Way**: Refunds are signals

```typescript
// Agent detects refund automatically
const newBalance = await getUSDCBalance();
if (newBalance > lastBalance) {
  console.log('🔔 REFUND DETECTED - I was outbid!');
  // Re-evaluate strategy and potentially re-bid
}
```

### 2. Multi-Service Composition

Same agent, same wallet, multiple x402 services:
- Firecrawl (scraping)
- Publisher (analytics + bidding)
- Freepik (image generation)

No integration complexity - x402 handles all payment flows uniformly.

### 3. Research-Driven Budgeting

Not hardcoded:
```
Agent spends $0.02 on research →
Analyzes data with AI →
Decides budget dynamically →
Competes strategically
```

Real cost-benefit analysis in every decision.

### 4. Autonomous End-to-End

From research to creative generation, agents:
- ✓ Pay for their own data
- ✓ Make strategic decisions
- ✓ Compete economically
- ✓ Deliver tangible outcomes
- ✓ Zero human intervention

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **AI**: LlamaIndex (ReActAgent), Anthropic Claude 3.5 Sonnet
- **Blockchain**: Coinbase CDP SDK, Viem, Wagmi
- **Payments**: x402 protocol (x402-axios, x402-hono)
- **Database**: MongoDB Atlas
- **Real-time**: MongoDB Polling (2-second intervals)
- **Styling**: Tailwind CSS 4
- **External Services**: Firecrawl (scraping), Freepik (image generation)

---

## Architecture Deep Dive

### Agent Layer (Intelligent Decision-Making)

**Built with**:
- **LlamaIndex ReActAgent**: Tool orchestration framework
- **Claude 3.5 Sonnet**: Strategic reasoning and decision-making
- **x402-axios**: Automatic 402 interception and payment handling
- **Viem**: Wallet management (private keys → EIP-3009 signatures)

**Agent Lifecycle**:
```typescript
1. Initialize → Load brand identity, wallet, budget constraints
2. Discover → Scrape websites to find ad opportunities
3. Research → Purchase analytics data from publishers
4. Analyze → Use Claude AI to evaluate ROI
5. Compete → Bid on promising ad spots
6. Monitor → Detect refunds (economic signals)
7. Generate → Create ad creative if won
8. Repeat → Until budget exhausted
```

**Tools Available**:
- `scrapeWebsite()` - Firecrawl integration (x402)
- `fetchAnalytics()` - Publisher data (x402)
- `analyzeAndDecide()` - Claude AI analysis
- `placeBid()` - Bid on ad spot (x402)
- `checkBalance()` - Monitor for refunds
- `generateAdImage()` - Freepik integration (x402)

### Server Layer (Payment & State Management)

**Built with**:
- **Next.js 15**: App Router, API routes
- **x402-hono**: 402 response middleware
- **CDP Server Wallet v2**: Receives payments, sends refunds
- **MongoDB Atlas**: Persistent ad spot state

**Core Endpoints**:

| Endpoint | Method | x402? | Purpose |
|----------|--------|-------|---------|
| `/api/bid/[adSpotId]` | POST | ✓ | Accept bids with payment |
| `/api/site-analytics` | GET | ✓ | Sell analytics data to agents |
| `/api/generate-ad-image` | POST | ✓ | Proxy to Freepik with agent payment |
| `/api/events/[adSpotId]` | GET | ✗ | Polling endpoint for frontend |

**Settlement Lock Pattern**:
```typescript
// Prevent "replacement transaction underpriced" errors
const settlementLocks = new Map<string, Promise<any>>();

// Queue concurrent bids
if (settlementLocks.has(adSpotId)) {
  await settlementLocks.get(adSpotId);
}
settlementLocks.set(adSpotId, settlementPromise);
```

### Database Layer (Event Sourcing + State)

**Collections**:

**`adSpotRecords`**:
```typescript
{
  adSpotId: "devnews-banner",
  currentBid: 45.00,
  currentWinner: { agentId, walletAddress, timestamp },
  bidHistory: [{ agentId, amount, txHash }],
  adImage: { url, prompt, generatedAt }
}
```

**`analyticalEvents`** (for polling):
```typescript
{
  adSpotId: "devnews-banner",
  event: {
    type: "bid_placed" | "thinking" | "refund" | "ad_image_ready",
    agentId: "CrossmintAgent",
    // ... event-specific data
  },
  timestamp: ISODate
}
```

### Frontend Layer (Real-Time Observability)

**Built with**:
- **React 19**: Server Components + Client Components
- **Polling**: Fetch `/api/events/[adSpotId]` every 2 seconds
- **Tailwind CSS 4**: Grayscale, terminal-style UI

**Pages**:
- `/analytical-agents` - Terminal panels showing both agents' activity
- `/devnews` - Mock publisher site displaying winning ads
- `/auction/[adSpotId]` - Detailed auction feed for specific ad spots

**Event Flow**:
```
Server broadcasts event → MongoDB →
Frontend polls (2s) → React state update → UI renders
```

---

## Documentation

- **[analytical-agents-flow.md](./analytical-agents-flow.md)** - Detailed step-by-step flow
- **[analytical-agents-idea.md](./analytical-agents-idea.md)** - High-level concept
- **[analytical-agents-case-study.md](./analytical-agents-case-study.md)** - Complete technical spec
- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide

---

## Testing & Development

### Testing Workflow

```bash
# Check agent USDC balances
open https://sepolia.basescan.org/address/[AGENT_ADDRESS]

# View transaction details
open https://sepolia.basescan.org/tx/[TX_HASH]

# Check MongoDB state
# Use MongoDB Compass or Atlas UI to query adSpotRecords collection

# View live agent activity
# Terminal logs show detailed reasoning and decision-making
```

### Common Issues

**"Replacement transaction underpriced"**
→ Settlement lock prevents this. If it occurs, agents bid too fast (lock queues them).

**"Payment verification failed"**
→ Check agent USDC balance and ensure funded on Base Sepolia.

**Events not updating in UI**
→ Check DevTools Network tab for `/api/events/[adSpotId]` polling every 2s.

**Agent not re-bidding after refund**
→ Check balance monitoring loop (2s interval). Verify agent hasn't hit max budget.

---

## What This Demonstrates

### For x402:
- **Versatility**: Handles $0.01 micropayments to $100 bids
- **Composability**: Agents combine multiple x402 services seamlessly
- **Coordination**: Economic signals (refunds) enable agent-to-agent interaction
- **Production Ready**: Real payments on real services with real outcomes

### For AI Agents:
- **Economic Actors**: Agents invest in information, analyze ROI, compete strategically
- **Practical Utility**: Not a toy - real websites, real analytics, real advertising
- **Observable Intelligence**: Humans watch agents think and make decisions
- **Autonomous Commerce**: End-to-end workflows without human intervention

### For the Future:
- **Agent-to-Agent Markets**: Brands hire AI agents who discover opportunities and compete
- **Dynamic Pricing**: Publishers sell data/services via x402 (no pre-negotiation needed)
- **Economic Coordination**: Payments as signals eliminate polling/webhooks/contracts

---

## License

MIT

---

## Contributing

Contributions welcome! This is a demonstration project showcasing x402 capabilities.

**Areas for Contribution**:
- Additional agent strategies (aggressive, conservative, adaptive)
- More x402 service integrations (research, analytics, creative)
- Enhanced UI/visualization (graphs, charts, history)
- Multi-agent coordination patterns
- Performance optimizations

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

---

## Acknowledgments

Built with:
- [x402 Protocol](https://x402.org/) - HTTP payments
- [Coinbase CDP](https://www.coinbase.com/cloud/products/developer-platform) - Server wallets
- [Anthropic Claude](https://www.anthropic.com/claude) - AI reasoning
- [LlamaIndex](https://www.llamaindex.ai/) - Agent framework
- [Firecrawl](https://firecrawl.dev/) - Web scraping
- [Freepik](https://www.freepik.com/) - AI image generation

---

**Questions?** See [CLAUDE.md](./CLAUDE.md) for detailed documentation or open an issue.

**Ready to see it in action?** Follow the [Quick Start](#quick-start) above!
