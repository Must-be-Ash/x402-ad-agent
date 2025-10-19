'use client';

import { useEffect, useState, useMemo } from 'react';
import TerminalPanel from '@/app/components/TerminalPanel';

interface StreamingMessage {
  id: string;
  type: 'agent_started' | 'scraping_started' | 'scraping_completed' | 'analytics_payment' | 'analytics_received' |
        'analysis_started' | 'analysis_completed' | 'thinking' | 'bid' | 'reflection' |
        'refund' | 'withdrawal' | 'agent_skipped' | 'agent_error' | 'auction_ended' | 'ad_image_ready' | 'image_generation_update';
  agentId?: string;
  timestamp: string;
  // Agent started fields
  availableSpots?: string[];
  brandName?: string;
  productName?: string;
  // Scraping fields
  url?: string;
  contentLength?: number;
  contentPreview?: string;
  siteTitle?: string;
  topics?: string[];
  paymentMethod?: string;
  expectedCost?: string;
  // Analytics fields
  amount?: string | number;
  site?: {
    monthlyVisits: number;
    dailyAverage: number;
    avgSessionDuration: string;
    bounceRate: string;
  };
  monthlyVisits?: number;
  audience?: string;
  adSpots?: Array<{
    id: string;
    name: string;
    impressions: number;
    clickThroughRate: string;
    estimatedClicks: number;
    averageBid: string;
  }>;
  analysisContext?: {
    siteTopics: string[];
    monthlyVisits: number;
    audience: string;
    availableSpots: string[];
    walletBalance: number;
  };
  // Analysis fields
  shouldBid?: boolean;
  relevanceScore?: number;
  reasoning?: string;
  targetSpots?: string[];
  budgetPerSpot?: { [key: string]: number };
  strategy?: string;
  // Bidding fields
  thinking?: string;
  proposedAmount?: number;
  transactionHash?: string;
  reflection?: string;
  refundAmount?: number;
  // Image generation fields
  status?: string;
  message?: string;
  imageUrl?: string;
  taskId?: string;
  // Skip fields
  adSpotId?: string;
  // Error fields
  phase?: string;
  error?: string;
  // Auction end fields
  winner?: { agentId: string; address?: string };
  finalBid?: number;
  endReason?: string;
  isLoading?: boolean;
}

export default function AnalyticalAgentsPage() {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);

  useEffect(() => {
    const eventSources: EventSource[] = [];
    const reconnectTimeouts: NodeJS.Timeout[] = [];

    const connect = (adSpotId: string) => {
      const eventSource = new EventSource(`/api/stream/${encodeURIComponent(adSpotId)}`);

      eventSource.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);

        // Create a unique ID for each message
        const msgId = `${data.agentId || 'system'}-${data.type}-${Date.now()}-${Math.random()}`;

        switch (data.type) {
          case 'agent_started':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'agent_started',
              agentId: data.agentId,
              timestamp: data.timestamp,
              availableSpots: data.availableSpots,
              brandName: data.brandName,
              productName: data.productName,
            }]);
            break;

          case 'scraping_started':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'scraping_started',
              agentId: data.agentId,
              timestamp: data.timestamp,
              url: data.url,
              paymentMethod: data.paymentMethod,
              expectedCost: data.expectedCost,
            }]);
            break;

          case 'scraping_completed':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'scraping_completed',
              agentId: data.agentId,
              timestamp: data.timestamp,
              url: data.url,
              contentLength: data.contentLength,
              contentPreview: data.contentPreview,
              siteTitle: data.siteTitle,
              topics: data.topics,
            }]);
            break;

          case 'analytics_payment':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'analytics_payment',
              agentId: data.agentId,
              timestamp: data.timestamp,
              amount: data.amount,
              paymentMethod: data.paymentMethod,
            }]);
            break;

          case 'analytics_received':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'analytics_received',
              agentId: data.agentId,
              timestamp: data.timestamp,
              site: data.site,
              audience: data.audience,
              adSpots: data.adSpots,
            }]);
            break;

          case 'analysis_started':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'analysis_started',
              agentId: data.agentId,
              timestamp: data.timestamp,
              analysisContext: data.analysisContext,
            }]);
            break;

          case 'analysis_completed':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'analysis_completed',
              agentId: data.agentId,
              timestamp: data.timestamp,
              shouldBid: data.shouldBid,
              relevanceScore: data.relevanceScore,
              reasoning: data.reasoning,
              targetSpots: data.targetSpots,
              budgetPerSpot: data.budgetPerSpot,
              strategy: data.strategy,
            }]);
            break;

          case 'thinking':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'thinking',
              agentId: data.agentId,
              timestamp: data.timestamp,
              thinking: data.thinking,
              proposedAmount: data.proposedAmount,
            }]);
            break;

          case 'bid_placed':
            setMessages(prev => {
              const bidExists = prev.some(msg =>
                msg.type === 'bid' &&
                msg.agentId === data.agentId &&
                msg.transactionHash === data.transactionHash
              );

              if (bidExists) return prev;

              return [...prev, {
                id: msgId,
                type: 'bid',
                agentId: data.agentId,
                timestamp: data.timestamp,
                amount: parseFloat(data.amount),
                transactionHash: data.transactionHash,
                isLoading: true,
              }];
            });
            break;

          case 'reflection':
            setMessages(prev => prev.map(msg => {
              if (msg.type === 'bid' && msg.agentId === data.agentId && msg.isLoading) {
                return {
                  ...msg,
                  reflection: data.reflection,
                  isLoading: false,
                };
              }
              return msg;
            }));
            break;

          case 'refund':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'refund',
              agentId: data.agentId,
              timestamp: data.timestamp,
              refundAmount: data.amount,
              transactionHash: data.transactionHash,
            }]);
            break;

          case 'withdrawal':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'withdrawal',
              agentId: data.agentId,
              timestamp: data.timestamp,
              refundAmount: data.amount,
              reasoning: data.reasoning,
              transactionHash: data.transactionHash,
            }]);
            break;

          case 'agent_skipped':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'agent_skipped',
              agentId: data.agentId,
              timestamp: data.timestamp,
              reasoning: data.reasoning,
              adSpotId: data.adSpotId,
            }]);
            break;

          case 'agent_error':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'agent_error',
              agentId: data.agentId,
              timestamp: data.timestamp,
              phase: data.phase,
              error: data.error,
            }]);
            break;

          case 'auction_ended':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'auction_ended',
              timestamp: data.timestamp,
              winner: data.winner,
              finalBid: data.finalBid,
              endReason: data.reason,
            }]);
            break;

          case 'image_generation_update':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'image_generation_update',
              timestamp: data.timestamp || new Date().toISOString(),
              agentId: data.agentId,
              status: data.status,
              message: data.message,
              imageUrl: data.imageUrl,
              taskId: data.taskId,
            }]);
            break;

          case 'ad_image_ready':
            setMessages(prev => [...prev, {
              id: msgId,
              type: 'ad_image_ready',
              timestamp: data.timestamp || new Date().toISOString(),
              agentId: data.winner?.agentId,
              imageUrl: data.imageUrl,
            }]);
            break;
        }
      });

      eventSource.onerror = () => {
        console.log(`SSE connection lost for ${adSpotId}, reconnecting in 3s...`);
        eventSource?.close();
        const timeout = setTimeout(() => connect(adSpotId), 3000);
        reconnectTimeouts.push(timeout);
      };

      eventSources.push(eventSource);
    };

    // Connect to both ad spots
    connect('prime-banner');
    connect('sidebar-secondary');

    return () => {
      eventSources.forEach(es => es.close());
      reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Convert streaming messages to terminal logs
  const messageToTerminalLog = (msg: StreamingMessage) => {
    const logs: Array<{
      timestamp: string;
      type: 'info' | 'success' | 'payment' | 'error' | 'tool' | 'thinking';
      icon: string;
      message: string;
      details?: string;
      link?: { href: string; label: string };
    }> = [];

    switch (msg.type) {
      case 'agent_started':
        logs.push({
          timestamp: msg.timestamp,
          type: 'info',
          icon: '🚀',
          message: 'AGENT STARTED',
          details: `Brand: ${msg.brandName}\nProduct: ${msg.productName}\nTargeting: ${msg.availableSpots?.join(', ')}`,
        });
        break;

      case 'scraping_started':
        logs.push({
          timestamp: msg.timestamp,
          type: 'payment',
          icon: '💳',
          message: `x402 PAYMENT: ${msg.expectedCost || 'USDC'}`,
          details: `Service: Firecrawl Web Scraping\nTarget: ${msg.url}`,
        });
        break;

      case 'scraping_completed':
        logs.push({
          timestamp: msg.timestamp,
          type: 'success',
          icon: '✓',
          message: 'SITE DATA RECEIVED',
          details: `Title: ${msg.siteTitle}\nLength: ${msg.contentLength?.toLocaleString()} chars\nTopics: ${msg.topics?.join(', ')}\n\nPreview:\n${msg.contentPreview}`,
        });
        break;

      case 'analytics_payment':
        logs.push({
          timestamp: msg.timestamp,
          type: 'payment',
          icon: '💳',
          message: `x402 PAYMENT: ${msg.amount}`,
          details: `Service: Site Analytics API\nMethod: ${msg.paymentMethod}`,
        });
        break;

      case 'analytics_received':
        const adSpotsInfo = msg.adSpots?.map(spot =>
          `  • ${spot.name}: ${spot.impressions.toLocaleString()} impr/mo, ${spot.clickThroughRate} CTR, ${spot.estimatedClicks.toLocaleString()} clicks, avg bid ${spot.averageBid}`
        ).join('\n') || '';

        logs.push({
          timestamp: msg.timestamp,
          type: 'success',
          icon: '📊',
          message: 'FULL ANALYTICS RECEIVED',
          details: `Monthly Visits: ${msg.site?.monthlyVisits.toLocaleString()}\nDaily Average: ${msg.site?.dailyAverage.toLocaleString()}\nSession Duration: ${msg.site?.avgSessionDuration}\nBounce Rate: ${msg.site?.bounceRate}\nAudience: ${msg.audience}\n\nAd Spots:\n${adSpotsInfo}`,
        });
        break;

      case 'analysis_started':
        logs.push({
          timestamp: msg.timestamp,
          type: 'thinking',
          icon: '🧠',
          message: 'AI ANALYSIS STARTED',
          details: msg.analysisContext ?
            `Analyzing Data:\n• Topics: ${msg.analysisContext.siteTopics.join(', ')}\n• Monthly Visits: ${msg.analysisContext.monthlyVisits.toLocaleString()}\n• Audience: ${msg.analysisContext.audience}\n• Available Spots: ${msg.analysisContext.availableSpots.join(', ')}\n• Wallet Balance: $${msg.analysisContext.walletBalance.toFixed(2)} USDC` :
            'Evaluating relevance, ROI, and budget allocation...',
        });
        break;

      case 'analysis_completed':
        logs.push({
          timestamp: msg.timestamp,
          type: msg.shouldBid ? 'success' : 'info',
          icon: msg.shouldBid ? '✓' : '⊘',
          message: msg.shouldBid ? 'DECISION: BID' : 'DECISION: SKIP',
          details: `Relevance: ${msg.relevanceScore}/10\n${msg.reasoning}\n\nStrategy: ${msg.strategy}${
            msg.targetSpots && msg.targetSpots.length > 0
              ? `\n\nTarget Spots: ${msg.targetSpots.join(', ')}\nBudget: ${Object.entries(msg.budgetPerSpot || {}).map(([spot, amount]) => `${spot}: $${amount}`).join(', ')}`
              : ''
          }`,
        });
        break;

      case 'thinking':
        logs.push({
          timestamp: msg.timestamp,
          type: 'thinking',
          icon: '💭',
          message: 'STRATEGIC THINKING',
          details: msg.thinking,
        });
        if (msg.proposedAmount) {
          logs.push({
            timestamp: msg.timestamp,
            type: 'info',
            icon: '💰',
            message: `PROPOSED BID: $${msg.proposedAmount.toFixed(2)} USDC`,
          });
        }
        break;

      case 'bid':
        const bidAmount = typeof msg.amount === 'number' ? msg.amount : parseFloat(msg.amount || '0');
        logs.push({
          timestamp: msg.timestamp,
          type: 'payment',
          icon: '💳',
          message: 'INITIATING x402 PAYMENT',
          details: `Amount: $${bidAmount.toFixed(2)} USDC`,
        });
        logs.push({
          timestamp: msg.timestamp,
          type: 'success',
          icon: '✓',
          message: `BID PLACED: $${bidAmount.toFixed(2)} USDC`,
          link: msg.transactionHash ? {
            href: `https://sepolia.basescan.org/tx/${msg.transactionHash}`,
            label: 'View transaction on Basescan'
          } : undefined,
        });
        if (msg.reflection) {
          logs.push({
            timestamp: msg.timestamp,
            type: 'info',
            icon: '📝',
            message: 'POST-BID ANALYSIS',
            details: msg.reflection,
          });
        }
        break;

      case 'refund':
        logs.push({
          timestamp: msg.timestamp,
          type: 'payment',
          icon: '💸',
          message: `REFUND RECEIVED: $${msg.refundAmount?.toFixed(2)} USDC`,
          details: 'Outbid by competitor. Re-evaluating...',
          link: msg.transactionHash ? {
            href: `https://sepolia.basescan.org/tx/${msg.transactionHash}`,
            label: 'View refund transaction'
          } : undefined,
        });
        break;

      case 'withdrawal':
        logs.push({
          timestamp: msg.timestamp,
          type: 'info',
          icon: '🏳️',
          message: 'WITHDRAWING',
          details: msg.reasoning,
          link: msg.transactionHash ? {
            href: `https://sepolia.basescan.org/tx/${msg.transactionHash}`,
            label: 'View refund transaction'
          } : undefined,
        });
        break;

      case 'agent_skipped':
        logs.push({
          timestamp: msg.timestamp,
          type: 'info',
          icon: '⊘',
          message: `SKIPPING AD SPOT: ${msg.adSpotId}`,
          details: msg.reasoning,
        });
        break;

      case 'agent_error':
        logs.push({
          timestamp: msg.timestamp,
          type: 'error',
          icon: '❌',
          message: `ERROR IN ${msg.phase?.toUpperCase()} PHASE`,
          details: msg.error,
        });
        break;

      case 'image_generation_update':
        const statusIcons = {
          started: '🎨',
          progress: '⏳',
          completed: '✅',
          failed: '❌'
        };
        const statusTypes = {
          started: 'info' as const,
          progress: 'tool' as const,
          completed: 'success' as const,
          failed: 'error' as const
        };
        logs.push({
          timestamp: msg.timestamp,
          type: statusTypes[msg.status as keyof typeof statusTypes] || 'info',
          icon: statusIcons[msg.status as keyof typeof statusIcons] || '🎨',
          message: msg.status === 'started' ? 'GENERATING AD IMAGE' :
                   msg.status === 'progress' ? 'IMAGE GENERATION IN PROGRESS' :
                   msg.status === 'completed' ? 'AD IMAGE GENERATED' :
                   'IMAGE GENERATION FAILED',
          details: msg.message,
        });
        break;

      case 'ad_image_ready':
        logs.push({
          timestamp: msg.timestamp,
          type: 'success',
          icon: '🎨',
          message: 'AD IMAGE READY',
          details: 'Creative assets ready. Ad is now live!',
        });
        break;

      case 'auction_ended':
        logs.push({
          timestamp: msg.timestamp,
          type: msg.winner?.agentId === msg.agentId ? 'success' : 'info',
          icon: msg.winner?.agentId === msg.agentId ? '🏆' : '🏁',
          message: msg.winner?.agentId === msg.agentId ? 'AUCTION WON!' : 'AUCTION ENDED',
          details: `${msg.endReason}\nFinal Bid: $${msg.finalBid?.toFixed(2)}`,
        });
        break;
    }

    return logs;
  };

  // Split messages by agent
  const { coinbaseLogs, crossmintLogs } = useMemo(() => {
    const coinbaseLogs: Array<{
      timestamp: string;
      type: 'info' | 'success' | 'payment' | 'error' | 'tool' | 'thinking';
      icon: string;
      message: string;
      details?: string;
      link?: { href: string; label: string };
    }> = [];
    const crossmintLogs: Array<{
      timestamp: string;
      type: 'info' | 'success' | 'payment' | 'error' | 'tool' | 'thinking';
      icon: string;
      message: string;
      details?: string;
      link?: { href: string; label: string };
    }> = [];

    messages.forEach(msg => {
      const agentId = msg.agentId || '';

      // Route to Coinbase terminal
      if (agentId === 'CoinbaseCDP' || msg.type === 'auction_ended') {
        coinbaseLogs.push(...messageToTerminalLog(msg));
      }

      // Route to Crossmint terminal
      if (agentId === 'Crossmint' || msg.type === 'auction_ended') {
        crossmintLogs.push(...messageToTerminalLog(msg));
      }
    });

    return { coinbaseLogs, crossmintLogs };
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#2a2a2a] border-b border-[#333333] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#ffffff] text-xl font-semibold">
                Analytical Agents - DevNews Ad Spots
              </h1>
              <p className="text-[#888888] text-sm">Autonomous analysis, bidding, and creative generation</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-[#888888]">
                <div>🎯 Prime Banner</div>
                <div>📍 Sidebar Secondary</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Terminal View */}
      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Coinbase CDP Terminal */}
            <TerminalPanel
              brandName="Coinbase CDP"
              logs={coinbaseLogs}
              color="blue"
              logoPath="/coinbase.png"
            />

            {/* Crossmint Terminal */}
            <TerminalPanel
              brandName="Crossmint"
              logs={crossmintLogs}
              color="green"
              logoPath="/crossmint.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
