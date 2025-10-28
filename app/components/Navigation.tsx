'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auctionStatus, setAuctionStatus] = useState<{
    currentBid: number | null;
    isLive: boolean;
  }>({ currentBid: null, isLive: false });
  const pathname = usePathname();

  // Fetch live auction status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status?adSpotId=demo-spot-1');
        const data = await response.json();
        setAuctionStatus({
          currentBid: data.currentBid,
          isLive: !data.auctionEnded && data.currentBid !== null,
        });
      } catch (error) {
        console.error('Failed to fetch auction status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/auction/demo-spot-1', label: 'Live Demo', highlight: true },
    { href: '/devnews', label: 'Example Site' },
    { href: '/docs', label: 'Build Your Agent' },
    { href: '/#how-it-works', label: 'How It Works' },
  ];

  const isActive = (href: string) => {
    if (href.includes('#')) {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="bg-[#0a0a0a] border-b border-[#333] sticky top-0 z-50" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
          >
            Skip to main content
          </a>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="x402 AI Ad Auctions home">
            <div className="text-2xl font-bold text-white group-hover:text-gray-300 transition-colors">
              x402
            </div>
            <div className="hidden sm:block text-sm text-gray-500">
              AI Ad Auctions
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                } ${
                  link.highlight
                    ? 'px-4 py-2 bg-white text-black rounded hover:bg-gray-200'
                    : ''
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Live Status Badge */}
            {auctionStatus.isLive && auctionStatus.currentBid !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-400">
                  ${auctionStatus.currentBid.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#333] bg-[#1a1a1a]">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Status Badge */}
            {auctionStatus.isLive && auctionStatus.currentBid !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-400">
                  Live: ${auctionStatus.currentBid.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

