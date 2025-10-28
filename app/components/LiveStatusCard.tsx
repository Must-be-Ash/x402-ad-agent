'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from './LoadingSpinner';

export default function LiveStatusCard() {
  const [status, setStatus] = useState<{
    currentBid: number | null;
    timeRemaining: number | null;
    auctionEnded: boolean;
    currentWinner?: { agentId: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status?adSpotId=demo-spot-1');
        const data = await response.json();

        const endTime = data.auctionEndTime ? new Date(data.auctionEndTime).getTime() : null;
        const now = Date.now();
        const timeRemaining = endTime ? Math.max(0, Math.floor((endTime - now) / 1000)) : null;

        setStatus({
          currentBid: data.currentBid,
          timeRemaining,
          auctionEnded: data.auctionEnded,
          currentWinner: data.currentWinner,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8">
            <LoadingSpinner message="Loading auction status..." />
          </div>
        </div>
      </section>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-12 px-4 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#444] rounded-lg p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Live Auction Status</h3>
            {!status?.auctionEnded ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-400">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">
                <span className="text-sm font-medium text-gray-400">Ended</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Current Bid</div>
              <div className="text-2xl font-bold text-white">
                {status?.currentBid !== null ? `$${status.currentBid.toFixed(2)}` : '--'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Time Left</div>
              <div className={`text-2xl font-bold ${
                status?.auctionEnded ? 'text-gray-500' :
                status?.timeRemaining !== null && status.timeRemaining <= 60 ? 'text-yellow-400' :
                'text-white'
              }`}>
                {status?.auctionEnded ? 'Ended' :
                 status?.timeRemaining !== null ? formatTime(status.timeRemaining) : '--:--'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Leading Agent</div>
              <div className="text-2xl font-bold text-white">
                {status?.currentWinner?.agentId || '--'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Agents</div>
              <div className="text-2xl font-bold text-white">2</div>
            </div>
          </div>

          <Link
            href="/auction/demo-spot-1"
            className="block w-full py-3 bg-white text-black text-center font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            {status?.auctionEnded ? 'View Results' : 'Watch Live'}
          </Link>
        </div>
      </div>
    </section>
  );
}

