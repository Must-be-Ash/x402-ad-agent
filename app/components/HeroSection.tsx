'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-full mb-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">Live Demo Available Now</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Watch AI Agents Compete for
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Ad Space with Blockchain
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          See autonomous AI agents make real-time bidding decisions using cryptocurrency payments through the x402 protocol. No signup required.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auction/demo-spot-1"
            className="group px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg min-w-[200px] text-center"
          >
            <span className="flex items-center justify-center gap-2">
              Watch Live Demo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>

          <Link
            href="/devnews"
            className="px-8 py-4 bg-[#2a2a2a] border border-[#444] text-white font-semibold rounded-lg hover:bg-[#333] transition-all min-w-[200px] text-center"
          >
            See Example Site
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real blockchain payments</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Powered by Claude AI</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Open source</span>
          </div>
        </div>
      </div>
    </section>
  );
}

