# AI Bidding Agents

This directory contains autonomous AI agents that compete for ad space using the x402 payment protocol. Each agent uses Claude AI (Anthropic) to make strategic bidding decisions.

## Agent Types

### 1. IntelligentBiddingAgent

**File:** `shared/intelligent-agent.ts`

**Best for:** Simple, direct bidding on pre-defined ad spots

**How it works:**
- Takes a `BrandIdentity` configuration (brand name, target audience, visual style, etc.)
- Monitors the auction endpoint for current bid and time remaining
- Uses Claude AI with LlamaIndex ReActAgent to make strategic decisions
- Detects refunds by monitoring USDC balance (refund-as-signal pattern)
- Makes immediate counter-bids when outbid

**AI Tools Available:**
- `get_my_balance()` - Check current USDC balance
- `get_auction_state()` - Get current bid, time left, bid history
- `place_bid(amount)` - Place a bid via x402 payment
- `withdraw()` - Exit the auction and request refund

**Example Usage:**
```typescript
import { IntelligentBiddingAgent } from './shared/intelligent-agent';

const agent = new IntelligentBiddingAgent({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  agentName: 'MyBrand',
  maxBid: 10, // Maximum $10 USDC
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  brandIdentity: {
    brandName: 'MyBrand',
    productName: 'Amazing Product',
    industry: 'Technology',
    productDescription: 'Revolutionary new product...',
    targetAudience: 'Tech-savvy millennials',
    brandPersonality: 'Innovative, friendly, trustworthy',
    marketingAngle: 'Make your life easier',
    visualStyle: 'Modern, clean, colorful',
    keyMessages: [
      'Fast and reliable',
      'Used by thousands',
      'Try it free today'
    ]
  }
});

// Start bidding on a specific ad spot
agent.start('homepage-banner-1');
```

**Provided Examples:**
- `intelligentAgentA.ts` - IceCo (premium water brand)
- `intelligentAgentB.ts` - FizzUp (sports drink brand)

---

### 2. AnalyticalBiddingAgent

**File:** `shared/analytical-agent.ts`

**Best for:** Data-driven bidding where agent analyzes the target website before bidding

**How it works:**
- Scrapes the target website to analyze content, audience, and traffic
- Uses AI to determine the strategic value of the ad placement
- Calculates ROI-based bid amounts dynamically
- Can handle multiple ad spots simultaneously
- More autonomous - makes its own decisions about which spots to bid on

**Additional AI Tools:**
- `scrape_website()` - Scrape target site for analysis
- `analyze_site_for_advertising()` - AI analyzes site metrics
- `calculate_max_bid()` - ROI-based bid calculation

**Example Usage:**
```typescript
import { AnalyticalBiddingAgent } from './shared/analytical-agent';

const agent = new AnalyticalBiddingAgent({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  agentName: 'DataDrivenBrand',
  maxBid: null, // No limit - calculated from analysis
  serverUrl: 'http://localhost:3000',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  tunnelUrl: 'https://your-tunnel.com', // Optional
  brandIdentity: {
    // Same as IntelligentBiddingAgent
  }
});

// Analyze and bid on multiple spots
const availableSpots = ['prime-banner', 'sidebar-top', 'footer-wide'];
agent.startAnalysis(availableSpots);
```

**Provided Examples:**
- `coinbaseCDPAgent.ts` - Coinbase Developer Platform
- `crossmintAgent.ts` - Crossmint wallet infrastructure

**Note:** Analytical agents may require a tunnel URL (Cloudflare Tunnel, ngrok) to allow external scraping services to access your localhost server.

---

## Choosing the Right Agent Type

| Feature | IntelligentBiddingAgent | AnalyticalBiddingAgent |
|---------|------------------------|------------------------|
| **Setup Complexity** | Simple | Moderate |
| **Configuration** | Brand identity only | Brand + tunnel (optional) |
| **Bid Strategy** | Fixed max bid | Dynamic ROI-based |
| **Site Analysis** | ❌ No | ✅ Yes |
| **Multi-spot Support** | One at a time | Multiple simultaneously |
| **Best For** | Known ad campaigns | Exploratory campaigns |

**Use IntelligentBiddingAgent when:**
- You know exactly which ad spot you want
- You have a fixed budget
- You want simple, predictable behavior
- You're testing or demoing the system

**Use AnalyticalBiddingAgent when:**
- You want AI to analyze placement value
- Budget should be based on potential ROI
- You're bidding across multiple spots
- You want the agent to be more autonomous

---

## Creating a Custom Agent

### Basic Custom Agent

Create a new file like `agents/myCustomAgent.ts`:

```typescript
import { IntelligentBiddingAgent } from './shared/intelligent-agent';
import dotenv from 'dotenv';
import { Hex } from 'viem';

dotenv.config({ path: 'agents/.env' });

const myAgent = new IntelligentBiddingAgent({
  privateKey: process.env.MY_AGENT_KEY as Hex,
  agentName: 'MyAgent',
  maxBid: 20,
  serverUrl: process.env.BID_SERVER_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.BID_ANTHROPIC_API_KEY || '',
  brandIdentity: {
    brandName: 'Your Brand Name',
    productName: 'Your Product',
    industry: 'Your Industry',
    productDescription: 'Detailed product description...',
    targetAudience: 'Who you want to reach...',
    brandPersonality: 'How your brand feels...',
    marketingAngle: 'Your unique selling point...',
    visualStyle: 'Describe your visual aesthetic...',
    keyMessages: [
      'First key message',
      'Second key message',
      'Third key message'
    ]
  }
});

const adSpotId = process.env.AD_SPOT_ID || 'demo-spot-1';
myAgent.start(adSpotId);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down agent...');
  myAgent.stop();
  process.exit(0);
});
```

Add to `package.json`:
```json
"agent:custom": "tsx agents/myCustomAgent.ts"
```

Add to `agents/.env`:
```bash
MY_AGENT_KEY=0x...
```

Run with:
```bash
npm run agent:custom
```

---

## Agent Behavior

### Lifecycle

1. **Initialization** - Load config, connect to wallet, initialize AI
2. **Monitoring** - Check auction state every 3 seconds
3. **Decision Making** - AI analyzes context and decides to bid/withdraw
4. **Bidding** - Place bid via x402 protocol (if decided to bid)
5. **Refund Detection** - Monitor USDC balance for refunds (outbid signal)
6. **Re-evaluation** - When refunded, immediately re-assess and counter-bid
7. **Auction End** - Stop monitoring when auction finishes

### Strategic Decision Making

The AI considers:
- Current bid amount vs. your max bid
- Time remaining in auction
- Bid history (who's bidding, how aggressively)
- Your brand's positioning (premium vs. value)
- Competition intensity
- Cost-benefit analysis

Example AI reasoning:
```
"Current bid is $3.50 with 2 minutes remaining.
My brand (IceCo) targets premium positioning.
The bid history shows aggressive competition.
I should bid $4.50 to maintain dominance.
This is within my $10 budget and worth it for
this high-value ad placement."

Action: place_bid(4.50)
```

---

## Refund-as-Signal Pattern

When an agent is outbid, they receive their USDC back. Instead of polling the API constantly, agents simply monitor their wallet balance:

```typescript
// Every 2 seconds
const newBalance = await getUSDCBalance();

if (newBalance > lastBalance) {
  console.log('🔔 REFUND DETECTED - We were outbid!');
  // Trigger immediate AI re-evaluation
  await makeNewBiddingDecision();
}

lastBalance = newBalance;
```

This is elegant because:
- ✅ No API polling needed
- ✅ Instant signal when outbid
- ✅ Works entirely on-chain
- ✅ Economically incentivized (get your money back)

---

## Debugging Agents

### Enable Verbose Logging

Edit the agent file and agents log more details by default, but you can customize logging in the agent class.

### Check Agent Balance

```bash
npm run check:server
```

Or check on BaseScan:
```
https://sepolia.basescan.org/address/[YOUR_AGENT_ADDRESS]
```

### Common Issues

**Agent not starting:**
- Check `BID_ANTHROPIC_API_KEY` is set
- Verify wallet has USDC balance
- Ensure server is running

**Agent not bidding:**
- Check `maxBid` is high enough
- Verify AI reasoning in terminal output
- Check auction hasn't ended
- Ensure current bid < max bid

**Refund not detected:**
- Check refund transaction on BaseScan
- Verify USDC balance monitoring is active
- Look for "🔔 REFUND DETECTED" in logs

---

## For More Information

See the main [README.md](../README.md) for:
- Full setup instructions
- Environment configuration
- x402 protocol explanation
- API endpoint reference
- Troubleshooting guide

---

**Questions?** Open an issue or check the troubleshooting section in the main README.

