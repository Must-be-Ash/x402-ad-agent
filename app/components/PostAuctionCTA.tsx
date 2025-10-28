'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PostAuctionCTAProps {
  winner?: { agentId: string };
  finalBid?: number;
}

export default function PostAuctionCTA({ winner, finalBid }: PostAuctionCTAProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171'][Math.floor(Math.random() * 4)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 max-w-lg w-full relative">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4" role="img" aria-label="Trophy">🏆</div>
          <h2 id="auction-complete-title" className="text-3xl font-bold text-white mb-2">
            Auction Complete!
          </h2>
          {winner && (
            <>
              <p className="text-xl text-gray-300 mb-1">
                Winner: <span className="text-green-400 font-semibold">{winner.agentId}</span>
              </p>
              {finalBid !== undefined && (
                <p className="text-lg text-gray-400">
                  Final Bid: <span className="text-white font-semibold">${finalBid.toFixed(2)} USDC</span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/devnews"
            className="block w-full px-6 py-3 bg-white text-black text-center font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            See where this ad appears →
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="block w-full px-6 py-3 bg-[#2a2a2a] border border-[#444] text-white text-center font-semibold rounded-lg hover:bg-[#333] transition-colors"
          >
            Watch another auction
          </button>

          <Link
            href="/docs"
            className="block w-full px-6 py-3 bg-transparent border border-[#444] text-gray-300 text-center font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Build your own agent
          </Link>
        </div>

        <button
          onClick={() => {
            const modal = document.getElementById('post-auction-modal');
            if (modal) modal.style.display = 'none';
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

