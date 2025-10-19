import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { createWalletClient, http, publicActions, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Hex } from 'viem';
import { Anthropic } from '@llamaindex/anthropic';
import { FunctionTool, ReActAgent } from 'llamaindex';
import { z } from 'zod';

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

interface BrandIdentity {
  brandName: string;
  productName: string;
  industry: string;
  productDescription: string;
  targetAudience: string;
  brandPersonality: string;
  marketingAngle: string;
  visualStyle: string;
  keyMessages: string[];
}

interface BidContext {
  adSpotId: string;
  currentBid: number | null;
  timeRemaining: number | null;
  bidHistory: Array<{
    agentId: string;
    amount: number;
    timestamp: string;
  }>;
  myBalance: number;
  lastRefundAmount?: number;
}

interface BidDecision {
  thinking: string;
  proposedAmount: number;
  strategy: string;
  reasoning: string;
  confidence: number;
}

export class IntelligentBiddingAgent {
  private wallet;
  private axiosWithPayment;
  private agentName: string;
  private maxBid: number;
  private serverUrl: string;
  private isActive: boolean = true;
  private publicClient;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private auctionEndMonitoringInterval: NodeJS.Timeout | null = null;
  private llm;
  private bot;
  private bidHistory: BidContext['bidHistory'] = [];
  private lastRefundAmount?: number;
  private brandIdentity?: BrandIdentity;

  constructor(config: {
    privateKey: Hex;
    agentName: string;
    maxBid: number;
    serverUrl: string;
    anthropicApiKey: string;
    brandIdentity?: BrandIdentity;
  }) {
    this.agentName = config.agentName;
    this.maxBid = config.maxBid;
    this.serverUrl = config.serverUrl;
    this.brandIdentity = config.brandIdentity;

    // Create wallet client
    this.wallet = createWalletClient({
      chain: baseSepolia,
      transport: http(),
      account: privateKeyToAccount(config.privateKey),
    }).extend(publicActions);

    // Create public client for reading balances
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Create axios client with x402 payment interceptor
    this.axiosWithPayment = withPaymentInterceptor(
      axios.create({
        headers: { 'X-Agent-ID': this.agentName }
      }),
      this.wallet as any // Type assertion for viem version compatibility
    );

    // Initialize LLM
    this.llm = new Anthropic({
      apiKey: config.anthropicApiKey,
      model: 'claude-3-5-sonnet-20241022',
    });

    // Create agent with tools
    this.bot = this.createAgent();

    console.log(`🧠 ${this.agentName} initialized with AI reasoning`);
    console.log(`   Wallet: ${this.wallet.account.address}`);
  }

  private createAgent() {
    const getBalanceTool = FunctionTool.from(
      async () => {
        console.log(`\n💵 [${this.agentName}] Checking balance...`);
        const balance = await this.getUSDCBalance();
        const result = {
          success: true,
          data: {
            balance,
            maxBid: this.maxBid
          }
        };
        console.log(`✅ [${this.agentName}] Balance retrieved:`, JSON.stringify(result));
        return JSON.stringify(result);
      },
      {
        name: 'get_my_balance',
        description: 'Returns your current USDC balance and maximum bid limit',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      }
    );

    const getAuctionStateTool = FunctionTool.from(
      async (input: { adSpotId: string }) => {
        console.log(`\n🔍 [${this.agentName}] Fetching auction state for ${input.adSpotId}...`);
        try {
          const response = await axios.get(
            `${this.serverUrl}/api/status?adSpotId=${encodeURIComponent(input.adSpotId)}`
          );

          const data = response.data;

          // Transform to expected format
          const result = {
            success: true,
            data: {
              winningBid: data.currentBid || 0,
              winningBidder: data.currentWinner?.agentId || null,
              timeRemaining: data.timeRemaining ? `${Math.floor(data.timeRemaining / 60)}:${(data.timeRemaining % 60).toString().padStart(2, '0')}` : null,
              bidHistory: data.bidHistory || [],
            }
          };
          console.log(`✅ [${this.agentName}] Auction state retrieved:`, JSON.stringify(result));
          return JSON.stringify(result);
        } catch (error: any) {
          console.error(`❌ [${this.agentName}] Failed to get auction state:`, error.message);
          return JSON.stringify({ success: false, error: error.message });
        }
      },
      {
        name: 'get_auction_state',
        description: 'Returns the current state of the auction including current bid, winner, time remaining, and bid history',
        parameters: {
          type: 'object',
          properties: {
            adSpotId: {
              type: 'string',
              description: 'The adSpotId being auctioned',
            },
          },
          required: ['adSpotId'],
        },
      }
    );

    const placeBidTool = FunctionTool.from(
      async (input: { adSpotId: string; proposedAmount: number; reasoning: string }) => {
        try {
          console.log(`\n💭 [${this.agentName}] Thinking: ${input.reasoning}`);
          console.log(`💰 [${this.agentName}] Proposing bid: $${input.proposedAmount.toFixed(2)}`);
          console.log(`🌐 [${this.agentName}] Sending to: ${this.serverUrl}/api/bid/${input.adSpotId}`);

          // First request with proposed bid (no payment yet)
          const response = await this.axiosWithPayment.post(
            `${this.serverUrl}/api/bid/${input.adSpotId}`,
            {
              thinking: input.reasoning,
              strategy: 'intelligent'
            },
            {
              headers: {
                'X-Proposed-Bid': input.proposedAmount.toString(),
                'X-Strategy-Reasoning': input.reasoning,
              }
            }
          );

          console.log(`📡 [${this.agentName}] Server response status: ${response.status}`);
          console.log(`📡 [${this.agentName}] Server response data:`, JSON.stringify(response.data));

          if (response.status === 200 && response.data.success) {
            const result = {
              success: true,
              data: {
                message: `Bid accepted at $${response.data.currentBid}`,
                currentBid: response.data.currentBid,
                auctionEndsIn: response.data.auctionEndsIn,
                transactionHash: response.data.transactionHash,
              }
            };
            console.log(`✅ [${this.agentName}] Returning success:`, JSON.stringify(result));
            return JSON.stringify(result);
          }

          return JSON.stringify({ success: false, message: 'Bid failed' });
        } catch (error: any) {
          console.error(`❌ [${this.agentName}] Bid request error:`, error.message);
          console.error(`   Status:`, error.response?.status);
          console.error(`   Data:`, error.response?.data);

          // Handle 400 Bad Request (proposal rejected as too low)
          if (error.response?.status === 400) {
            const rejection = error.response.data;
            return JSON.stringify({
              success: false,
              proposalRejected: true,
              yourProposal: rejection.negotiation?.yourProposal || null,
              minimumRequired: rejection.negotiation?.minimumToWin || null,
              currentBid: rejection.negotiation?.currentBid || null,
              message: rejection.negotiation?.message || 'Proposal too low',
              suggestion: rejection.negotiation?.suggestion || null,
            });
          }

          // Handle 402 Payment Required (needs payment)
          if (error.response?.status === 402) {
            const paymentReq = error.response.data;
            return JSON.stringify({
              success: false,
              needsNegotiation: true,
              minimumRequired: paymentReq.negotiation?.minimumToWin || null,
              currentBid: paymentReq.negotiation?.currentBid || null,
              message: paymentReq.negotiation?.message || 'Negotiation required',
              suggestion: paymentReq.negotiation?.suggestion || null,
            });
          }

          return JSON.stringify({ success: false, message: error.message });
        }
      },
      {
        name: 'place_bid',
        description: 'CRITICAL: This tool MUST be executed to actually place a bid. Do NOT simulate or guess the response. This makes a real HTTP request with payment to place your bid on the blockchain. Returns one of: 1) success=true if bid accepted, 2) proposalRejected=true if your amount is too low (you must propose higher), 3) needsNegotiation=true if payment is required. Always check the actual response and adjust your strategy accordingly.',
        parameters: {
          type: 'object',
          properties: {
            adSpotId: {
              type: 'string',
              description: 'The adSpotId to bid on',
            },
            proposedAmount: {
              type: 'number',
              description: 'The amount you want to bid in USDC',
            },
            reasoning: {
              type: 'string',
              description: 'Your strategic reasoning for this bid amount',
            },
          },
          required: ['adSpotId', 'proposedAmount', 'reasoning'],
        },
      }
    );

    const generateAdImageTool = FunctionTool.from(
      async (input: { prompt: string }) => {
        try {
          console.log(`\n🎨 [${this.agentName}] Generating ad image with prompt: "${input.prompt}"`);

          // Call server endpoint (which forwards to Freepik with x402)
          // The server will handle the 402 payment flow
          const response = await this.axiosWithPayment.post(
            `${this.serverUrl}/api/generate-ad-image`,
            {
              adSpotId: process.env.AD_SPOT_ID,
              agentId: this.agentName,
              prompt: input.prompt
            }
          );

          const { taskId } = response.data;
          console.log(`📝 [${this.agentName}] Image generation started. Task ID: ${taskId}`);

          // Poll for completion every 3 seconds (max 60 seconds)
          for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const statusResponse = await axios.get(
              `${this.serverUrl}/api/image-status?taskId=${taskId}`
            );
            const status = statusResponse.data;

            if (status.status === 'completed' && status.generated?.[0]?.url) {
              console.log(`✅ [${this.agentName}] Image generated: ${status.generated[0].url}`);
              return JSON.stringify({
                success: true,
                imageUrl: status.generated[0].url,
                message: 'Ad image successfully generated and will be displayed on the website'
              });
            }

            console.log(`⏳ [${this.agentName}] Image still generating... (${i+1}/20)`);
          }

          return JSON.stringify({
            success: false,
            message: 'Image generation timed out after 60 seconds'
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
        description: `Generate an AI-created advertisement image using Freepik's mystic API.
        Call this AFTER winning the auction to create and display your ad on the website.
        Costs ~$0.08 USDC on Base mainnet (separate from bidding budget).

        Parameters:
        - prompt: Detailed creative description of the ad image to generate (be specific and creative!)

        Example prompts:
        - "A futuristic tech startup office with holographic displays and happy diverse employees collaborating"
        - "An eco-friendly product made of sustainable bamboo materials in a lush green forest setting"
        - "A luxury sports car driving through a neon-lit cyberpunk city at night with reflections"`,
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Detailed creative prompt for generating the advertisement image'
            }
          },
          required: ['prompt']
        }
      }
    );

    return new ReActAgent({
      llm: this.llm,
      tools: [getBalanceTool, getAuctionStateTool, placeBidTool, generateAdImageTool],
      verbose: true,
    });
  }

  async getUSDCBalance(): Promise<number> {
    const balance = await this.publicClient.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [this.wallet.account.address],
    });

    // USDC has 6 decimals
    return Number(balance) / 1_000_000;
  }

  async decideBidStrategy(adSpotId: string): Promise<void> {
    try {
      const balance = await this.getUSDCBalance();

      const refundContext = this.lastRefundAmount
        ? `\n\nIMPORTANT: You were just outbid! You received a refund of $${this.lastRefundAmount.toFixed(2)}. This means another agent bid higher than you. Analyze why you lost and adjust your strategy.`
        : '';

      const brandContext = this.brandIdentity
        ? `You are the marketing AI for ${this.brandIdentity.brandName}, representing ${this.brandIdentity.productName}.

Brand Identity:
- Product: ${this.brandIdentity.productName} - ${this.brandIdentity.productDescription}
- Industry: ${this.brandIdentity.industry}
- Target Audience: ${this.brandIdentity.targetAudience}
- Brand Personality: ${this.brandIdentity.brandPersonality}
- Marketing Angle: ${this.brandIdentity.marketingAngle}
- Visual Style: ${this.brandIdentity.visualStyle}

Your Mission: Win valuable ad space to promote ${this.brandIdentity.productName} and reach your target audience (${this.brandIdentity.targetAudience}).`
        : `You are ${this.agentName}, an autonomous advertising agent competing for ad space on a website.`;

      const prompt = `${brandContext}

Your Goal: Win the ad spot auction "${adSpotId}" by placing strategic marketing bids, then create a compelling ${this.brandIdentity ? this.brandIdentity.productName : 'advertisement'} image.

Available Tools:
1. get_my_balance - Check your USDC balance
2. get_auction_state - See current bid and auction status
3. place_bid - Place a bid for the ad spot (costs USDC on Base Sepolia testnet)
4. withdraw - Withdraw from auction if not worth continuing
5. generate_ad_image - Create your ad image after winning (costs ~$0.08 on Base mainnet)

Total Marketing Budget: $${this.maxBid.toFixed(2)} USDC
- Ad spot bidding: Up to ~$${(this.maxBid - 0.08).toFixed(2)} USDC (Base Sepolia testnet)
- Creative production: ~$0.08 USDC (Base mainnet - for winning ad image)
- Current wallet balance: $${balance.toFixed(2)} USDC

⚠️  IMPORTANT: Your TOTAL budget is $${this.maxBid.toFixed(2)}. If you win, you'll need ~$0.08 for image generation, so bid strategically to stay within budget!

Bidding Instructions:
1. Use get-auction-state to see the current auction status
2. Use get-my-balance to confirm your funds
3. Analyze the situation:
   - What's the current bid?
   - Who's winning?
   - How much time is left?
   - What's the bidding pattern?
4. Decide on a strategic bid amount and reasoning
5. Use place-bid to submit your bid
6. Provide a final strategic analysis of your actions and the outcome

Bidding Strategy Options:
- Start conservative to test the waters
- Jump high to intimidate competitors
- Bid just above minimum to save money
- Wait for the right moment
- Bluff with aggressive early bids
- Consider withdrawing if bid gets too high

${refundContext}

After Winning (if you win):
- You MUST call generate_ad_image to create your ${this.brandIdentity ? 'brand advertisement' : 'advertisement'}
${this.brandIdentity ? `- Follow your brand guidelines: ${this.brandIdentity.visualStyle}
- Emphasize: ${this.brandIdentity.marketingAngle}
- Appeal to: ${this.brandIdentity.targetAudience}
- Showcase your product: ${this.brandIdentity.productName}` : '- Be creative with your image prompt - this is your chance to shine!'}
- Your ad will be displayed on the website for all visitors to see
- This is a key marketing opportunity to ${this.brandIdentity ? `promote ${this.brandIdentity.productName} and build brand awareness` : 'attract attention'}

Think step by step and make your move!`;

      console.log(`\n🧠 [${this.agentName}] Starting AI reasoning...`);

      // Notify server that agent is actively thinking
      try {
        await axios.post(
          `${this.serverUrl}/api/agent-status/${adSpotId}`,
          {
            agentId: this.agentName,
            status: 'thinking',
            timestamp: new Date().toISOString(),
          }
        );
      } catch (error) {
        // Non-critical, continue even if this fails
      }

      const response = await this.bot.chat({ message: prompt });

      console.log(`\n✅ [${this.agentName}] AI decision complete`);
      console.log(response.response);

      // Check if agent decided NOT to bid (by looking for keywords in response)
      const decidedNotToBid = response.response.toLowerCase().includes('not to place') ||
        response.response.toLowerCase().includes('decided not to bid') ||
        response.response.toLowerCase().includes('not placing a bid') ||
        response.response.toLowerCase().includes('withdrawing from') ||
        response.response.toLowerCase().includes('accept this loss');

      if (decidedNotToBid) {
        console.log(`\n🏳️ [${this.agentName}] Decided to withdraw from auction`);

        // Request refund from server
        try {
          const refundResponse = await axios.post(
            `${this.serverUrl}/api/refund-request/${adSpotId}`,
            {
              agentId: this.agentName,
              walletAddress: this.wallet.account.address,
              reasoning: response.response,
            }
          );

          console.log(`✅ [${this.agentName}] Withdrawal processed:`, refundResponse.data.message);

          if (refundResponse.data.auctionEnded) {
            console.log(`🏁 [${this.agentName}] Auction has ended. Opponent won!`);
            this.isActive = false;
            this.stopRefundMonitoring();
            return;
          }
        } catch (error: any) {
          console.error(`❌ [${this.agentName}] Withdrawal failed:`, error.response?.data?.error || error.message);
        }
      } else {
        // Extract and send the reflection from the response
        const reflection = response.response;
        if (reflection && reflection.length > 50) {
          try {
            await axios.post(
              `${this.serverUrl}/api/bid/${adSpotId}/reflection`,
              {
                agentId: this.agentName,
                reflection: reflection,
              }
            );
            console.log(`📝 [${this.agentName}] Reflection submitted to server`);
          } catch (error: any) {
            console.error(`❌ [${this.agentName}] Failed to submit reflection:`, error.message);
          }
        }

        // Start monitoring for refunds after successful bid
        this.startRefundMonitoring(adSpotId);
      }

    } catch (error: any) {
      console.error(`❌ [${this.agentName}] AI reasoning error:`, error.message);

      // Fallback to simple bid if AI fails
      if (error.response?.status === 410) {
        console.log(`🏁 [${this.agentName}] Auction ended`);
        this.isActive = false;
        this.stopRefundMonitoring();
      }
    }
  }

  startRefundMonitoring(adSpotId: string) {
    if (this.monitoringInterval) {
      return;
    }

    console.log(`👀 [${this.agentName}] Monitoring for refunds...`);

    let previousBalance = 0;

    this.getUSDCBalance().then(balance => {
      previousBalance = balance;
    });

    this.monitoringInterval = setInterval(async () => {
      if (!this.isActive) {
        this.stopRefundMonitoring();
        return;
      }

      const currentBalance = await this.getUSDCBalance();

      if (currentBalance > previousBalance) {
        const refundAmount = currentBalance - previousBalance;
        this.lastRefundAmount = refundAmount;

        console.log(`\n🔔 [${this.agentName}] REFUND DETECTED: ${refundAmount.toFixed(2)} USDC`);
        console.log(`   I've been outbid! Time to reconsider my strategy... 🤔`);

        this.stopRefundMonitoring();

        // Wait random delay before AI re-evaluates
        const delay = Math.random() * (3000 - 1000) + 1000;
        console.log(`⏳ [${this.agentName}] Thinking for ${Math.floor(delay / 1000)}s...`);

        setTimeout(() => {
          if (this.isActive) {
            this.decideBidStrategy(adSpotId);
          }
        }, delay);
      }

      previousBalance = currentBalance;
    }, 2000);
  }

  stopRefundMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log(`🛑 [${this.agentName}] Stopped refund monitoring`);
    }
  }

  monitorAuctionEnd(adSpotId: string) {
    if (this.auctionEndMonitoringInterval) {
      return; // Already monitoring
    }

    console.log(`👀 [${this.agentName}] Monitoring for auction end...`);

    this.auctionEndMonitoringInterval = setInterval(async () => {
      try {
        // Get auction state
        const response = await axios.get(
          `${this.serverUrl}/api/status?adSpotId=${adSpotId}`
        );
        const state = response.data;

        // Check if auction ended and this agent won
        if (state.auctionEnded && state.currentWinner?.agentId === this.agentName) {
          // Check if we already generated an image
          if (!state.winnerAdImage?.url) {
            console.log(`\n🎉 [${this.agentName}] WE WON THE AUCTION! Generating ad image...`);

            // Stop all monitoring
            this.stopRefundMonitoring();
            this.stopAuctionEndMonitoring();

            // Ask LLM to generate creative prompt and call generate_ad_image tool
            const brandGuidedPrompt = this.brandIdentity
              ? `🎉 CONGRATULATIONS! You just won the ad spot auction "${adSpotId}" for ${this.brandIdentity.brandName}!

Now it's time to create a compelling advertisement for ${this.brandIdentity.productName} that will be displayed on the website.

Your Brand Guidelines:
- Product: ${this.brandIdentity.productName} - ${this.brandIdentity.productDescription}
- Target Audience: ${this.brandIdentity.targetAudience}
- Brand Personality: ${this.brandIdentity.brandPersonality}
- Marketing Angle: ${this.brandIdentity.marketingAngle}
- Visual Style: ${this.brandIdentity.visualStyle}
- Key Messages: ${this.brandIdentity.keyMessages.join(', ')}

Your task:
1. Create an advertisement concept that embodies your brand personality and appeals to your target audience
2. Craft a detailed image generation prompt that includes:
   - Your product (${this.brandIdentity.productName})
   - Visual style matching your brand (${this.brandIdentity.visualStyle})
   - Elements that convey your marketing angle (${this.brandIdentity.marketingAngle})
   - Atmosphere that resonates with ${this.brandIdentity.targetAudience}
3. Call the generate_ad_image tool with your brand-aligned creative prompt

Make it authentic to ${this.brandIdentity.brandName}! This ad should clearly communicate what ${this.brandIdentity.productName} is and why your target audience should care.`
              : `🎉 CONGRATULATIONS! You just won the ad spot auction "${adSpotId}"!

Now it's time to create an amazing advertisement image that will be displayed on the website for all visitors to see.

Your task:
1. Think of a creative, eye-catching concept for your ad image
2. Create a detailed, descriptive prompt for the image generation AI
3. Call the generate_ad_image tool with your creative prompt

Make it memorable! This is your chance to showcase your brand and creativity to the world.

Example prompts for inspiration:
- "A futuristic tech startup office with holographic displays showing data visualizations, diverse team collaborating happily, bright natural lighting, professional photography style"
- "An eco-friendly bamboo product floating in a lush green rainforest with morning mist and sunbeams, product photography, high detail"
- "A sleek luxury sports car driving through a neon-lit cyberpunk city at night with wet reflections on the street, cinematic lighting"

Be creative and specific! What will your winning ad look like?`;

            const prompt = brandGuidedPrompt;

            const response = await this.bot.chat({ message: prompt });
            console.log(`✨ [${this.agentName}] Image generation response:`, response.response);

            this.isActive = false;
          }
        }
      } catch (error: any) {
        console.error(`❌ [${this.agentName}] Error monitoring auction end:`, error.message);
      }
    }, 5000); // Check every 5 seconds
  }

  stopAuctionEndMonitoring() {
    if (this.auctionEndMonitoringInterval) {
      clearInterval(this.auctionEndMonitoringInterval);
      this.auctionEndMonitoringInterval = null;
      console.log(`🛑 [${this.agentName}] Stopped auction end monitoring`);
    }
  }

  async start(adSpotId: string) {
    console.log(`\n🚀 [${this.agentName}] Starting intelligent bidding for ${adSpotId}`);

    const balance = await this.getUSDCBalance();
    console.log(`💵 [${this.agentName}] Initial balance: ${balance.toFixed(2)} USDC`);

    // Start monitoring for auction end (to auto-generate image when winning)
    this.monitorAuctionEnd(adSpotId);

    await this.decideBidStrategy(adSpotId);
  }

  stop() {
    console.log(`🛑 [${this.agentName}] Stopping agent...`);
    this.isActive = false;
    this.stopRefundMonitoring();
    this.stopAuctionEndMonitoring();
  }
}

