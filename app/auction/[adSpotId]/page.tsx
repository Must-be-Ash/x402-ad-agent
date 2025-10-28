'use client';

import { use, useEffect, useState, useMemo } from 'react';
import AdSpotDisplay from '@/app/components/AdSpotDisplay';
import TerminalPanel from '@/app/components/TerminalPanel';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import AuctionInfoPanel from '@/app/components/AuctionInfoPanel';
import PostAuctionCTA from '@/app/components/PostAuctionCTA';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Winner {
  agentId: string;
  address?: string;
}

interface StreamingMessage {
  id: string;
  type: 'thinking' | 'bid' | 'reflection' | 'refund' | 'withdrawal' | 'auction_ended' | 'ad_image_ready' | 'image_generation_update';
  agentId?: string;
  timestamp: string;
  thinking?: string;
  strategy?: string;
  proposedAmount?: number;
  amount?: number;
  transactionHash?: string;
  reflection?: string;
  refundAmount?: number;
  reasoning?: string;
  winner?: Winner;
  finalBid?: number;
  endReason?: string;
  isLoading?: boolean;
  imageUrl?: string;
  status?: string; // For image generation: 'started', 'progress', 'completed', 'failed'
  message?: string; // For image generation status messages
  taskId?: string;
}

export default function AuctionPageStreaming({ params }: { params: Promise<{ adSpotId: string }> }) {
  const { adSpotId } = use(params);
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [finalBid, setFinalBid] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'cdp' | 'crossmint'>('cdp');
  const [showPostAuctionModal, setShowPostAuctionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agentBalances, setAgentBalances] = useState<Record<string, number>>({});
  const [agentAddresses, setAgentAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      // Connect to SSE stream
      eventSource = new EventSource(`/api/stream/${encodeURIComponent(adSpotId)}`);

      eventSource.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);

        switch (data.type) {
          case 'agent_status':
            // No longer needed - we show everything in terminal
            break;

          case 'thinking':
            setMessages(prev => [...prev, {
              id: `${data.agentId}-thinking-${Date.now()}`,
              type: 'thinking',
              agentId: data.agentId,
              timestamp: data.timestamp,
              thinking: data.thinking,
              strategy: data.strategy,
              proposedAmount: data.proposedAmount,
            }]);
            break;

          case 'bid_placed':
            // Keep the thinking bubble and add bid card below it
            // Check if this bid already exists (prevent duplicates)
            setMessages(prev => {
              const bidExists = prev.some(msg =>
                msg.type === 'bid' &&
                msg.agentId === data.agentId &&
                msg.transactionHash === data.transactionHash
              );

              if (bidExists) {
                return prev; // Don't add duplicate
              }

              return [...prev, {
                id: `${data.agentId}-bid-${Date.now()}`,
                type: 'bid',
                agentId: data.agentId,
                timestamp: data.timestamp,
                amount: data.amount,
                transactionHash: data.transactionHash,
                isLoading: true, // Waiting for reflection
              }];
            });
            setCurrentBid(data.amount);
            break;

          case 'reflection':
            // Update the corresponding bid with reflection
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
            // Add refund notification
            setMessages(prev => [...prev, {
              id: `${data.agentId}-refund-${Date.now()}`,
              type: 'refund',
              agentId: data.agentId,
              timestamp: data.timestamp,
              refundAmount: data.amount,
              transactionHash: data.transactionHash,
            }]);
            break;

          case 'withdrawal':
            // Add withdrawal notification
            setMessages(prev => [...prev, {
              id: `${data.agentId}-withdrawal-${Date.now()}`,
              type: 'withdrawal',
              agentId: data.agentId,
              timestamp: data.timestamp,
              refundAmount: data.amount,
              reasoning: data.reasoning,
              transactionHash: data.transactionHash,
            }]);
            break;

          case 'auction_ended':
            // Add auction ended notification
            setMessages(prev => [...prev, {
              id: `auction-ended-${Date.now()}`,
              type: 'auction_ended',
              timestamp: data.timestamp,
              winner: data.winner,
              finalBid: data.finalBid,
              endReason: data.reason,
            }]);
            setWinner(data.winner);
            setFinalBid(data.finalBid);
            setAuctionEnded(true);
            // Show modal after 1 second
            setTimeout(() => setShowPostAuctionModal(true), 1000);
            break;

          case 'ad_image_ready':
            // Add ad image ready notification
            setMessages(prev => [...prev, {
              id: `ad-image-ready-${Date.now()}`,
              type: 'ad_image_ready',
              timestamp: data.timestamp || new Date().toISOString(),
              agentId: data.winner?.agentId,
              imageUrl: data.imageUrl,
            }]);
            break;

          case 'image_generation_update':
            // Add image generation status update
            setMessages(prev => [...prev, {
              id: `image-gen-${Date.now()}`,
              type: 'image_generation_update',
              timestamp: data.timestamp || new Date().toISOString(),
              agentId: data.agentId,
              status: data.status,
              message: data.message,
              imageUrl: data.imageUrl,
              taskId: data.taskId,
            }]);
            break;
        }
      });

      // Also poll for initial state
      fetch(`/api/status?adSpotId=${encodeURIComponent(adSpotId)}`)
        .then(res => res.json())
        .then(data => {
          setCurrentBid(data.currentBid);

          // Set auction end time if available
          if (data.auctionEndTime) {
            setAuctionEndTime(new Date(data.auctionEndTime));
          }

          // Set auction ended status
          if (data.auctionEnded) {
            setAuctionEnded(true);
            if (data.currentWinner) {
              setWinner(data.currentWinner);
              setFinalBid(data.currentBid);
            }
          }

          // Load existing messages from history
          if (data.bidHistory) {
            const historicalMessages: StreamingMessage[] = [];
            data.bidHistory.forEach((bid: { agentId: string; timestamp: string; amount: number; txHash: string; reflection?: string }) => {
              // Only add bid cards for historical data (not thinking bubbles)
              // Thinking bubbles are only shown for live events via SSE
              historicalMessages.push({
                id: `${bid.agentId}-bid-${bid.timestamp}`,
                type: 'bid',
                agentId: bid.agentId,
                timestamp: bid.timestamp,
                amount: bid.amount,
                transactionHash: bid.txHash,
                reflection: bid.reflection,
                isLoading: !bid.reflection,
              });
            });
            setMessages(historicalMessages);
          }

          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch initial state:', err);
          setIsLoading(false);
        });

      // Handle connection errors and reconnect
      eventSource.onerror = () => {
        console.log('SSE connection lost, reconnecting in 3s...');
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [adSpotId]);

  // Poll for auction status updates (including end time)
  useEffect(() => {
    const pollStatus = () => {
      fetch(`/api/status?adSpotId=${encodeURIComponent(adSpotId)}`)
        .then(res => res.json())
        .then(data => {
          setCurrentBid(data.currentBid);

          if (data.auctionEndTime) {
            setAuctionEndTime(new Date(data.auctionEndTime));
          }

          if (data.auctionEnded) {
            setAuctionEnded(true);
          }
        })
        .catch(err => console.error('Failed to poll status:', err));
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [adSpotId]);

  // Poll for agent wallet balances and addresses
  useEffect(() => {
    const pollBalances = () => {
      fetch('/api/balances')
        .then(res => res.json())
        .then(data => {
          if (data.balances) {
            setAgentBalances(data.balances);
          }
          if (data.addresses) {
            setAgentAddresses(data.addresses);
          }
        })
        .catch(err => console.error('Failed to poll balances:', err));
    };

    // Fetch immediately
    pollBalances();

    // Poll every 3 seconds
    const interval = setInterval(pollBalances, 3000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!auctionEndTime || auctionEnded) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = auctionEndTime.getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setAuctionEnded(true);
      }
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auctionEndTime, auctionEnded]);

  const getBrandName = (agentId: string) => {
    // Map agent IDs to standardized brand names
    if (agentId === 'CDP Agent' || agentId === 'CDP' || agentId === 'IceCo' || agentId === 'AgentA' || agentId === 'Coinbase') return 'CDP Agent';
    if (agentId === 'Crossmint Agent' || agentId === 'Crossmint' || agentId === 'FizzUp' || agentId === 'AgentB') return 'Crossmint Agent';
    return agentId;
  };

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
      case 'thinking':
        logs.push({
          timestamp: msg.timestamp,
          type: 'thinking',
          icon: '🧠',
          message: 'THINKING',
          details: msg.thinking,
        });
        if (msg.strategy) {
          logs.push({
            timestamp: msg.timestamp,
            type: 'info',
            icon: '📋',
            message: 'STRATEGY',
            details: msg.strategy,
          });
        }
        if (msg.proposedAmount) {
          logs.push({
            timestamp: msg.timestamp,
            type: 'info',
            icon: '💭',
            message: `PROPOSED BID: $${msg.proposedAmount.toFixed(2)} USDC`,
          });
        }
        break;

      case 'bid':
        logs.push({
          timestamp: msg.timestamp,
          type: 'payment',
          icon: '💳',
          message: 'INITIATING x402 PAYMENT',
          details: `Amount: $${msg.amount?.toFixed(2)} USDC`,
        });
        logs.push({
          timestamp: msg.timestamp,
          type: 'success',
          icon: '✓',
          message: `BID PLACED: $${msg.amount?.toFixed(2)} USDC`,
          link: msg.transactionHash ? {
            href: `https://sepolia.basescan.org/tx/${msg.transactionHash}`,
            label: 'View transaction on Basescan'
          } : undefined,
        });
        if (msg.reflection) {
          logs.push({
            timestamp: msg.timestamp,
            type: 'info',
            icon: '📊',
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
          details: 'Outbid by competitor. Re-evaluating strategy...',
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
          message: 'WITHDRAWING FROM AUCTION',
          details: msg.reasoning,
          link: msg.transactionHash ? {
            href: `https://sepolia.basescan.org/tx/${msg.transactionHash}`,
            label: 'View refund transaction'
          } : undefined,
        });
        break;

      case 'image_generation_update':
        // Image generation progress updates
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
        // Auction ended messages appear in both terminals
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
  const { cdpLogs, crossmintLogs } = useMemo(() => {
    const cdpLogs: Array<{
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
      const brandName = getBrandName(msg.agentId || '');
      if (brandName === 'CDP Agent' || msg.type === 'auction_ended') {
        cdpLogs.push(...messageToTerminalLog(msg));
      }
      if (brandName === 'Crossmint Agent' || msg.type === 'auction_ended') {
        crossmintLogs.push(...messageToTerminalLog(msg));
      }
    });

    return { cdpLogs, crossmintLogs };
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading auction..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      <main id="main-content" className="flex flex-col h-full overflow-hidden">
        {/* AD BANNER AT TOP */}
        <div className="w-full bg-[#2a2a2a] border-b border-[#333333] flex-shrink-0" role="banner" aria-label="Advertisement display">
          <div className="max-w-6xl mx-auto p-4">
            <AdSpotDisplay adSpotId={adSpotId} />
          </div>
        </div>

      {/* Header */}
      <div className="bg-[#2a2a2a] border-b border-[#333333] px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Live Demo', href: '/auction/demo-spot-1' },
              { label: adSpotId },
            ]}
          />

          {/* Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[#ffffff] text-xl sm:text-2xl font-semibold">
                  {adSpotId}
                </h1>
                {!auctionEnded ? (
                  <div className="flex items-center gap-2 px-2 py-1 bg-green-900/30 border border-green-700/50 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-400">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1 bg-red-900/30 border border-red-700/50 rounded-full">
                    <span className="text-xs font-medium text-red-400">Ended</span>
                  </div>
                )}
              </div>
              <p className="text-[#888888] text-sm mt-1">Ad Spot Auction</p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center sm:text-right">
                <div className="text-[#888888] text-xs uppercase tracking-wide">Current Bid</div>
                <div className="text-[#ffffff] text-xl sm:text-2xl font-bold">
                  ${currentBid?.toFixed(2) || '0.00'}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center sm:text-right">
                <div className="text-[#888888] text-xs uppercase tracking-wide">Time Left</div>
                <div className={`text-xl sm:text-2xl font-bold ${
                  auctionEnded
                    ? 'text-red-500'
                    : timeRemaining !== null && timeRemaining <= 60
                      ? 'text-yellow-500'
                      : 'text-[#ffffff]'
                }`}>
                  {auctionEnded ? (
                    'ENDED'
                  ) : timeRemaining !== null ? (
                    <>
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </>
                  ) : (
                    '--:--'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel and Terminals */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 py-6 min-h-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col min-h-0">
          {/* Info Panel */}
          <div className="flex-shrink-0">
            <AuctionInfoPanel />
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden mb-4 flex-shrink-0">
            <div className="flex gap-2 border-b border-[#333]">
              <button
                onClick={() => setActiveTab('cdp')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'cdp'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                CDP Agent
              </button>
              <button
                onClick={() => setActiveTab('crossmint')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'crossmint'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Crossmint Agent
              </button>
            </div>
          </div>

          {/* Dual Terminal View (Desktop) / Single Terminal View (Mobile) */}
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Desktop: Side by Side */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 h-full">
              <TerminalPanel
                brandName="CDP Agent"
                logs={cdpLogs}
                color="blue"
                logoPath="/coinbase.png"
                balance={agentBalances['CDP Agent'] || agentBalances['CDP'] || agentBalances['Coinbase']}
                walletAddress={agentAddresses['CDP Agent'] || agentAddresses['CDP'] || agentAddresses['Coinbase']}
              />
              <TerminalPanel
                brandName="Crossmint Agent"
                logs={crossmintLogs}
                color="green"
                logoPath="/crossmint.png"
                balance={agentBalances['Crossmint Agent'] || agentBalances['Crossmint']}
                walletAddress={agentAddresses['Crossmint Agent'] || agentAddresses['Crossmint']}
              />
            </div>

            {/* Mobile: Tabbed View */}
            <div className="md:hidden h-full">
              {activeTab === 'cdp' ? (
                <TerminalPanel
                  brandName="CDP Agent"
                  logs={cdpLogs}
                  color="blue"
                  logoPath="/coinbase.png"
                  balance={agentBalances['CDP Agent'] || agentBalances['CDP'] || agentBalances['Coinbase']}
                  walletAddress={agentAddresses['CDP Agent'] || agentAddresses['CDP'] || agentAddresses['Coinbase']}
                />
              ) : (
                <TerminalPanel
                  brandName="Crossmint Agent"
                  logs={crossmintLogs}
                  color="green"
                  logoPath="/crossmint.png"
                  balance={agentBalances['Crossmint Agent'] || agentBalances['Crossmint']}
                  walletAddress={agentAddresses['Crossmint Agent'] || agentAddresses['Crossmint']}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Auction Modal */}
      {showPostAuctionModal && winner && (
        <div id="post-auction-modal" role="dialog" aria-modal="true" aria-labelledby="auction-complete-title">
          <PostAuctionCTA winner={winner} finalBid={finalBid || undefined} />
        </div>
      )}
      </main>
    </div>
  );
}


