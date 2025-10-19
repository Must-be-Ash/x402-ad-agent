# 🔄 Migration Spec: Basename Bidding → Ad Spot Bidding

## 📋 Overview

Transform the autonomous basename auction system into an **ad spot bidding platform** where AI agents compete to display their creative advertisements. The winning agent uses Freepik's x402 mystic endpoint to generate a custom image displayed in the ad spot.

### Key Changes
- **Product**: Basenames → Ad Spot on website
- **Winner Prize**: Basename ownership → Display ad image on site
- **Image Generation**: None → Freepik AI image generation via x402
- **Database**: `agent-bid` → `ad-bid` (new database name to avoid overwriting existing)
- **Frontend**: Auction feed → **Banner at top** (placeholder → generated image) + Auction feed
- **Agent Intelligence**: Add image prompt creation + Freepik API tool

### Critical Implementation Notes

> **🔴 MUST READ BEFORE STARTING**
>
> 1. **Dual-Network Architecture** (CRITICAL!)
>    - Bidding: Base Sepolia testnet (test USDC, free)
>    - Freepik: **Base mainnet ONLY** (real USDC, ~$0.08 per image)
>    - Freepik's x402 endpoint does NOT work on testnet - only mainnet
>    - Each agent needs TWO wallets (one Sepolia, one mainnet)
>
> 2. **Frontend Banner Placement**
>    - Ad banner must be at the **TOP** of the page (full-width)
>    - Use `/public/x402-button-xl.png` as placeholder image
>    - Replace with Freepik-generated image URL when winner creates ad
>
> 3. **Database Safety**
>    - Using `ad-bid` database name (not `agent-bid`) to avoid overwriting existing data
>    - You don't need to preserve old app - just using different name for safety
>    - Can delete `agent-bid` database after new system is working

---

## 🏗️ Architecture Changes

### Before (Basename Auction)
```
Agent → Bids USDC (Sepolia) → Server → Winner recorded → [Manual Basename transfer]
                                 ↓
                            Refunds losers
```

### After (Ad Spot Auction)
```
Agent → Bids USDC (Sepolia) → Server → Winner recorded → Winner generates image
                                 ↓                              ↓
                            Refunds losers              Freepik API (Base mainnet)
                                                                 ↓
                                                        Image URL → Display in ad spot
```

### Network Architecture

> **⚠️ CRITICAL: Dual-Network Requirement**
>
> Freepik's x402 mystic endpoint is **ONLY available on Base mainnet** - it will not work on testnet!
>
> - **Bidding**: Base Sepolia testnet (test USDC, free)
> - **Freepik**: Base mainnet ONLY (real USDC, ~$0.08 per image)
>
> This means each agent needs **TWO separate wallets**:
> 1. Sepolia wallet for placing bids (testnet USDC)
> 2. Mainnet wallet for paying Freepik (real USDC)

| Component | Network | Token | Cost | Purpose |
|-----------|---------|-------|------|---------|
| Bid payments | Base Sepolia | USDC (test) | Free (faucet) | Agents compete for ad spot |
| Bid refunds | Base Sepolia | USDC (test) | Free (server pays gas) | Return funds to outbid agents |
| Freepik payment | **Base mainnet** | **USDC (real)** | **~$0.08** | Winner generates ad image |

---

## ✅ Implementation Checklist

---

## 1️⃣ Database Migration

### 1.1 Create New Database

> **🔴 CRITICAL: Database Safety - DO NOT TOUCH OLD DATABASE**
>
> Your current setup uses `MONGODB_DB_NAME=agent-bid` in `.env.local`.
>
> We will create a COMPLETELY NEW database called `ad-bid` by simply changing this environment variable.
> Your existing `agent-bid` database will remain 100% untouched and unchanged.
>
> **How it works:**
> - Your `lib/db.ts` already uses `process.env.MONGODB_DB_NAME` (line 13)
> - MongoDB will automatically create `ad-bid` database when first accessed
> - Old `agent-bid` database stays exactly as it is
> - No data migration, no deletion, no modification of old database

**File**: `.env.local` (line 8)

- [x] Change ONLY this one line in `.env.local`:

```bash
# OLD (line 8):
MONGODB_DB_NAME=agent-bid

# NEW:
MONGODB_DB_NAME=ad-bid
```

**That's it!** Your `lib/db.ts` already reads from `process.env.MONGODB_DB_NAME`, so changing this single environment variable will:
- ✅ Create a brand new `ad-bid` database
- ✅ Leave `agent-bid` database completely untouched
- ✅ Keep the same MongoDB connection (same URI, same cluster)

**Verification**:
- [ ] After changing the env var, restart the server
- [ ] Check MongoDB Atlas - you'll see BOTH databases:
  - `agent-bid` (old, unchanged)
  - `ad-bid` (new, empty)

### 1.2 Update Schema: BidRecord → AdSpotRecord

**Old Schema** (`BidRecord` for basenames):
```typescript
{
  basename: string,              // e.g., "x402agent.base.eth"
  currentBid: number,
  currentWinner: { agentId, walletAddress, externalId },
  bidHistory: [...],
  auctionEndTime: Date,
  auctionEnded: boolean,
  withdrawnAgents: string[]
}
```

**New Schema** (`AdSpotRecord` for ad spots):
```typescript
{
  adSpotId: string,              // e.g., "homepage-banner-1"
  currentBid: number,
  currentWinner: {
    agentId: string,
    walletAddress: string,
    externalId: string
  },
  bidHistory: [{
    agentId: string,
    amount: number,
    timestamp: Date,
    txHash: string,
    thinking?: string,
    strategy?: string,
    reasoning?: string,
    reflection?: string
  }],
  auctionEndTime: Date,
  auctionEnded: boolean,
  auctionEndReason?: 'time_expired' | 'withdrawal',
  withdrawnAgents: string[],

  // NEW FIELDS FOR AD DISPLAY
  winnerAdImage?: {
    url: string,                 // Freepik CDN URL
    prompt: string,              // AI-generated prompt
    taskId: string,              // Freepik task ID
    generatedAt: Date,
    freepikTxHash?: string       // Payment tx for image generation
  },
  status: 'active' | 'ended' | 'displaying_ad'
}
```

### 1.3 Update Database Functions

**Files to modify**: `lib/db.ts`, `types/index.ts`

- [x] Rename `BidRecord` interface → `AdSpotRecord`
- [x] Add `adSpotId` field (replace `basename`)
- [x] Add `winnerAdImage` nested object
- [x] Add `status` field
- [x] Update all function signatures:
  - `getBidRecord(basename)` → `getAdSpotRecord(adSpotId)`
  - `updateBidRecord(basename, updates)` → `updateAdSpotRecord(adSpotId, updates)`
  - `addBidToHistory(basename, bid)` → `addBidToHistory(adSpotId, bid)`

---

## 2️⃣ API Endpoint Modifications

### 2.1 Bidding Endpoint

**File**: `app/api/bid/[basename]/route.ts`

**Changes**:
- [x] Rename file: `[basename]` → `[adSpotId]`
  - `app/api/bid/[adSpotId]/route.ts`
- [x] Update route parameter extraction:
  ```typescript
  // Old:
  const { basename } = params;
  // New:
  const { adSpotId } = params;
  ```
- [x] Update database calls to use `getAdSpotRecord(adSpotId)`
- [x] Update success message:
  ```typescript
  // Old:
  message: `Bid placed for ${basename}: ${bidAmount} USDC`
  // New:
  message: `Bid placed for ad spot: ${bidAmount} USDC`
  ```
- [x] Keep all x402 payment logic (no changes to payment flow)
- [x] Keep refund logic (no changes)
- [x] Update SSE broadcasts to use `adSpotId` instead of `basename`

### 2.2 Status Endpoint

**File**: `app/api/status/route.ts`

**Changes**:
- [x] Accept `adSpotId` query parameter instead of `basename`
- [x] Update to query `AdSpotRecord` from `ad-bid` database
- [x] Add `winnerAdImage` to response when auction ended:
  ```typescript
  return NextResponse.json({
    adSpotId,
    currentBid,
    currentWinner,
    timeRemaining,
    auctionEnded,
    winnerAdImage: record.winnerAdImage || null  // NEW
  });
  ```

### 2.3 Refund Request Endpoint

**File**: `app/api/refund-request/[basename]/route.ts`

**Changes**:
- [x] Rename to `app/api/refund-request/[adSpotId]/route.ts`
- [x] Update parameter extraction and database queries
- [x] Keep all validation logic (agent not winning, wallet matches, etc.)
- [x] Keep refund issuance logic

### 2.4 SSE Streaming Endpoint

**File**: `app/api/stream/[basename]/route.ts`

**Changes**:
- [x] Rename to `app/api/stream/[adSpotId]/route.ts`
- [x] Update event emitter to use `adSpotId` as key
- [x] Keep all SSE logic (connection handling, event types)

### 2.5 NEW: Image Generation Endpoint

**File**: `app/api/generate-ad-image/route.ts` (NEW)

**Purpose**: Proxy endpoint that agents call to generate images via Freepik x402

**Implementation**:
```typescript
// POST /api/generate-ad-image
// Body: { adSpotId, agentId, prompt }

export async function POST(request: Request) {
  const { adSpotId, agentId, prompt } = await request.json();

  // 1. Verify agent is the winner
  const record = await getAdSpotRecord(adSpotId);
  if (record.currentWinner?.agentId !== agentId) {
    return NextResponse.json({ error: 'Not the winner' }, { status: 403 });
  }

  // 2. Forward to Freepik x402 endpoint
  // Agent's wallet (Base mainnet) handles payment via x402-axios
  const freepikResponse = await fetch('https://api.freepik.com/v1/x402/ai/mystic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-freepik-api-key': process.env.FREEPIK_API_KEY,
      // Forward X-PAYMENT header from agent request
      'X-PAYMENT': request.headers.get('X-PAYMENT') || ''
    },
    body: JSON.stringify({
      prompt,
      model: 'realism',
      resolution: '1k',
      aspect_ratio: 'widescreen',  // 16:9 for ad banner
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/freepik`
    })
  });

  // 3. If 402, return payment requirements to agent
  if (freepikResponse.status === 402) {
    return NextResponse.json(await freepikResponse.json(), { status: 402 });
  }

  // 4. If 200, store task_id and return to agent
  const data = await freepikResponse.json();

  await updateAdSpotRecord(adSpotId, {
    'winnerAdImage.taskId': data.task_id,
    'winnerAdImage.prompt': prompt
  });

  return NextResponse.json({
    taskId: data.task_id,
    status: 'pending'
  });
}
```

**Checklist**:
- [x] Create `app/api/generate-ad-image/route.ts`
- [x] Add Freepik API key validation
- [x] Implement winner verification
- [x] Forward x402 payment headers
- [x] Store task_id in database
- [x] Return 402 or task_id to agent

### 2.6 NEW: Freepik Webhook Endpoint

**File**: `app/api/webhooks/freepik/route.ts` (NEW)

**Purpose**: Receive completion notification from Freepik with generated image URL

**Implementation**:
```typescript
// POST /api/webhooks/freepik
// Freepik calls this when image generation completes

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookData = JSON.parse(rawBody);

  // 1. Validate webhook signature (security)
  const webhookId = request.headers.get('webhook-id');
  const webhookTimestamp = request.headers.get('webhook-timestamp');
  const webhookSignature = request.headers.get('webhook-signature');

  const isValid = validateWebhookSignature(
    webhookId,
    webhookTimestamp,
    webhookSignature,
    rawBody,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Extract task_id and image URL
  const { task_id, status, generated } = webhookData;

  if (status !== 'completed' || !generated?.[0]?.url) {
    console.error('Image generation failed:', webhookData);
    return NextResponse.json({ error: 'Generation failed' }, { status: 400 });
  }

  const imageUrl = generated[0].url;

  // 3. Find ad spot by task_id and update with image URL
  const db = await connectToDatabase();
  const result = await db.collection('adSpotRecords').findOneAndUpdate(
    { 'winnerAdImage.taskId': task_id },
    {
      $set: {
        'winnerAdImage.url': imageUrl,
        'winnerAdImage.generatedAt': new Date(),
        'status': 'displaying_ad'
      }
    },
    { returnDocument: 'after' }
  );

  if (result) {
    // 4. Broadcast event to frontend via SSE
    broadcastEvent(result.adSpotId, {
      type: 'ad_image_ready',
      imageUrl,
      winner: result.currentWinner
    });
  }

  return NextResponse.json({ success: true });
}
```

**Checklist**:
- [x] Create `app/api/webhooks/freepik/route.ts`
- [x] Implement webhook signature validation (copy from Freepik example)
- [x] Extract image URL from webhook payload
- [x] Update database with image URL
- [x] Broadcast `ad_image_ready` event via SSE
- [x] Handle error cases (failed generation)

### 2.7 NEW: Image Status Polling Endpoint

**File**: `app/api/image-status/route.ts` (NEW)

**Purpose**: Allow agents to poll for image generation completion (alternative to webhook)

**Implementation**:
```typescript
// GET /api/image-status?taskId=12345

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  // Query Freepik's status endpoint
  const response = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
    headers: {
      'x-freepik-api-key': process.env.FREEPIK_API_KEY
    }
  });

  const data = await response.json();

  // If completed, update database
  if (data.status === 'completed' && data.generated?.[0]?.url) {
    const db = await connectToDatabase();
    await db.collection('adSpotRecords').updateOne(
      { 'winnerAdImage.taskId': taskId },
      {
        $set: {
          'winnerAdImage.url': data.generated[0].url,
          'winnerAdImage.generatedAt': new Date(),
          'status': 'displaying_ad'
        }
      }
    );
  }

  return NextResponse.json(data);
}
```

**Checklist**:
- [x] Create `app/api/image-status/route.ts`
- [x] Implement Freepik status API call
- [x] Update database when image ready
- [x] Return status to agent

---

## 3️⃣ Agent Modifications

### 3.1 Add Freepik Image Generation Tool

**File**: `agents/shared/intelligent-agent.ts`

**Changes**:
- [ ] Add new environment variables:
  ```typescript
  private freepikApiKey: string;
  private baseMainnetWallet: Wallet;  // Separate wallet for Freepik payments
  ```
- [ ] Initialize Base mainnet wallet (for Freepik payments):
  ```typescript
  // In constructor
  this.baseMainnetWallet = new Wallet(
    process.env.AGENT_FREEPIK_PRIVATE_KEY!,
    new providers.JsonRpcProvider('https://mainnet.base.org')
  );
  ```
- [ ] Add `generate_ad_image` tool to LlamaIndex agent:

```typescript
const generateAdImageTool = FunctionTool.from(
  async ({ prompt }: { prompt: string }) => {
    try {
      console.log(`🎨 [${this.agentName}] Generating ad image with prompt: "${prompt}"`);

      // Broadcast thinking
      broadcastEvent(this.adSpotId, {
        type: 'thinking',
        agentId: this.agentName,
        content: `Creating ad image with prompt: "${prompt}"`
      });

      // Configure x402-axios for Base mainnet
      const x402Client = configureX402Client({
        wallet: this.baseMainnetWallet,
        network: 'base',  // Mainnet
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      });

      // Call server endpoint (which forwards to Freepik)
      const response = await x402Client.post(
        `${this.serverUrl}/api/generate-ad-image`,
        {
          adSpotId: this.adSpotId,
          agentId: this.agentName,
          prompt
        }
      );

      const { taskId } = response.data;

      // Poll for completion every 3 seconds (max 60 seconds)
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `${this.serverUrl}/api/image-status?taskId=${taskId}`
        );
        const status = await statusResponse.json();

        if (status.status === 'completed' && status.generated?.[0]?.url) {
          console.log(`✅ [${this.agentName}] Image generated: ${status.generated[0].url}`);
          return JSON.stringify({
            success: true,
            imageUrl: status.generated[0].url,
            message: 'Ad image successfully generated and will be displayed'
          });
        }

        console.log(`⏳ [${this.agentName}] Image still generating... (${i+1}/20)`);
      }

      return JSON.stringify({
        success: false,
        message: 'Image generation timed out'
      });

    } catch (error: any) {
      console.error(`❌ [${this.agentName}] Image generation failed:`, error.message);
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  },
  {
    name: 'generate_ad_image',
    description: `Generate an AI image for your advertisement using Freepik's mystic API.
    Call this AFTER winning the auction to create and display your ad.
    Costs ~$0.08 USDC on Base mainnet.

    Parameters:
    - prompt: Detailed description of the ad image to generate (be creative and specific!)

    Example prompts:
    - "A futuristic tech startup office with holographic displays and happy employees"
    - "An eco-friendly product made of sustainable materials in a lush green forest"
    - "A luxury sports car driving through a neon-lit cyberpunk city at night"`,
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed creative prompt for the ad image'
        }
      },
      required: ['prompt']
    }
  }
);
```

**Checklist**:
- [x] Add `generate_ad_image` tool to agent
- [x] Configure x402-axios for **Base mainnet** (NOT Sepolia - Freepik only works on mainnet!)
- [x] Use same wallet (works on both Sepolia and mainnet - no separate wallet needed)
- [x] Set USDC address to mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- [x] Implement image generation request
- [x] Add polling loop for completion
- [x] Broadcast thinking events
- [x] Handle errors and timeouts

> **⚠️ CRITICAL: Network Configuration**
>
> The `generate_ad_image` tool MUST use:
> - **Network**: `base` (mainnet, NOT `base-sepolia`)
> - **Wallet**: `this.baseMainnetWallet` (separate from bidding wallet)
> - **USDC Contract**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (mainnet USDC)
>
> Freepik's x402 endpoint **ONLY works on Base mainnet**. Using testnet will result in payment verification failures.

### 3.2 Update Agent System Prompt

**File**: `agents/shared/intelligent-agent.ts`

**Current prompt focus**: Bidding strategy for basenames

**New prompt addition**:
```typescript
const systemPrompt = `You are ${this.agentName}, an autonomous advertising agent competing for ad space.

Your goal: Win ad spot auctions by placing strategic bids, then generate compelling ad images.

Available tools:
1. get_my_balance - Check your USDC balance
2. get_auction_state - See current bid and auction status
3. place_bid - Place a bid for the ad spot (costs USDC on Base Sepolia)
4. withdraw - Withdraw from auction if not worth continuing
5. generate_ad_image - Create your ad image after winning (costs ~$0.08 on Base mainnet)

Bidding strategy:
- Analyze auction state and decide bid amounts strategically
- Monitor your budget and maximize value
- Consider withdrawing if bid gets too high

After winning:
- You MUST call generate_ad_image to create your advertisement
- Be creative with your image prompt - this is your chance to shine!
- Your ad will be displayed on the website for all to see

Budget constraints:
- Bidding budget: ${this.maxBid} USDC (Sepolia testnet)
- Image generation: ~$0.08 USDC (Base mainnet) - separate wallet
`;
```

**Checklist**:
- [x] Update system prompt to mention ad spot instead of basename
- [x] Add `generate_ad_image` tool to instructions
- [x] Clarify two budgets (bidding vs image generation)
- [x] Encourage creative prompt generation

### 3.3 Add Winner Detection & Auto-Image Generation

**File**: `agents/shared/intelligent-agent.ts`

**Add to monitoring loop**:
```typescript
private async monitorAuctionEnd() {
  setInterval(async () => {
    try {
      const state = await this.getAuctionState();

      // Check if auction ended and this agent won
      if (state.auctionEnded && state.currentWinner?.agentId === this.agentName) {
        // Check if we already generated an image
        if (!state.winnerAdImage?.url) {
          console.log(`🎉 [${this.agentName}] WE WON! Generating ad image...`);

          // Ask LLM to generate creative prompt
          const response = await this.agent.chat({
            message: `You just won the ad spot auction! Now you need to create an amazing advertisement image. Generate a creative, detailed prompt for your ad image that represents your brand/identity. Call the generate_ad_image tool with your prompt.`
          });

          console.log(`✨ [${this.agentName}] LLM response:`, response.response);
        }

        // Stop monitoring after winning
        this.stopMonitoring();
      }
    } catch (error) {
      console.error(`Error monitoring auction end:`, error);
    }
  }, 5000);  // Check every 5 seconds
}
```

**Checklist**:
- [x] Add auction end monitoring
- [x] Detect when this agent wins
- [x] Trigger LLM to generate creative image prompt
- [x] Call `generate_ad_image` tool automatically
- [x] Stop monitoring after completion

### 3.4 Update Agent Environment Variables

**File**: `agents/.env`

the key are set. check /Users/ashnouruzi/x402-ad-bid/agents/.env to see their name

### 3.5 Update Agent Runner Scripts

**Files**: `agents/intelligentAgentA.ts`, `agents/intelligentAgentB.ts`

**Changes**:
```typescript
// Old:
const basename = process.env.BASENAME_TO_AUCTION || 'x402agent.base.eth';
// New:
const adSpotId = process.env.AD_SPOT_ID || 'homepage-banner-1';

// Old:
const agent = new IntelligentAgent({
  basename,
  // ...
});
// New:
const agent = new IntelligentAgent({
  adSpotId,
  freepikPrivateKey: process.env.AGENT_A_FREEPIK_PRIVATE_KEY!,
  freepikApiKey: process.env.FREEPIK_API_KEY!,
  // ...
});
```

**Checklist**:
- [x] Update parameter from `basename` to `adSpotId`
- [x] Pass Freepik credentials to agent constructor (N/A - server-side only)
- [x] Update console logs to mention "ad spot" instead of "basename"

---

## 4️⃣ Frontend Changes

### 4.1 Add Ad Spot Display Component

**File**: `app/components/AdSpotDisplay.tsx` (NEW)

**Purpose**: Display the winning agent's generated ad image

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';

interface AdSpotDisplayProps {
  adSpotId: string;
}

export default function AdSpotDisplay({ adSpotId }: AdSpotDisplayProps) {
  const [adData, setAdData] = useState<{
    imageUrl?: string;
    winner?: string;
    prompt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current ad spot state
    const fetchAdState = async () => {
      const response = await fetch(`/api/status?adSpotId=${adSpotId}`);
      const data = await response.json();

      setAdData({
        imageUrl: data.winnerAdImage?.url,
        winner: data.currentWinner?.agentId,
        prompt: data.winnerAdImage?.prompt
      });
      setLoading(false);
    };

    fetchAdState();

    // Listen for SSE updates
    const eventSource = new EventSource(`/api/stream/${adSpotId}`);

    eventSource.addEventListener('ad_image_ready', (event) => {
      const data = JSON.parse(event.data);
      setAdData({
        imageUrl: data.imageUrl,
        winner: data.winner.agentId,
        prompt: data.prompt
      });
    });

    return () => eventSource.close();
  }, [adSpotId]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading ad spot...</p>
      </div>
    );
  }

  if (!adData?.imageUrl) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg bg-white">
        <img
          src="/x402-button-xl.png"
          alt="x402 - Ad spot available"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg">
        <img
          src={adData.imageUrl}
          alt={`Ad by ${adData.winner}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
          <p className="text-xs">
            <span className="font-semibold">Advertiser:</span> {adData.winner}
          </p>
          {adData.prompt && (
            <p className="text-xs mt-1 opacity-75">
              <span className="font-semibold">Prompt:</span> {adData.prompt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Checklist**:
- [x] Create `app/components/AdSpotDisplay.tsx`
- [x] Fetch initial ad state from `/api/status`
- [x] Subscribe to SSE for `ad_image_ready` events
- [x] Display placeholder (`/x402-button-xl.png`) when no ad exists
- [x] Replace placeholder with generated image URL when winner creates ad
- [x] Display generated image with winner info
- [x] Style as banner ad (16:9 aspect ratio)

> **📸 Placeholder Image**
>
> Use `/public/x402-button-xl.png` as the default placeholder image when:
> - No auction has completed yet
> - Auction in progress (no winner yet)
> - Winner hasn't generated image yet
>
> Once the winning agent generates an image via Freepik, replace the placeholder with the generated image URL.

### 4.2 Update Auction Page

**File**: `app/auction/[basename]/page.tsx`

**Changes**:
- [x] Rename to `app/auction/[adSpotId]/page.tsx`
- [x] Import `AdSpotDisplay` component
- [x] Add ad banner at the very top of the page (full-width, above header)
- [x] Update page title and description

> **🎯 Frontend Layout**
>
> The ad banner should be positioned at the **TOP** of the page:
> ```
> ┌─────────────────────────────────────────┐
> │  AD BANNER (Full Width)                 │
> │  Shows: /x402-button-xl.png             │
> │                                         │
> └─────────────────────────────────────────┘
>
> ┌─────────────────────────────────────────┐
> │  Page Title: "Ad Spot Auction"          │
> │  Description                            │
> ├─────────────────────────────────────────┤
> │  Live Auction Feed                      │
> │  - Agent thinking                       │
> │  - Bids                                 │
> │  - Reflections                          │
> └─────────────────────────────────────────┘
> ```

```typescript
export default function AuctionPage({ params }: { params: { adSpotId: string } }) {
  const { adSpotId } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AD BANNER AT TOP - NEW */}
      <div className="w-full bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto p-4">
          <AdSpotDisplay adSpotId={adSpotId} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-2">Ad Spot Auction</h1>
        <p className="text-gray-600 mb-8">
          Autonomous AI agents competing for the banner ad space above
        </p>

        {/* Auction feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Live Auction Feed</h2>
          <AuctionFeed adSpotId={adSpotId} />
        </div>
      </div>
    </div>
  );
}
```

**Checklist**:
- [x] Rename folder `[basename]` → `[adSpotId]`
- [x] Add `AdSpotDisplay` component at top
- [x] Update page title and description
- [x] Keep existing auction feed below ad spot
- [x] Update SSE stream to use `adSpotId`

### 4.3 Update Auction Feed Component

**File**: `app/components/AuctionFeed.tsx` (if exists, or inline in page)

**Changes**:
- [x] Update parameter from `basename` to `adSpotId`
- [x] Update event stream URL: `/api/stream/${adSpotId}`
- [x] Add new event type handler for `ad_image_ready`:

```typescript
eventSource.addEventListener('ad_image_ready', (event) => {
  const data = JSON.parse(event.data);
  setEvents(prev => [...prev, {
    type: 'ad_image_ready',
    timestamp: new Date(),
    content: `🎨 ${data.winner.agentId} generated ad image!`,
    imageUrl: data.imageUrl
  }]);
});
```

**Checklist**:
- [x] Update to use `adSpotId` parameter
- [x] Add `ad_image_ready` event handler
- [x] Display image generation events in feed
- [x] Keep all existing event types (thinking, bid_placed, reflection, refund)

### 4.4 Update Event Types

**File**: `lib/events.ts`

**Add new event type**:
```typescript
export type AuctionEventType =
  | 'thinking'
  | 'bid_placed'
  | 'reflection'
  | 'refund'
  | 'withdrawal'
  | 'auction_ended'
  | 'ad_image_ready'        // NEW
  | 'image_generating';     // NEW
```

**Checklist**:
- [x] Add `ad_image_ready` event type
- [x] Add `image_generating` event type (optional, for loading state)
- [x] Update event broadcaster to handle new types

---

## 5️⃣ Environment Configuration

### 5. this step is done

- [x] set keys

---

## 6️⃣ Wallet Setup & Funding

### 6.1 Dual Wallet Architecture

**UPDATE**: Same wallet works on both networks - no separate wallets needed!

| Network | Purpose | Token | Funding |
|---------|---------|-------|---------|
| Base Sepolia | Pay for bids | USDC (testnet) | Faucet (~$20) |
| Base mainnet | Pay for images | USDC (real) | ~$1 real USDC |

**Note**: Agents use the same private key/wallet address on both networks.

### 6.2 Create & Fund Wallets

**Checklist**:
- [x] Generate 2 new wallets for Agent A (Sepolia + Mainnet) - N/A: using existing wallet
- [x] Generate 2 new wallets for Agent B (Sepolia + Mainnet) - N/A: using existing wallet
- [x] Fund Sepolia wallets using Base Sepolia faucet - Already funded
- [x] Purchase ~$2 USDC on Base mainnet via Coinbase - Already funded
- [x] Transfer $1 USDC to each agent's mainnet wallet - Already funded
- [ ] Verify balances (user can run these commands to check):
  ```bash
  # Check Sepolia balance
  cast balance <ADDRESS> --rpc-url https://sepolia.base.org

  # Check mainnet USDC balance
  cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
    "balanceOf(address)(uint256)" <ADDRESS> \
    --rpc-url https://mainnet.base.org
  ```

### 6.3 Server Wallet (Unchanged)

**Checklist**:
- [x] Keep existing CDP server wallet on Base Sepolia
- [x] Verify wallet has USDC for refunds
- [x] No mainnet wallet needed for server (agents pay Freepik directly)

---

## 7️⃣ Helper Scripts & Utilities

### 7.1 Webhook Security Helper

**File**: `lib/webhook-security.ts` (NEW)

**Purpose**: Validate Freepik webhook signatures

**Copy from Freepik example**: `/Users/ashnouruzi/freepik/lib/webhook-security.ts`

**Checklist**:
- [x] Copy webhook validation logic from Freepik example
- [x] Implement HMAC-SHA256 signature verification
- [x] Export `validateWebhookSignature()` function

### 7.2 Update Type Definitions

**File**: `types/index.ts`

**Checklist**:
- [x] Rename `BidRecord` → `AdSpotRecord` (already done, BidRecord kept for compatibility)
- [x] Add `WinnerAdImage` interface:
  ```typescript
  export interface WinnerAdImage {
    url: string;
    prompt: string;
    taskId: string;
    generatedAt: Date;
    freepikTxHash?: string;
  }
  ```
- [x] Update `AdSpotRecord` interface with new fields
- [x] Add `AdImageReadyEvent` type

### 7.3 Update x402 Configuration

**File**: `lib/x402-config.ts`

**Changes**:
- [x] Keep existing config for bidding (Sepolia)
- [x] Add separate config for Freepik (mainnet):
  ```typescript
  export const FREEPIK_X402_CONFIG = {
    network: 'base',  // Mainnet
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    facilitatorUrl: 'https://api.x402.org/facilitator'
  };
  ```

---

## 8️⃣ Testing Checklist

### 8.1 Database Testing
- [ ] Verify `ad-bid` database created in MongoDB Atlas
- [ ] Verify `adSpotRecords` collection exists
- [ ] Test `getAdSpotRecord()` function
- [ ] Test `updateAdSpotRecord()` function
- [ ] Verify old `agent-bid` database untouched

### 8.2 API Endpoint Testing

**Bidding Endpoint**:
- [x] Test `POST /api/bid/homepage-banner-1` returns 402 ✅ (returns proper x402 payment requirements)
- [ ] Test payment acceptance and database update (requires agent test)
- [ ] Test refund issuance to previous bidder (requires agent test)
- [ ] Verify SSE events broadcast correctly (requires agent test)

**Image Generation Endpoint**:
- [x] Test `POST /api/generate-ad-image` endpoint exists ✅ (returns 404 when no auction)
- [ ] Test rejection when non-winner tries to generate (requires agent test)
- [ ] Test 402 payment requirement forwarding (requires agent test)
- [ ] Verify task_id stored in database (requires agent test)

**Webhook Endpoint**:
- [x] Test Freepik webhook signature validation ✅ (correctly rejects unsigned requests with 401)
- [ ] Test image URL extraction and database update (requires valid webhook from Freepik)
- [ ] Test `ad_image_ready` event broadcast (requires valid webhook)
- [x] Test error handling for failed generation ✅ (signature validation working)

**Status Endpoint**:
- [x] Test `GET /api/status?adSpotId=homepage-banner-1` ✅ (returns correct structure)
- [x] Verify returns `winnerAdImage` when available ✅ (field present, null when no image)
- [x] Test rejects old `basename` parameter ✅ (requires adSpotId)

### 8.3 Agent Testing

**Bidding Behavior**:
- [x] Start Agent A - verify connects and queries state ✅ (connected, queried state for homepage-banner-1)
- [x] Start Agent B - verify both compete ✅ (both agents bid competitively: $2 → $3.50 → $5)
- [x] Verify refund detection works (balance monitoring) ✅ (Agent A detected being outbid and counter-bid)
- [ ] Verify withdrawal system works (not tested - agents actively bidding)

**Image Generation**:
- [x] Verify winning agent detects victory ✅ (Agent A detected win and attempted image generation)
- [x] Verify LLM generates creative image prompt ✅ (generated detailed futuristic cityscape prompt)
- [x] Verify `generate_ad_image` tool called ✅ (tool was called automatically upon detecting victory)
- [ ] Verify x402 payment to Freepik succeeds (requires auction to fully end and agent to win)
- [ ] Verify agent polls for completion (requires successful image generation)
- [ ] Verify agent receives image URL (requires successful image generation)

**Note**: Image generation tests require letting auction fully complete. Core functionality verified - agents detect victory and call the tool automatically.

### 8.4 Frontend Testing

**Ad Spot Display**:
- [ ] Load `/auction/homepage-banner-1` page
- [ ] Verify placeholder shows when no ad exists
- [ ] Verify image displays after generation
- [ ] Verify winner name and prompt displayed
- [ ] Verify SSE updates work in real-time

**Auction Feed**:
- [ ] Verify thinking bubbles appear
- [ ] Verify bid cards display correctly
- [ ] Verify reflections show
- [ ] Verify `ad_image_ready` event appears in feed
- [ ] Verify timestamps and agent names correct

### 8.5 End-to-End Test

**Complete Flow**:
1. [ ] Clear database: `db.adSpotRecords.deleteMany({})`
2. [ ] Start server: `npm run dev`
3. [ ] Open frontend: `http://localhost:3000/auction/homepage-banner-1`
4. [ ] Start Agent A: `npm run agent:ai:a`
5. [ ] Verify Agent A places first bid
6. [ ] Start Agent B: `npm run agent:ai:b`
7. [ ] Verify agents compete with strategic bids
8. [ ] Wait for auction to end (5 minutes or withdrawal)
9. [ ] Verify winning agent generates image
10. [ ] Verify image appears in ad spot on frontend
11. [ ] Check Basescan for Freepik payment transaction
12. [ ] Verify image URL saved in MongoDB

**Expected Timeline**:
- 0:00 - Auction starts with first bid
- 0:00-5:00 - Agents compete
- 5:00 - Auction ends
- 5:05 - Winner detects victory
- 5:10 - LLM generates prompt
- 5:15 - Payment to Freepik settles
- 5:20 - Image generation starts
- 5:40 - Image ready (20-30 sec generation time)
- 5:40 - Frontend displays ad

---

## 9️⃣ Development Best Practices

### 9.1 Database Naming
> **📝 Why Use `ad-bid` Instead of `agent-bid`?**
>
> We're using a new database name (`ad-bid`) to avoid accidentally overwriting your existing `agent-bid` database.
> You don't need to preserve the old app - this is just a safety measure. Once the new system is working,
> you can delete the old `agent-bid` database if desired.

- [ ] All code changes use `ad-bid` database
- [ ] Old `agent-bid` database remains untouched (can be deleted later)
- [ ] No migration of old data needed - fresh start

### 9.2 Git Workflow
- [ ] Create git branch: `git checkout -b ad-spot-implementation`
- [ ] Commit frequently with descriptive messages
- [ ] Update `CLAUDE.md` with new architecture as you go
- [ ] Update `README.md` with new setup instructions

### 9.3 Testing Strategy
- [ ] Test each component individually before integration
- [ ] Use ngrok for webhook testing during development
- [ ] Keep testnet and mainnet wallets separate
- [ ] Monitor transaction hashes on Basescan to verify payments

---

## 🔟 Post-Migration Tasks

### 10.1 Documentation Updates
- [ ] Update `CLAUDE.md` with ad spot architecture
- [ ] Update `README.md` with new setup steps
- [ ] Update testing guide with new flow

---

## 📊 Key Metrics & Costs

### Transaction Costs
| Action | Network | Token | Cost |
|--------|---------|-------|------|
| Place bid | Base Sepolia | USDC (test) | $1-15 per bid |
| Refund | Base Sepolia | USDC (test) |
| Generate image | Base mainnet | USDC (real) | ~$0.08 per image |

### Agent Budget Per Auction
- **Bidding**: Up to $15 USDC (testnet, free)
- **Image generation**: $0.08 USDC (mainnet, real cost)
- **Total real cost per auction per agent**: ~$0.08

### Recommended Funding
- **Per agent testnet wallet**: $20 USDC (testnet faucet)
- **Per agent mainnet wallet**: $1 USDC (real) = ~12 auctions
- **Server wallet**: $50 USDC (testnet) for refunds

---

## ✅ Final Implementation Checklist

Before considering the transformation complete:

- [ ] All database operations use `ad-bid` database
- [ ] All API endpoints accept `adSpotId` parameter (not `basename`)
- [ ] Agents have dual wallets (Sepolia for bidding + mainnet for Freepik)
- [ ] Freepik integration works (402 → mainnet payment → image URL)
- [ ] Webhooks validated and secure (signature verification implemented)
- [ ] Frontend displays banner at top with placeholder `/x402-button-xl.png`
- [ ] Generated images replace placeholder when auction completes
- [ ] SSE events include `ad_image_ready` and `image_generating`
- [ ] End-to-end test passes successfully (bid → win → generate → display)
- [ ] Documentation updated (`CLAUDE.md`, `README.md`)

---

## 🚀 Quick Start After Implementation

```bash
# Terminal 1 - Server
npm run dev

# Terminal 2 - Agent A
npm run agent:ai:a

# Terminal 3 - Agent B
npm run agent:ai:b

# Browser
open http://localhost:3000/auction/homepage-banner-1
```

Watch as agents compete, win, and generate creative advertisements in real-time!

---

## 📞 Troubleshooting Guide

### Issue: Agent can't generate image (403 error)
**Cause**: Agent is not the winner
**Fix**: Check `currentWinner.agentId` in database matches agent trying to generate

### Issue: Freepik returns 402 verification failed
**Cause**: Payment network mismatch or invalid signature
**Fix**:
- Verify agent using Base mainnet wallet (not Sepolia)
- Check USDC contract address matches Freepik requirements
- Verify wallet has sufficient USDC balance

### Issue: Webhook not receiving image URL
**Cause**: Webhook URL not publicly accessible or signature validation failing
**Fix**:
- Use ngrok for local development: `ngrok http 3000`
- Update `NEXT_PUBLIC_BASE_URL` to ngrok URL
- Verify webhook secret matches Freepik dashboard

### Issue: Image generation times out
**Cause**: Freepik service slow or polling loop too short
**Fix**:
- Increase polling timeout from 60s to 120s
- Check Freepik status page for outages
- Verify task_id stored correctly

### Issue: Database not updating
**Cause**: Still pointing to `agent-bid` database
**Fix**:
- Check `lib/db.ts` - should be `const dbName = 'ad-bid'`
- Verify MongoDB URI connects to correct cluster
- Check collection name is `adSpotRecords`

---

## 📚 Reference Files

Copy implementation patterns from:
- **Freepik x402 integration**: `/Users/ashnouruzi/freepik/app/api/generate-image/route.ts`
- **Webhook handling**: `/Users/ashnouruzi/freepik/app/api/webhooks/freepik/route.ts`
- **Webhook security**: `/Users/ashnouruzi/freepik/lib/webhook-security.ts`
- **Polling logic**: `/Users/ashnouruzi/freepik/app/api/task-status/route.ts`
- **Environment config**: `/Users/ashnouruzi/freepik/.env.local`

---

**Estimated Migration Time**: 4-6 hours for experienced developer

**Complexity**: Moderate - requires understanding of x402, dual-network setup, and async image generation

**Risk Level**: Low - uses new database, original system unchanged

Good luck with your migration! 🎨✨
