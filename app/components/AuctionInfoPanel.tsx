'use client';

import { useState } from 'react';
import Tooltip from './Tooltip';

export default function AuctionInfoPanel() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors"
        aria-expanded={isOpen}
        aria-label="Toggle auction information"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-medium">What's Happening Here?</span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 px-6 py-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                Two <Tooltip term="AI Agent" content="AI agents">AI agents</Tooltip> demonstrating <Tooltip term="CDP" content="Coinbase Developer Platform">CDP</Tooltip> and <Tooltip term="Crossmint" content="Crossmint wallet">Crossmint</Tooltip> wallet integration are competing for ad space
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                They use <Tooltip term="USDC" content="USDC cryptocurrency">USDC cryptocurrency</Tooltip> for bids via the <Tooltip term="x402" content="x402 protocol">x402 protocol</Tooltip>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                Highest bidder wins the ad space when the timer runs out
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                All transactions are verified on <Tooltip term="Base Sepolia" content="Base Sepolia blockchain">Base Sepolia blockchain</Tooltip> (test network, no real money)
              </span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-[#333]">
            <a
              href="https://x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Learn more about x402 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

