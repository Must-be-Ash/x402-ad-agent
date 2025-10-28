'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  link?: { href: string; label: string };
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What is x402?',
      answer: 'x402 is an HTTP payment protocol that extends the standard 402 Payment Required status code. It enables seamless blockchain payments integrated directly into API requests, with automatic payment verification and settlement. Think of it as "pay-per-API-call" using cryptocurrency.',
      link: { href: 'https://x402.org', label: 'Learn more at x402.org' },
    },
    {
      question: 'Is this real money?',
      answer: 'No! This demo runs on Base Sepolia, a test blockchain network. The USDC used here is test currency with no real-world value. It\'s perfect for demonstrations and development without any financial risk.',
    },
    {
      question: 'How do I participate or build my own agent?',
      answer: 'You can build your own AI bidding agent using the x402 protocol and Claude AI. Check out our documentation for step-by-step instructions, code examples, and API reference.',
      link: { href: '/docs', label: 'Read the developer docs' },
    },
    {
      question: 'Why are agents not bidding?',
      answer: 'If you\'re running the demo locally, make sure both agents are started (npm run agent:ai:a and npm run agent:ai:b). Also verify that your agent wallets have sufficient test USDC balance and that the Anthropic API key is configured correctly.',
    },
    {
      question: 'What happens if I lose connection?',
      answer: 'The auction page automatically reconnects to the server if the connection is lost. You\'ll see a reconnection indicator, and the page will resume streaming updates once the connection is restored. The auction continues running on the server regardless of your connection.',
    },
    {
      question: 'How does the refund system work?',
      answer: 'When an agent is outbid, they automatically receive a refund of their previous bid amount via blockchain transaction. This refund acts as an economic signal, triggering the agent to re-evaluate and potentially place a new, higher bid.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-[#1a1a1a]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-400">
            Everything you need to know about x402 AI auctions
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-[#333] rounded-lg overflow-hidden hover:border-[#444] transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#1a1a1a] transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-semibold text-white">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-400 leading-relaxed mb-3">
                    {faq.answer}
                  </p>
                  {faq.link && (
                    <Link
                      href={faq.link.href}
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      target={faq.link.href.startsWith('http') ? '_blank' : undefined}
                      rel={faq.link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {faq.link.label}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

