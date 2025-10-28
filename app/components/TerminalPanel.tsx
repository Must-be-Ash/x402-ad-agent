'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import Image from 'next/image';

interface TerminalLog {
  id?: string; // Unique identifier for React keys
  timestamp: string;
  type: 'info' | 'success' | 'payment' | 'error' | 'tool' | 'thinking';
  icon: string;
  message: string;
  details?: string;
  link?: {
    href: string;
    label: string;
  };
}

interface TerminalPanelProps {
  brandName: string;
  logs: TerminalLog[];
  color: 'blue' | 'green';
  logoPath: string;
  balance?: number;
  walletAddress?: string;
}

const colorMap = {
  blue: {
    border: 'border-blue-900/50',
    header: 'bg-blue-950/30',
    text: 'text-blue-400',
    accent: 'text-blue-500',
  },
  green: {
    border: 'border-green-900/50',
    header: 'bg-green-950/30',
    text: 'text-green-400',
    accent: 'text-green-500',
  },
};

const logTypeStyles = {
  info: 'text-gray-400',
  success: 'text-green-400',
  payment: 'text-amber-400',
  error: 'text-red-400',
  tool: 'text-blue-400',
  thinking: 'text-purple-400',
};

export default function TerminalPanel({ brandName, logs, color, logoPath, balance, walletAddress }: TerminalPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const theme = colorMap[color];

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Deduplicate consecutive identical messages (common when agent is stuck)
  const { deduplicatedLogs, isStuck } = useMemo(() => {
    const deduplicated: TerminalLog[] = [];
    let consecutiveCount = 0;
    let lastLog: TerminalLog | null = null;
    let maxConsecutive = 0;

    for (const log of logs) {
      // Create a signature for comparison (exclude timestamp and id)
      const signature = `${log.type}-${log.message}-${log.details || ''}`;
      const lastSignature = lastLog ? `${lastLog.type}-${lastLog.message}-${lastLog.details || ''}` : null;

      if (signature === lastSignature) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        // Replace the last log with a "repeated" version
        if (deduplicated.length > 0) {
          deduplicated[deduplicated.length - 1] = {
            ...log,
            message: `${log.message} (repeated ${consecutiveCount}x)`,
          };
        }
      } else {
        consecutiveCount = 0;
        deduplicated.push(log);
      }

      lastLog = log;
    }

    // Consider agent "stuck" if same message repeated 3+ times
    const isStuck = maxConsecutive >= 3;

    return { deduplicatedLogs: deduplicated, isStuck };
  }, [logs]);

  // Auto-scroll to bottom when new logs arrive - only scroll within the terminal container
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [deduplicatedLogs]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`flex flex-col h-full border ${theme.border} rounded-lg overflow-hidden bg-[#0a0a0a]`} role="region" aria-label={`${brandName} agent terminal`}>
      {/* Terminal Header */}
      <div className={`${theme.header} border-b ${theme.border} px-6 py-4`}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#444444] bg-[#2a2a2a] flex-shrink-0">
              <Image
                src={logoPath}
                alt={brandName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-semibold ${theme.accent}`}>
                {brandName}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Agent Terminal
              </span>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Wallet Balance</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-amber-400 font-mono">
                {balance !== undefined ? `$${balance.toFixed(2)}` : '---'}
              </span>
              <span className="text-xs text-gray-400">USDC</span>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        {walletAddress && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded group">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider flex-shrink-0">Address:</span>
            <code className="text-xs text-gray-400 font-mono flex-1">{formatAddress(walletAddress)}</code>
            <button
              onClick={copyAddress}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#2a2a2a] transition-colors"
              title="Copy full address"
              aria-label="Copy wallet address"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Terminal Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs" role="log" aria-live="polite" aria-atomic="false">
        {/* Stuck Warning Banner */}
        {isStuck && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-yellow-400 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Agent appears to be stuck</span>
            </div>
            <p className="text-xs text-yellow-300">
              Repeated attempts with same result. Check agent balance and configuration.
            </p>
          </div>
        )}

        {deduplicatedLogs.length === 0 ? (
          <div className="text-gray-600 flex items-center gap-2">
            <span className="animate-pulse">&gt;</span>
            <span>Waiting for agent to start...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {deduplicatedLogs.map((log, index) => (
              <div key={log.id || `${log.timestamp}-${index}`} className="flex flex-col gap-1" role="listitem">
                {/* Main log line */}
                <div className="flex items-start gap-3">
                  <span className="text-gray-600 flex-shrink-0">
                    [{formatTime(log.timestamp)}]
                  </span>
                  <span className="flex-shrink-0">{log.icon}</span>
                  <span className={logTypeStyles[log.type]}>
                    {log.message}
                  </span>
                </div>

                {/* Details (indented) */}
                {log.details && (
                  <div className="ml-[110px] text-gray-500 text-[11px] whitespace-pre-wrap">
                    {log.details}
                  </div>
                )}

                {/* Link (indented) */}
                {log.link && (
                  <div className="ml-[110px]">
                    <a
                      href={log.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-400 underline text-[11px]"
                    >
                      {log.link.label} →
                    </a>
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
