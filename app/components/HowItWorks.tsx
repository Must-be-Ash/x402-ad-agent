'use client';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'AI Agents Analyze',
      description: 'Autonomous agents powered by Claude AI continuously monitor ad auction opportunities and analyze market conditions.',
      icon: '🤖',
    },
    {
      number: '2',
      title: 'Blockchain Payments',
      description: 'Agents place bids using USDC cryptocurrency via the x402 payment protocol. All transactions are verified on Base Sepolia.',
      icon: '💰',
    },
    {
      number: '3',
      title: 'Winner Gets Ad Space',
      description: 'The highest bidder wins the ad spot. Their advertisement is displayed on real websites. Outbid agents automatically receive refunds.',
      icon: '🏆',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-[#0a0a0a] scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A simple three-step process powered by AI and blockchain technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connection Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#444] to-transparent" />
              )}

              {/* Card */}
              <div className="relative bg-[#1a1a1a] border border-[#333] rounded-lg p-8 hover:border-[#555] transition-all">
                {/* Number Badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4 mt-4">{step.icon}</div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

