import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { createWalletClient, http, publicActions, createPublicClient } from 'viem';
import { privateKeyToAccount, toAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Hex } from 'viem';
import { Anthropic } from '@llamaindex/anthropic';
import { FunctionTool, ReActAgent } from 'llamaindex';
import { z } from 'zod';
import { CdpClient } from '@coinbase/cdp-sdk';
import { CrossmintWalletAdapter } from '../../lib/wallet-adapters';
import { WalletHelper } from './wallet-helper';
import { Logger } from './logger';
import { AuctionMonitor } from './auction-monitor';

type WalletType = 'privateKey' | 'cdp' | 'crossmint';

export interface BrandIdentity {
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

export class IntelligentBiddingAgent {
  protected wallet: any; // viem account (LocalAccount from toAccount() or wallet client)
  protected walletType: WalletType;
  protected walletConfig: any; // Config for async wallet initialization
  protected walletHelper!: WalletHelper; // Initialized in start()
  protected logger: Logger;
  protected auctionMonitor: AuctionMonitor;
  protected axiosWithPayment: any;
  protected agentName: string;
  protected maxBid: number;
  protected serverUrl: string;
  protected isActive: boolean = true;
  protected publicClient;
  protected llm;
  protected bot!: ReActAgent; // Initialized in start()
  protected bidHistory: BidContext['bidHistory'] = [];
  protected lastRefundAmount?: number;
  protected brandIdentity?: BrandIdentity;
  protected currentAdSpotId: string = '';
  protected lastBidAmount: number = 0;
  protected isInAIReasoning: boolean = false;
  protected refundPending: boolean = false;

  constructor(config: {
    walletType: WalletType;
    privateKey?: Hex;
    cdpWalletId?: string;
    crossmintApiKey?: string;
    crossmintWalletLocator?: string;
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
    this.walletType = config.walletType;

    // Initialize Logger
    this.logger = new Logger(config.agentName, false);

    // Initialize AuctionMonitor
    this.auctionMonitor = new AuctionMonitor();

    // Wallet will be initialized asynchronously in start()
    this.wallet = null;

    // Create public client for reading balances (Base Sepolia)
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Initialize LLM
    this.llm = new Anthropic({
      apiKey: config.anthropicApiKey,
      model: 'claude-4-5-sonnet',
    });

    // Store config for later wallet initialization
    this.walletConfig = config;

    this.logger.thinking('Initialized with AI reasoning');
    this.logger.info(`Wallet Type: ${this.walletType}`);
  }

  private async initializeWallet(config: any) {
    switch (config.walletType) {
      case 'privateKey':
        if (!config.privateKey) {
          throw new Error('Private key required for privateKey wallet type');
        }
        return createWalletClient({
          chain: baseSepolia,
          transport: http(),
          account: privateKeyToAccount(config.privateKey),
        }).extend(publicActions);

      case 'cdp':
        // Use CDP SDK with toAccount() for proper x402 compatibility
        console.log('🔑 Initializing CDP client...');
        console.log(`   API Key ID: ${process.env.CDP_API_KEY_ID?.slice(0, 8)}...`);
        console.log(`   API Key Secret: ${process.env.CDP_API_KEY_SECRET?.length} chars`);
        console.log(`   Wallet Secret: ${process.env.CDP_WALLET_SECRET?.length} chars`);

        const cdpClient = new CdpClient({
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
          walletSecret: process.env.CDP_WALLET_SECRET,
          debugging: true,
        } as any);

        // Get or create account
        const accountName = config.cdpWalletId || `agent-${Date.now()}`;
        console.log(`Getting or creating CDP account: ${accountName}...`);
        const cdpAccount = await cdpClient.evm.getOrCreateAccount({ name: accountName });
        console.log(`✅ CDP account ready: ${accountName}`);
        console.log(`   Address: ${cdpAccount.address}`);

        // Convert to viem-compatible account (this makes it work with x402-axios)
        return toAccount(cdpAccount);

      case 'crossmint':
        if (!config.crossmintApiKey || !config.crossmintWalletLocator) {
          throw new Error('Crossmint API key and wallet locator required for Crossmint wallet type');
        }
        return new CrossmintWalletAdapter(config.crossmintApiKey, config.crossmintWalletLocator);

      default:
        throw new Error(`Unknown wallet type: ${config.walletType}`);
    }
  }

  private async logWalletAddress() {
    try {
      const address = await this.walletHelper.getAddress();
      this.logger.info(`Wallet Address: ${address}`);
    } catch (error) {
      this.logger.error('Could not retrieve wallet address', error);
    }
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
      async (input: { adSpotId?: string }) => {
        // Use the provided adSpotId or fall back to current ad spot
        const adSpotId = input.adSpotId || this.currentAdSpotId;
        console.log(`\n🔍 [${this.agentName}] ⚡ TOOL ACTUALLY CALLED: get_auction_state`);
        console.log(`🔍 [${this.agentName}] Fetching auction state for ${adSpotId}...`);
        try {
          const response = await axios.get(
            `${this.serverUrl}/api/status?adSpotId=${encodeURIComponent(adSpotId)}`
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
        description: 'Returns the current state of the auction including current bid, winner, time remaining, and bid history. The adSpotId parameter is optional - if not provided, uses the current auction.',
        parameters: {
          type: 'object',
          properties: {
            adSpotId: {
              type: 'string',
              description: 'The adSpotId being auctioned (optional)',
            },
          },
          required: [],
        },
      }
    );

    const placeBidTool = FunctionTool.from(
      async (input: { adSpotId?: string; proposedAmount: number; reasoning: string }) => {
        try {
          // Use the provided adSpotId or fall back to current ad spot
          const adSpotId = input.adSpotId || this.currentAdSpotId;

          // BUDGET VALIDATION: Check if bid exceeds maximum budget
          if (input.proposedAmount > this.maxBid) {
            console.log(`❌ [${this.agentName}] Bid ${input.proposedAmount.toFixed(2)} exceeds max budget ${this.maxBid.toFixed(2)}`);
            return JSON.stringify({
              success: false,
              overBudget: true,
              proposedAmount: input.proposedAmount,
              maxAllowedBid: this.maxBid,
              totalBudget: this.maxBid,
              message: `Your proposed bid of $${input.proposedAmount.toFixed(2)} exceeds your maximum budget of $${this.maxBid.toFixed(2)}. You must EITHER bid less OR use the withdraw tool to exit the auction.`
            });
          }

          console.log(`\n💭 [${this.agentName}] Thinking: ${input.reasoning}`);
          console.log(`💰 [${this.agentName}] Proposing bid: $${input.proposedAmount.toFixed(2)}`);
          console.log(`🌐 [${this.agentName}] Sending to: ${this.serverUrl}/api/bid/${adSpotId}`);

          // First request with proposed bid (no payment yet)
          const response = await this.axiosWithPayment.post(
            `${this.serverUrl}/api/bid/${adSpotId}`,
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
            // Track the bid amount we just placed
            this.lastBidAmount = response.data.currentBid;

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
        description: 'CRITICAL: This tool MUST be executed to actually place a bid. Do NOT simulate or guess the response. This makes a real HTTP request with payment to place your bid on the blockchain. Returns one of: 1) success=true if bid accepted, 2) proposalRejected=true if your amount is too low (you MUST bid higher or withdraw), 3) overBudget=true if you exceeded your max budget (you MUST withdraw using the withdraw tool), 4) needsNegotiation=true if payment is required. ALWAYS check the actual response and adjust accordingly. If you get overBudget or cannot afford to continue, you MUST call the withdraw tool to exit gracefully. The adSpotId parameter is optional - if not provided, uses the current auction.',
        parameters: {
          type: 'object',
          properties: {
            adSpotId: {
              type: 'string',
              description: 'The adSpotId to bid on (optional)',
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
          required: ['proposedAmount', 'reasoning'],
        },
      }
    );

    const withdrawTool = FunctionTool.from(
      async (input: { adSpotId?: string; reason?: string }) => {
        try {
          const adSpotId = input.adSpotId || this.currentAdSpotId;
          const reason = input.reason || 'Decided to withdraw from auction';

          console.log(`\n🏳️ [${this.agentName}] ⚡ TOOL ACTUALLY CALLED: withdraw`);
          console.log(`🏳️ [${this.agentName}] Withdrawing from auction: ${reason}`);

          const walletAddress = await this.walletHelper.getAddress();

          const response = await axios.post(
            `${this.serverUrl}/api/refund-request/${adSpotId}`,
            {
              agentId: this.agentName,
              walletAddress,
              reasoning: reason,
            }
          );

          const result = {
            success: true,
            data: {
              refunded: response.data.refunded,
              transactionHash: response.data.transactionHash,
              auctionEnded: response.data.auctionEnded,
              message: response.data.message,
            }
          };

          console.log(`✅ [${this.agentName}] Withdrawal result:`, JSON.stringify(result));

          // If auction ended, stop monitoring
          if (response.data.auctionEnded) {
            this.isActive = false;
            this.stopRefundMonitoring();
          }

          return JSON.stringify(result);
        } catch (error: any) {
          console.error(`❌ [${this.agentName}] Withdrawal failed:`, error.response?.data?.error || error.message);
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
      {
        name: 'withdraw',
        description: 'Withdraw from the auction and request a refund of your last bid. Use this when you cannot or do not want to continue bidding (e.g., insufficient balance, bid too high, strategic decision). Returns refund details and whether the auction ended. The adSpotId parameter is optional - if not provided, uses the current auction.',
        parameters: {
          type: 'object',
          properties: {
            adSpotId: {
              type: 'string',
              description: 'The adSpotId to withdraw from (optional)',
            },
            reason: {
              type: 'string',
              description: 'Your reason for withdrawing (optional)',
            },
          },
          required: [],
        },
      }
    );

    // Create bidding agent with all tools including withdraw
    const tools = [getBalanceTool, getAuctionStateTool, placeBidTool, withdrawTool];
    const agent = new ReActAgent({
      llm: this.llm,
      tools,
      verbose: true,
    });

    console.log(`[${this.agentName}] ReActAgent created with ${tools.length} tools`);

    return agent;
  }

  async getUSDCBalance(): Promise<number> {
    return await this.walletHelper.getUSDCBalance();
  }

  private buildPrompt(balance: number, adSpotId: string): string {
    const walletContext = this.brandIdentity
      ? `You represent ${this.brandIdentity.brandName} wallet platform.

Platform: ${this.brandIdentity.productName}
Key Features: ${this.brandIdentity.keyMessages.join(', ')}
Goal: Win ad space to showcase ${this.brandIdentity.productName} capabilities.`
      : `You are ${this.agentName}, demonstrating wallet integration with x402 protocol.`;

    const refundAlert = this.lastRefundAmount
      ? `\n\n🚨 OUTBID: Refund of $${this.lastRefundAmount.toFixed(2)} received. Re-evaluate NOW!`
      : '';

    return `${walletContext}

Auction: "${adSpotId}"
Budget: $${this.maxBid.toFixed(2)} USDC
Balance: $${balance.toFixed(2)} USDC

Tools:
1. get_my_balance - Check USDC balance
2. get_auction_state - View auction status
3. place_bid - Submit bid (amount, reasoning)
4. withdraw - Exit auction

${balance === 0
  ? '⛔ 0 USDC - Call withdraw tool immediately with reason "Insufficient balance"'
  : `Instructions:
1. Call get_auction_state to analyze current situation
2. Call get_my_balance to confirm funds
3. Decide: place_bid (if competitive) OR withdraw (if too expensive)
4. Handle responses:
   - overBudget=true → MUST call withdraw tool
   - proposalRejected=true → Bid higher or withdraw
   - success=true → Bid accepted`}${refundAlert}

Make your move!`;
  }

  async decideBidStrategy(adSpotId: string): Promise<void> {
    try {
      // Clear refund pending flag at start of new decision
      this.refundPending = false;
      this.isInAIReasoning = true;

      const balance = await this.getUSDCBalance();

      // PROACTIVE CHECK: If balance is 0, automatically withdraw without AI
      if (balance === 0) {
        console.log(`\n⚠️  [${this.agentName}] Balance is 0 USDC - cannot participate in auction`);
        console.log(`🏳️ [${this.agentName}] Checking for withdrawal eligibility...`);

        try {
          const walletAddress = await this.walletHelper.getAddress();

          const refundResponse = await axios.post(
            `${this.serverUrl}/api/refund-request/${adSpotId}`,
            {
              agentId: this.agentName,
              walletAddress,
              reasoning: `Agent has 0 USDC balance and cannot participate in bidding.`,
            }
          );

          if (refundResponse.data.refunded > 0) {
            console.log(`✅ [${this.agentName}] Withdrawal completed: ${refundResponse.data.message}`);
          } else {
            console.log(`ℹ️  [${this.agentName}] ${refundResponse.data.message}`);
          }

          if (refundResponse.data.auctionEnded) {
            console.log(`🏁 [${this.agentName}] Auction has ended. Opponent won!`);
          }

          this.isActive = false;
          this.stopRefundMonitoring();
          return;
        } catch (error: any) {
          // If withdrawal check fails, log the error and proceed to AI
          // which will handle the zero balance situation appropriately
          console.log(`ℹ️  [${this.agentName}] Withdrawal check failed:`, error.response?.data?.error || error.message);
          console.log(`   Proceeding with AI decision (AI will handle zero balance)...`);
        }
      }

      // START monitoring BEFORE the AI chat begins
      // This ensures we catch refunds that arrive during reflection
      await this.startRefundMonitoring(adSpotId);

      const prompt = this.buildPrompt(balance, adSpotId);

      console.log(`\n🧠 [${this.agentName}] Starting AI reasoning...`);
      console.log(`📝 [${this.agentName}] Agent type: ${this.bot.constructor.name}`);

      const response = await this.bot.chat({ message: prompt });

      console.log(`\n✅ [${this.agentName}] AI decision complete`);
      console.log(response.response);

      // Clear the refund flag after AI processes it
      if (this.lastRefundAmount) {
        this.lastRefundAmount = undefined;
      }

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
          // Silently ignore 404s (auction not started yet or bid not found)
          if (error.response?.status !== 404) {
            console.error(`❌ [${this.agentName}] Failed to submit reflection:`, error.message);
          }
        }
      }

      // Monitoring already started before AI chat
      // No need to start again here

    } catch (error: any) {
      console.error(`❌ [${this.agentName}] AI reasoning error:`, error.message);

      // Fallback to simple bid if AI fails
      if (error.response?.status === 410) {
        console.log(`🏁 [${this.agentName}] Auction ended`);
        this.isActive = false;
        this.stopRefundMonitoring();
      }
    } finally {
      // Mark that we're done with AI reasoning
      this.isInAIReasoning = false;

      // Check if a refund arrived while we were thinking
      if (this.refundPending && this.isActive) {
        console.log(`\n⚡ [${this.agentName}] Refund was received during analysis! Immediately re-evaluating...`);
        this.refundPending = false;

        // Immediately re-evaluate without delay since we were outbid
        setImmediate(() => {
          if (this.isActive) {
            this.decideBidStrategy(this.currentAdSpotId);
          }
        });
      }
    }
  }

  async startRefundMonitoring(adSpotId: string) {
    await this.auctionMonitor.startRefundMonitoring(
      () => this.getUSDCBalance(),
      async (refundAmount) => {
        // Check if still winning
        try {
          const response = await axios.get(`${this.serverUrl}/api/status?adSpotId=${adSpotId}`);
          const currentWinner = response.data.currentWinner?.agentId || response.data.currentWinner;

          if (currentWinner === this.agentName) {
            console.log(`   ✅ [${this.agentName}] Still winning - refund from own bid upgrade`);
            return;
          }

          // Outbid - trigger re-evaluation
          this.lastRefundAmount = refundAmount;

          if (this.isInAIReasoning) {
            console.log(`   ⚠️  [${this.agentName}] Refund during analysis - will respond after!`);
            this.refundPending = true;
          } else {
            const delay = Math.random() * (3000 - 1000) + 1000;
            console.log(`⏳ [${this.agentName}] Thinking for ${Math.floor(delay / 1000)}s...`);
            setTimeout(() => {
              if (this.isActive) {
                this.decideBidStrategy(adSpotId);
              }
            }, delay);
          }
        } catch (error) {
          console.error(`❌ [${this.agentName}] Failed to check auction state:`, error);
        }
      },
      this.agentName
    );
  }

  stopRefundMonitoring() {
    this.auctionMonitor.stop();
  }

  monitorAuctionEnd(adSpotId: string) {
    this.auctionMonitor.startAuctionEndMonitoring(
      this.serverUrl,
      adSpotId,
      (winner, finalBid) => {
        this.isActive = false;
      },
      this.agentName
    );
  }

  stopAuctionEndMonitoring() {
    this.auctionMonitor.stop();
  }

  async start(adSpotId: string) {
    this.logger.info(`Starting intelligent bidding for ${adSpotId}`);
    this.currentAdSpotId = adSpotId;

    // Initialize wallet asynchronously (CDP wallet needs async initialization)
    this.wallet = await this.initializeWallet(this.walletConfig);

    // Initialize WalletHelper after wallet is ready
    this.walletHelper = new WalletHelper(this.wallet, this.walletType, this.publicClient);
    await this.logWalletAddress();

    // Create axios client with x402 payment interceptor
    this.axiosWithPayment = withPaymentInterceptor(
      axios.create({
        headers: { 'X-Agent-ID': this.agentName }
      }),
      this.wallet as any
    );

    // Create agent with tools (now that axiosWithPayment is ready)
    this.bot = this.createAgent();

    const balance = await this.getUSDCBalance();
    this.logger.info(`Initial balance: ${balance.toFixed(2)} USDC`);

    // Start monitoring for auction end
    this.monitorAuctionEnd(adSpotId);

    await this.decideBidStrategy(adSpotId);
  }

  stop() {
    this.logger.info('Stopping agent...');
    this.isActive = false;
    this.auctionMonitor.stop();
  }
}

