# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an **autonomous AI bidding system** where intelligent agents compete for Basenames using the x402 payment protocol. Agents make strategic bidding decisions powered by Claude (Anthropic) and LlamaIndex, with blockchain payments via x402 on Base Sepolia.

**Core Innovation**: Refunds act as economic signals - when an agent is outbid, they receive a USDC refund which triggers automatic re-evaluation and counter-bidding.

## Architecture

### Three Main Components

1. **Next.js Server** (`app/api/`)
   - Accepts bids via x402 payment protocol
   - Verifies and settles payments on-chain
   - Issues refunds to outbid agents
   - Broadcasts real-time events via SSE
   - Manages auction state in-memory

2. **Intelligent Agents** (`agents/`)
   - Autonomous bidding agents powered by Claude AI
   - Use LlamaIndex ReActAgent framework with custom tools
   - Monitor blockchain for refunds (economic signals)
   - Make strategic decisions based on auction context

3. **Frontend Dashboard** (`app/auction/[basename]/`)
   - Real-time SSE stream of auction events
   - Shows agent thinking, bids, and reflections
   - iMessage-style chat interface

### Payment Flow (x402 Protocol)

```
Agent → No payment header → Server responds 402 + requirements
Agent → Signs EIP-3009 authorization → Retries with X-PAYMENT header
Server → Verifies payment → Settles on-chain → Refunds previous bidder
Previous bidder → Detects refund (balance increase) → Triggers re-bid
```

**Critical**: Always use Context7 MCP to study x402 docs when dealing with payment-related errors.

## Development Commands

### Server
```bash
npm run dev              # Start Next.js server (localhost:3000)
npm run build            # Production build with Turbopack
npm run lint             # ESLint
```

### Agents
```bash
npm run agent:ai:a       # Start intelligent Agent A (IceCo)
npm run agent:ai:b       # Start intelligent Agent B (FizzUp)
```

### Wallet Management
```bash
npm run fund:agents      # Fund agent wallets with USDC
npm run check:server     # Check server wallet balance
```

### Testing Workflow
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run agent:ai:a

# Terminal 3
npm run agent:ai:b

# Browser
open http://localhost:3000/auction/x402agent.base.eth
```

## Environment Setup

### Server (`.env.local`)
```bash
# Server Wallet
SERVER_WALLET_PRIVATE_KEY=0x...
SERVER_WALLET_ADDRESS=0x...

# Auction Config
AUCTION_DURATION_MINUTES=5
STARTING_BID_USDC=1
BID_INCREMENT_USDC=1

# x402
FACILITATOR_URL=https://x402.org/facilitator
```

### Agents (`.env`)
```bash
# Agent A - CDP Wallet Configuration
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret
AGENT_A_CDP_WALLET_ID=agent-1234567890  # Optional - creates new if not provided
AGENT_A_NAME=IceCo
AGENT_A_MAX_BID=10

# Agent B - Crossmint Wallet Configuration
AGENT_B_CROSSMINT_API_KEY=sk_staging_...
AGENT_B_CROSSMINT_WALLET_LOCATOR=email:user@example.com:evm:smart
AGENT_B_NAME=FizzUp
AGENT_B_MAX_BID=15

# Anthropic (note the BID_ prefix to avoid conflicts)
BID_ANTHROPIC_API_KEY=sk-ant-...

# Server
BID_SERVER_URL=http://localhost:3000
AD_SPOT_ID=demo-spot-1
```

## Key Files & Architecture

### Payment & Auction Logic

- **`app/api/bid/[basename]/route.ts`**: Main bidding endpoint
  - Handles x402 payment verification & settlement
  - Implements proposal negotiation (X-Proposed-Bid header)
  - Manages refunds to outbid agents
  - Uses settlement lock to prevent nonce conflicts
  - Broadcasts SSE events for UI updates

- **`lib/x402-config.ts`**: x402 configuration
  - Facilitator URL
  - Bid price calculation logic
  - Base Sepolia USDC address

- **`lib/wallet.ts`**: Server Wallet management
  - Manages server wallet for settlements and refunds
  - Sends USDC refunds via ERC-20 transfers
  - Settlement lock management

### Real-Time Events

- **`lib/events.ts`**: SSE event broadcaster
  - Central EventEmitter for all auction events
  - Manages connections per basename
  - Event types: `thinking`, `bid_placed`, `reflection`, `refund`, `withdrawal`, `auction_ended`

- **`app/api/stream/[basename]/route.ts`**: SSE endpoint
  - Persistent connection for real-time updates
  - Auto-reconnection via EventSource API

### Database

- **`lib/db.ts`**: In-memory storage operations
  - `getAdSpotRecord()`, `updateAdSpotRecord()`, `addBidToHistory()`
  - Stores bid history, agent state, auction status in-memory
  - Simple Map-based storage for demo purposes

- **`types/index.ts`**: TypeScript interfaces
  - `BidRecord`: Complete auction state
  - Includes: `thinking`, `strategy`, `reasoning`, `reflection` fields per bid
  - Tracks: `withdrawnAgents`, `auctionEnded`, `auctionEndReason`

### Intelligent Agents

- **`agents/shared/intelligent-agent.ts`**: AI agent implementation
  - LlamaIndex ReActAgent with Claude 3.5 Sonnet
  - Custom tools: `get-my-balance`, `get-auction-state`, `place-bid`, `withdraw`
  - Monitors USDC balance for refunds (economic signal detection)
  - Withdrawal detection via keyword analysis

- **`agents/intelligentAgentA.ts` / `intelligentAgentB.ts`**: Agent runners
  - Load config from environment
  - Instantiate and start intelligent agents

### Frontend

- **`app/auction/[basename]/page.tsx`**: Real-time auction UI
  - iMessage-style chat interface (grayscale)
  - Displays thinking bubbles, bid cards, reflections, refunds
  - SSE integration for live updates
  - Links to Basescan for transaction verification

### Additional Features

- **`app/api/refund-request/[basename]/route.ts`**: Withdrawal system
  - Allows agents to withdraw and request refunds
  - Validates only non-winning agents can withdraw
  - Ends auction when only 1 active bidder remains

- **`app/api/bid/[basename]/reflection/route.ts`**: Post-bid analysis
  - Agents send reflection after bidding
  - Stored in-memory and broadcast via SSE

## Important Patterns

### Settlement Lock
The server uses a settlement lock to prevent "replacement transaction underpriced" errors when multiple agents bid simultaneously:
```typescript
const settlementLocks = new Map<string, Promise<any>>();
// Agents wait for previous settlement before proceeding
```

### Economic Signaling
Refunds trigger agent re-evaluation without polling:
```typescript
// Agent monitors USDC balance every 2s
const newBalance = await getUSDCBalance();
if (newBalance > lastBalance) {
  console.log('🔔 REFUND DETECTED');
  // Re-evaluate and potentially re-bid
}
```

### Proposal Negotiation
Agents propose bid amounts before payment:
```typescript
// Agent sends X-Proposed-Bid header
// Server evaluates and returns 402 with negotiation context
// Agent decides whether to proceed with payment
```

### SSE Event Flow
```
Agent thinks → broadcast 'thinking' → UI shows bubble
Agent pays → broadcast 'bid_placed' → UI shows bid card (loading)
Agent reflects → broadcast 'reflection' → UI updates bid card
Server refunds → broadcast 'refund' → UI shows notification
```

## Blockchain Details

- **Network**: Base Sepolia (testnet for payments), Base Mainnet (for Basename transfers)
- **Token**: USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e` on Base Sepolia)
- **Payment Scheme**: x402 "exact" scheme using EIP-3009 (Transfer with Authorization)
- **Gas**: CDP wallets use Coinbase paymaster for gasless operations

## x402 Integration

**IMPORTANT**: When experiencing errors with x402 requests, use Context7 MCP:
1. `resolve-library-id` for x402
2. `get-library-docs` with the library ID
3. Study current protocol specs for proper request formatting

### x402 Headers

**Request Headers**:
- `X-PAYMENT`: EIP-3009 payment authorization (created by x402-axios)
- `X-Agent-ID`: Agent identifier for tracking
- `X-Proposed-Bid`: Proposed bid amount (for negotiation)
- `X-Strategy-Reasoning`: Agent's reasoning for proposal

**Response Headers**:
- `X-PAYMENT-RESPONSE`: Settlement response from facilitator

## Testing & Debugging

### Check Agent USDC Balance
```bash
# View on Base Sepolia explorer
open https://sepolia.basescan.org/address/[AGENT_WALLET_ADDRESS]
```

### Check Transaction
```bash
# View settlement/refund transactions
open https://sepolia.basescan.org/tx/[TX_HASH]
```

### Common Issues

1. **"Replacement transaction underpriced"**: Settlement lock prevents this, but if it happens, agents are bidding too fast. The lock will queue them.

2. **"Payment verification failed"**: Check agent USDC balance and allowance. Use Context7 MCP to verify x402 protocol compliance.

3. **Refunds not working**: Ensure server wallet has USDC for refunds. Check transaction logs.

4. **Agent not re-bidding after refund**: Check balance monitoring loop (2s interval). Verify agent hasn't hit max bid limit.

5. **SSE not streaming**: Check browser DevTools Network tab for persistent `text/event-stream` connection to `/api/stream/[basename]`.

## Withdrawal System

Agents can dynamically withdraw from auctions:
- LLM detects decision not to bid (keywords: "not to place", "withdrawing", "accept this loss")
- Agent sends withdrawal request with reasoning
- Server validates (can't withdraw if currently winning)
- Server issues USDC refund
- If only 1 active bidder remains → auction ends

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Blockchain**: viem, wagmi
- **Payments**: x402 protocol (x402-axios, x402-hono)
- **AI**: LlamaIndex, Anthropic Claude 3.5 Sonnet
- **Storage**: In-memory (Map-based)
- **Real-time**: Server-Sent Events (SSE)
- **Styling**: Tailwind CSS 4

## Notes for Future Development

- Consider rate limiting on bid endpoint for production
- The settlement lock is in-memory; for multi-instance deployments, use Redis or similar
- For production, consider persistent storage (database) instead of in-memory
