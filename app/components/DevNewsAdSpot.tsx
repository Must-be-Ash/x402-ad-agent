'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DevNewsAdSpotProps {
  adSpotId: string;
  isPrime?: boolean;
}

export default function DevNewsAdSpot({ adSpotId, isPrime = false }: DevNewsAdSpotProps) {
  const [adData, setAdData] = useState<{
    imageUrl?: string;
    winner?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current ad spot state
    const fetchAdState = async () => {
      try {
        const response = await fetch(`/api/status?adSpotId=${adSpotId}`);
        const data = await response.json();

        setAdData({
          imageUrl: data.winnerAdImage, // winnerAdImage is a string URL, not an object
          winner: data.currentWinner?.agentId,
        });
      } catch (error) {
        console.error('Failed to fetch ad state:', error);
      }
      setLoading(false);
    };

    fetchAdState();

    // Listen for SSE updates
    const eventSource = new EventSource(`/api/stream/${adSpotId}`);

    eventSource.addEventListener('ad_image_ready', (event) => {
      const data = JSON.parse(event.data);
      setAdData({
        imageUrl: data.imageUrl,
        winner: data.winner?.agentId || data.winner,
      });
    });

    return () => eventSource.close();
  }, [adSpotId]);

  if (loading) {
    return (
      <div className={`${isPrime ? 'h-32' : 'h-64'} bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-[#333]`}>
        <p className="text-[#666] text-xs">Loading...</p>
      </div>
    );
  }

  const labelText = isPrime ? 'PRIME AD SPACE' : 'AD SPACE';

  if (!adData?.imageUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-[#333] ${isPrime ? 'h-32' : 'h-64'}`}>
        <div className="absolute top-2 right-2 bg-[#000] text-[#888] px-2 py-1 rounded text-[10px] font-semibold border border-[#333] z-10">
          {labelText}
        </div>
        <div className="relative w-full h-full flex items-center justify-center bg-[#0a0a0a]">
          <Image
            src="/x402-button-xl.png"
            alt="Ad spot available"
            width={isPrime ? 800 : 300}
            height={isPrime ? 100 : 250}
            className="object-contain opacity-50"
            style={{ maxHeight: isPrime ? '100px' : '200px' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-[#333] ${isPrime ? 'h-32' : 'h-64'}`}>
      <div className="absolute top-2 right-2 bg-[#000] text-[#888] px-2 py-1 rounded text-[10px] font-semibold border border-[#333] z-10">
        {labelText}
      </div>
      <div className="relative w-full h-full">
        <Image
          src={adData.imageUrl}
          alt={`Ad by ${adData.winner}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {adData.winner && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-[10px] z-10">
          By {adData.winner}
        </div>
      )}
    </div>
  );
}
