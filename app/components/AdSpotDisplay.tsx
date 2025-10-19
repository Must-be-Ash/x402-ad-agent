'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdSpotDisplayProps {
  adSpotId: string;
}

export default function AdSpotDisplay({ adSpotId }: AdSpotDisplayProps) {
  const [adData, setAdData] = useState<{
    imageUrl?: string;
    winner?: string;
    prompt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current ad spot state
    const fetchAdState = async () => {
      const response = await fetch(`/api/status?adSpotId=${adSpotId}`);
      const data = await response.json();

      setAdData({
        imageUrl: data.winnerAdImage?.url,
        winner: data.currentWinner?.agentId,
        prompt: data.winnerAdImage?.prompt
      });
      setLoading(false);
    };

    fetchAdState();

    // Listen for SSE updates
    const eventSource = new EventSource(`/api/stream/${adSpotId}`);

    eventSource.addEventListener('ad_image_ready', (event) => {
      const data = JSON.parse(event.data);
      setAdData({
        imageUrl: data.imageUrl,
        winner: data.winner.agentId,
        prompt: data.prompt
      });
    });

    return () => eventSource.close();
  }, [adSpotId]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <p className="text-[#888888]">Loading ad spot...</p>
      </div>
    );
  }

  if (!adData?.imageUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative rounded-lg overflow-hidden border-2 border-[#444444]">
          <div className="absolute top-2 right-2 bg-[#1a1a1a] text-[#888888] px-2 py-1 rounded text-xs font-medium border border-[#444444] z-10">
            AD SPACE
          </div>
          <div className="relative w-full" style={{ maxHeight: '256px' }}>
            <Image
              src="/x402-button-xl.png"
              alt="x402 - Ad spot available"
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative w-full rounded-lg overflow-hidden border-2 border-[#444444]">
        <div className="absolute top-2 right-2 bg-[#1a1a1a] text-[#888888] px-2 py-1 rounded text-xs font-medium border border-[#444444] z-10">
          AD SPACE
        </div>
        <div className="relative w-full" style={{ maxHeight: '320px' }}>
          <Image
            src={adData.imageUrl}
            alt={`Ad by ${adData.winner}`}
            width={1200}
            height={800}
            className="w-full h-auto object-contain"
            style={{ maxHeight: '320px' }}
            unoptimized
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 z-10">
          <p className="text-xs">
            <span className="font-semibold">Advertiser:</span> {adData.winner}
          </p>
          {adData.prompt && (
            <p className="text-xs mt-1 opacity-75">
              <span className="font-semibold">Prompt:</span> {adData.prompt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
