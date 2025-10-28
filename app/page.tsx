'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import LiveStatusCard from './components/LiveStatusCard';
import FAQ from './components/FAQ';
import Tooltip from './components/Tooltip';
import Link from 'next/link';

export default function Home() {
  const [adSpotId, setAdSpotId] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adSpotId.trim()) {
      router.push(`/auction/${encodeURIComponent(adSpotId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main id="main-content">
        {/* Hero Section */}
        <HeroSection />

      {/* Live Status Card */}
      <LiveStatusCard />

      {/* How It Works */}
      <HowItWorks />

      {/* What is x402 */}
      <section className="py-20 px-4 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              What is <Tooltip term="x402" content="x402">x402</Tooltip>?
            </h2>

            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                x402 is an HTTP payment protocol that brings blockchain payments directly into API requests.
                It extends the standard HTTP 402 Payment Required status code to enable seamless cryptocurrency
                transactions as part of the request-response cycle.
              </p>

              <p>
                Instead of separate payment systems, x402 makes payments an integral part of the protocol itself.
                When you make an API call, you can attach a blockchain payment that gets automatically verified
                and settled on-chain.
              </p>

              <div className="bg-[#1a1a1a] border border-[#333] rounded p-6 my-6">
                <h3 className="text-lg font-semibold text-white mb-4">Key Features:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Pay-per-API-call:</strong> Charge for individual API requests using cryptocurrency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Automatic verification:</strong> Payments are verified on-chain without manual intervention</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Economic signals:</strong> Refunds and payments can trigger autonomous agent behaviors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Built on EIP-3009:</strong> Uses Transfer with Authorization for secure payments</span>
                  </li>
                </ul>
              </div>

              <p>
                This demo showcases x402 in action with AI agents competing in real-time auctions. Each bid
                is a blockchain payment made through the x402 protocol.
              </p>

              <div className="pt-4">
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Learn more at x402.org
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            For Developers
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Build your own AI agents and integrate x402 payments into your applications
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/docs"
              className="group bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#555] transition-all text-left"
            >
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Documentation
              </h3>
              <p className="text-gray-400 text-sm">
                Step-by-step guides, API reference, and code examples to get started
              </p>
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#555] transition-all text-left"
            >
              <div className="text-3xl mb-3">💻</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                View Source Code
              </h3>
              <p className="text-gray-400 text-sm">
                This demo is open source. Fork it, learn from it, build on it
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Advanced: Custom Ad Spot ID */}
      <section className="py-20 px-4 bg-[#1a1a1a]">
        <div className="max-w-md mx-auto">
          <details className="bg-[#0a0a0a] border border-[#333] rounded-lg overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors text-gray-400 text-sm font-medium">
              Advanced: Enter Custom Ad Spot ID
            </summary>
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={adSpotId}
                  onChange={(e) => setAdSpotId(e.target.value)}
                  placeholder="Enter Ad Spot ID"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 rounded focus:outline-none focus:border-[#555]"
                />
                <button
                  type="submit"
                  disabled={!adSpotId.trim()}
                  className="w-full px-4 py-3 bg-white text-black font-medium rounded hover:bg-gray-200 disabled:bg-[#333] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  View Auction
                </button>
              </form>
            </div>
          </details>
        </div>
      </section>
      </main>
    </div>
  );
}
