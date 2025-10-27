'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdSpotDisplayProps {
  adSpotId: string;
}

export default function AdSpotDisplay({ adSpotId }: AdSpotDisplayProps) {
  const [adData, setAdData] = useState<{
    winner?: string;
    auctionEnded?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Map brand names to their static ad images
  const getBrandAdImage = (winner: string): string => {
    const brandMap: Record<string, string> = {
      'IceCo': '/iceco.png',
      'FizzUp': '/fizzup.png',
      'AgentA': '/iceco.png',
      'AgentB': '/fizzup.png',
      'Coinbase CDP': '/coinbase.png',
      'Crossmint': '/crossmint.png',
    };
    return brandMap[winner] || '/iceco.png';
  };

  useEffect(() => {
    // Fetch current ad spot state
    const fetchAdState = async () => {
      const response = await fetch(`/api/status?adSpotId=${adSpotId}`);
      const data = await response.json();

      setAdData({
        winner: data.currentWinner?.agentId,
        auctionEnded: data.auctionEnded
      });
      setLoading(false);
    };

    fetchAdState();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchAdState, 2000);

    return () => clearInterval(interval);
  }, [adSpotId]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <p className="text-[#888888]">Loading ad spot...</p>
      </div>
    );
  }

  // Show winner's brand ad if auction ended and there's a winner
  if (adData?.auctionEnded && adData?.winner) {
    const brandImage = getBrandAdImage(adData.winner);

    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative w-full rounded-lg overflow-hidden border-2 border-[#444444]">
          <div className="absolute top-2 right-2 bg-[#1a1a1a] text-green-500 px-2 py-1 rounded text-xs font-medium border border-green-500 z-10">
            🏆 WINNER
          </div>
          <div className="relative w-full bg-white" style={{ maxHeight: '320px' }}>
            <Image
              src={brandImage}
              alt={`Ad by ${adData.winner}`}
              width={1200}
              height={800}
              className="w-full h-auto object-contain p-8"
              style={{ maxHeight: '320px' }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 z-10">
            <p className="text-xs">
              <span className="font-semibold">Advertiser:</span> {adData.winner}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show x402 placeholder when auction is active or no winner yet
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative rounded-lg overflow-hidden border-2 border-[#444444]">
        <div className="absolute top-2 right-2 bg-[#1a1a1a] text-[#888888] px-2 py-1 rounded text-xs font-medium border border-[#444444] z-10">
          {adData?.winner ? `CURRENT: ${adData.winner}` : 'AD SPACE AVAILABLE'}
        </div>
        <div className="relative w-full" style={{ maxHeight: '256px' }}>
          <Image
            src="/x402-button-xl.png"
            alt="x402 - Ad spot auction in progress"
            width={1200}
            height={600}
            className="w-full h-auto object-contain"
            style={{ maxHeight: '256px' }}
          />
        </div>
      </div>
    </div>
  );
}
