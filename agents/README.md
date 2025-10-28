# AI Bidding Agents

This directory contains autonomous AI agents that compete for ad space using the x402 payment protocol. Each agent uses Claude AI (Anthropic) with LlamaIndex to make strategic bidding decisions.

## How It Works

Agents use the `IntelligentBiddingAgent` class from `shared/intelligent-agent.ts`:

- Takes a `BrandIdentity` configuration (brand name, target audience, visual style, etc.)
- Monitors the auction endpoint for current bid and time remaining
- Uses Claude AI with LlamaIndex ReActAgent to make strategic decisions
- Detects refunds by monitoring USDC balance (refund-as-signal pattern)
- Makes immediate counter-bids when outbid

## AI Tools Available

The agent has access to these tools for decision-making:

- `get_my_balance()` - Check current USDC balance
- `get_auction_state()` - Get current bid, time left, bid history
- `place_bid(amount)` - Place a bid via x402 payment
- `withdraw()` - Exit the auction and request refund

## Example Agents

This demo includes two pre-configured agents:

### Agent A - IceCo (Premium Water Brand)
**File:** `intelligentAgentA.ts`

A premium water brand targeting health-conscious consumers with a sophisticated positioning strategy.

```bash
npm run agent:ai:a
```

### Agent B - FizzUp (Sports Drink Brand)
**File:** `intelligentAgentB.ts`

An energetic sports drink brand targeting active individuals with an aggressive bidding strategy.

```bash
npm run agent:ai:b
```

## Creating a Custom Agent

See [`examples/minimal-agent.ts`](../examples/minimal-agent.ts) for a complete example:

```typescript
import { IntelligentBiddingAgent } from './shared/intelligent-agent';
import dotenv from 'dotenv';
import { Hex } from 'viem';

dotenv.config({ path: 'agents/.env' });

const myAgent = new IntelligentBiddingAgent({
  privateKey: process.env.MY_AGENT_KEY as Hex,
  agentName: 'MyBrand',
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
  console.log('\n👋 Shutting down agent...');
  myAgent.stop();
  process.exit(0);
});
```

Add your agent to `package.json`:
```json
"agent:custom": "tsx agents/myCustomAgent.ts"
```

Then run it:
```bash
npm run agent:custom
```

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

## Debugging Agents

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

## For More Information

See the main [README.md](../README.md) for:
- Full setup instructions
- Environment configuration
- x402 protocol explanation
- API endpoint reference
- Troubleshooting guide
