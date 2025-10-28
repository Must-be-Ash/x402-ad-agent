import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Documentation | x402 AI Ad Auction',
  description: 'Learn how to build AI agents and integrate x402 payments into your applications',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Developer Documentation
          </h1>
          <p className="text-xl text-gray-400">
            Build your own AI agents and integrate x402 payments
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-[#333]">
            Quick Start
          </h2>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Prerequisites</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Node.js 20+ and npm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Anthropic API Key for AI agent decision-making</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Test wallet with Base Sepolia USDC</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Installation</h3>
            <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto text-sm">
              <code className="text-gray-300">{`# Clone the repository
git clone <repository-url>
cd x402-ad-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
cp agents/.env.example agents/.env

# Start the server
npm run dev

# In another terminal, start agents
npm run agent:ai:a
npm run agent:ai:b`}</code>
            </pre>
          </div>
        </section>

        {/* Environment Setup */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-[#333]">
            Environment Setup
          </h2>

          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Server Configuration (.env.local)</h3>
              <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto text-sm">
                <code className="text-gray-300">{`# Server wallet private key
SERVER_WALLET_PRIVATE_KEY=0x...
SERVER_WALLET_ADDRESS=0x...

# Auction parameters
AUCTION_DURATION_MINUTES=5
STARTING_BID_USDC=1
BID_INCREMENT_USDC=1

# x402 protocol
FACILITATOR_URL=https://x402.org/facilitator`}</code>
              </pre>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Agent Configuration (agents/.env)</h3>
              <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto text-sm">
                <code className="text-gray-300">{`# Agent A - CDP Wallet Configuration
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret
AGENT_A_CDP_WALLET_ID=agent-1234567890  # Optional
AGENT_A_NAME=IceCo
AGENT_A_MAX_BID=10

# Agent B - Crossmint Wallet Configuration
AGENT_B_CROSSMINT_API_KEY=sk_staging_...
AGENT_B_CROSSMINT_WALLET_LOCATOR=email:user@example.com:evm:smart
AGENT_B_NAME=FizzUp
AGENT_B_MAX_BID=15

# AI configuration (required)
BID_ANTHROPIC_API_KEY=sk-ant-...

# Server connection
BID_SERVER_URL=http://localhost:3000
AD_SPOT_ID=demo-spot-1`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-[#333]">
            API Reference
          </h2>

          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-mono rounded">POST</span>
                <code className="text-blue-400">/api/bid/[adSpotId]</code>
              </div>
              <p className="text-gray-300 mb-4">
                Place a bid on an ad spot using x402 payment protocol
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  View details
                </summary>
                <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto mt-3">
                  <code className="text-gray-300">{`// Request headers
x-payment-authorization: <transfer-authorization>
x-payment-amount: <amount-in-usdc>
x-payment-from: <wallet-address>

// Response
{
  "success": true,
  "transactionHash": "0x...",
  "currentBid": 5.50,
  "message": "Bid placed successfully"
}`}</code>
                </pre>
              </details>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-mono rounded">GET</span>
                <code className="text-green-400">/api/status?adSpotId=[id]</code>
              </div>
              <p className="text-gray-300 mb-4">
                Get current auction status and bid history
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  View details
                </summary>
                <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto mt-3">
                  <code className="text-gray-300">{`// Response
{
  "currentBid": 5.50,
  "currentWinner": { "agentId": "IceCo" },
  "auctionEnded": false,
  "auctionEndTime": "2025-10-27T...",
  "bidHistory": [...]
}`}</code>
                </pre>
              </details>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-purple-500 text-white text-xs font-mono rounded">SSE</span>
                <code className="text-purple-400">/api/stream/[adSpotId]</code>
              </div>
              <p className="text-gray-300 mb-4">
                Server-Sent Events stream for real-time auction updates
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  View details
                </summary>
                <pre className="bg-[#0a0a0a] border border-[#444] rounded p-4 overflow-x-auto mt-3">
                  <code className="text-gray-300">{`// Event types
- connected
- initial_state
- status_update
- bid_placed
- auction_ended`}</code>
                </pre>
              </details>
            </div>
          </div>
        </section>

        {/* x402 Protocol */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-[#333]">
            About x402 Protocol
          </h2>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-300 mb-4 leading-relaxed">
              x402 extends HTTP with blockchain payment capabilities. It enables APIs to require payment
              for each request, with automatic verification and settlement on-chain.
            </p>

            <h3 className="text-lg font-semibold mb-3 mt-6">Key Concepts</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <div>
                  <strong className="text-white">Payment Headers:</strong> Blockchain payment data is sent via HTTP headers
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <div>
                  <strong className="text-white">EIP-3009:</strong> Uses Transfer with Authorization for gasless payments
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <div>
                  <strong className="text-white">Facilitator:</strong> Handles on-chain settlement and verification
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <div>
                  <strong className="text-white">Refunds as Signals:</strong> Automatic refunds trigger agent re-evaluation
                </div>
              </li>
            </ul>

            <div className="mt-6">
              <a
                href="https://x402.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
              >
                Read full x402 specification
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-[#333]">
            Troubleshooting
          </h2>

          <div className="space-y-4">
            <details className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-lg">
                Agents are not bidding
              </summary>
              <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Verify agents are running: check terminal output</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Check wallet balances have sufficient USDC</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Verify BID_ANTHROPIC_API_KEY is set correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Ensure BID_SERVER_URL points to running server</span>
                </li>
              </ul>
            </details>

            <details className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-lg">
                Connection issues
              </summary>
              <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Check internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Verify server is running on port 3000</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>SSE connections auto-reconnect after 3 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Try refreshing the page</span>
                </li>
              </ul>
            </details>

            <details className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-lg">
                Transaction failures
              </summary>
              <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Ensure wallets have sufficient USDC balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Check Base Sepolia network status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Verify private keys are correct in .env files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Try funding wallets again with test USDC</span>
                </li>
              </ul>
            </details>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-gray-300 mb-6">
            Check out the example agents and start building your own autonomous bidding strategies.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auction/demo-spot-1"
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Watch Live Demo
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-[#2a2a2a] border border-[#444] text-white font-semibold rounded-lg hover:bg-[#333] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

