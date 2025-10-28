import DevNewsAdSpot from '../components/DevNewsAdSpot';
import Image from 'next/image';
import Link from 'next/link';

export default function DevNewsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <main id="main-content">
        {/* Demo Site Banner */}
        <div className="w-full bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-blue-700/30 py-3" role="banner" aria-label="Demo site notification">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">
                <strong className="text-white">Demo Site:</strong> See x402 ad auctions in action
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/auction/prime-banner"
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
              >
                View Auction
              </Link>
              <Link
                href="/"
                className="px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#444] text-gray-300 text-sm font-medium rounded transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Prime Banner Ad Spot */}
      <div className="w-full bg-[#000] border-b border-[#222] py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link href="/auction/prime-banner" className="block group relative">
            <DevNewsAdSpot adSpotId="prime-banner" isPrime={true} />
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="px-4 py-2 bg-black/80 rounded text-sm font-medium">
                Click to see auction →
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-[#222] py-6 bg-[#000]">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight">DevNews</h1>
          <p className="text-[#888] text-sm mt-1">Technology News for Developers</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Left Column: Hero + Article Grid */}
          <div>
            {/* Hero Article */}
            <article className="mb-12">
              <div className="text-[10px] font-bold tracking-wider text-[#888] mb-3 uppercase">
                Today&apos;s Deal
              </div>
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-4 border border-[#222]">
                <Image
                  src="/example1.webp"
                  alt="Hero article"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold mb-2 leading-tight">
                The Rise of AI-Powered Development Tools: How Claude and GitHub Copilot Are Changing Software Engineering
              </h2>
              <p className="text-[#aaa] text-lg mb-3 leading-relaxed">
                As artificial intelligence continues to advance, developer tools are becoming increasingly sophisticated. We explore how AI assistants are reshaping the way software is built.
              </p>
              <div className="text-xs text-[#666]">
                <span className="font-semibold text-[#888]">SARAH CHEN</span>
              </div>
            </article>

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Article 1 */}
              <article>
                <div className="text-[10px] font-bold tracking-wider text-[#888] mb-2 uppercase">
                  Cloud Infrastructure
                </div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-3 border border-[#222]">
                  <Image
                    src="/example2.webp"
                    alt="Article 2"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">
                  Kubernetes 1.30 Released: New Features for Enterprise Scale
                </h3>
                <div className="text-xs text-[#666]">
                  <span className="font-semibold text-[#888]">MIKE RODRIGUEZ</span>
                </div>
              </article>

              {/* Article 2 */}
              <article>
                <div className="text-[10px] font-bold tracking-wider text-[#888] mb-2 uppercase">
                  Web3 & Blockchain
                </div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-3 border border-[#222]">
                  <Image
                    src="/example3.webp"
                    alt="Article 3"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">
                  x402 Protocol Brings Microtransactions to the Web: Pay-Per-API-Call Infrastructure
                </h3>
                <div className="text-xs text-[#666]">
                  <span className="font-semibold text-[#888]">ALEX KIM</span>
                </div>
              </article>

              {/* Article 3 */}
              <article>
                <div className="text-[10px] font-bold tracking-wider text-[#888] mb-2 uppercase">
                  Developer Tools
                </div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-3 border border-[#222]">
                  <Image
                    src="/example4.webp"
                    alt="Article 4"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">
                  Rust Adoption Accelerates in Systems Programming: Why Developers Are Making the Switch
                </h3>
                <div className="text-xs text-[#666]">
                  <span className="font-semibold text-[#888]">EMMA TAYLOR</span>
                </div>
              </article>

              {/* Article 4 */}
              <article>
                <div className="text-[10px] font-bold tracking-wider text-[#888] mb-2 uppercase">
                  Open Source
                </div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-3 border border-[#222]">
                  <Image
                    src="/example5.webp"
                    alt="Article 5"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">
                  The State of Open Source in 2025: Funding Models That Actually Work
                </h3>
                <div className="text-xs text-[#666]">
                  <span className="font-semibold text-[#888]">JORDAN LEE</span>
                </div>
              </article>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            {/* Most Recent Section */}
            <div>
              <div className="text-[10px] font-bold tracking-wider text-[#888] mb-4 uppercase border-b border-[#222] pb-2">
                Most Recent
              </div>
              <div className="space-y-6">
                {/* Recent 1 */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-[#222]">
                    <Image
                      src="/example6.webp"
                      alt="Recent 1"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-tight mb-1">
                      Building Real-Time Collaborative Apps with WebSockets and Redis
                    </h4>
                    <p className="text-[10px] text-[#666] uppercase font-semibold">
                      Lisa Wang
                    </p>
                  </div>
                </div>

                {/* Recent 2 */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-[#222]">
                    <Image
                      src="/example7.webp"
                      alt="Recent 2"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-tight mb-1">
                      TypeScript 5.5: What&apos;s New for Enterprise Development
                    </h4>
                    <p className="text-[10px] text-[#666] uppercase font-semibold">
                      Carlos Santos
                    </p>
                  </div>
                </div>

                {/* Recent 3 */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-[#222]">
                    <Image
                      src="/example1.webp"
                      alt="Recent 3"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-tight mb-1">
                      Scaling PostgreSQL to 10M Requests Per Second: A Case Study
                    </h4>
                    <p className="text-[10px] text-[#666] uppercase font-semibold">
                      Ahmed Hassan
                    </p>
                  </div>
                </div>

                {/* Recent 4 */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-[#222]">
                    <Image
                      src="/example2.webp"
                      alt="Recent 4"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-tight mb-1">
                      The Return of Monoliths: When Microservices Are the Wrong Choice
                    </h4>
                    <p className="text-[10px] text-[#666] uppercase font-semibold">
                      Nina Patel
                    </p>
                  </div>
                </div>

                {/* Recent 5 */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-[#222]">
                    <Image
                      src="/example3.webp"
                      alt="Recent 5"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold leading-tight mb-1">
                      Edge Computing Explained: Why Your Next App Should Run Closer to Users
                    </h4>
                    <p className="text-[10px] text-[#666] uppercase font-semibold">
                      Tom Anderson
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Ad Spot */}
            <div className="mt-8">
              <Link href="/auction/sidebar-secondary" className="block group relative">
                <DevNewsAdSpot adSpotId="sidebar-secondary" isPrime={false} />
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="px-3 py-1.5 bg-black/80 rounded text-xs font-medium">
                    View auction →
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8 mt-16 bg-[#000]" role="contentinfo">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[#666]">
              &copy; 2025 DevNews. Demo site for x402 protocol.
            </div>
            <nav aria-label="Footer navigation" className="flex gap-4 text-xs text-[#888]">
              <Link href="/" className="hover:text-white transition-colors">
                About x402
              </Link>
              <Link href="/auction/demo-spot-1" className="hover:text-white transition-colors">
                Live Auctions
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Developer Docs
              </Link>
            </nav>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}
