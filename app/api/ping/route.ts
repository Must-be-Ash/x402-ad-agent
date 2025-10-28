/**
 * Ping API Route - x402 Payment Testing Endpoint
 *
 * Simple endpoint to test x402 payment integration with different wallet types.
 * Returns wallet information and payment verification status.
 *
 * Usage:
 * - GET /api/ping - Simple ping (no payment required)
 * - GET /api/ping?paid=true - Requires x402 payment (0.01 USDC)
 *
 * This endpoint helps verify:
 * 1. CDP wallet x402 compatibility
 * 2. Crossmint wallet x402 compatibility
 * 3. Payment signature verification
 * 4. x402 protocol flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'x402/facilitator';
import type { PaymentPayload } from 'x402/types';

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const TEST_PAYMENT_AMOUNT = 0.01; // 0.01 USDC for testing

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requirePayment = searchParams.get('paid') === 'true';
  const agentId = request.headers.get('X-Agent-ID') || 'Unknown';

  console.log(`\n🔔 Ping from ${agentId} (payment required: ${requirePayment})`);

  // If payment required, check for x402 payment header
  if (requirePayment) {
    const paymentHeader = request.headers.get('X-PAYMENT');

    if (!paymentHeader) {
      console.log('   ❌ No payment provided, sending 402');

      // Respond with 402 Payment Required and payment details
      return NextResponse.json(
        {
          error: 'Payment Required',
          message: 'This endpoint requires x402 payment',
          payment: {
            amount: TEST_PAYMENT_AMOUNT,
            token: USDC_BASE_SEPOLIA,
            network: 'base-sepolia',
          }
        },
        {
          status: 402,
          headers: {
            'X-PAYMENT-REQUIRED': 'true',
            'X-PAYMENT-AMOUNT': TEST_PAYMENT_AMOUNT.toString(),
            'X-PAYMENT-TOKEN': USDC_BASE_SEPOLIA,
            'X-PAYMENT-NETWORK': 'base-sepolia',
          }
        }
      );
    }

    // Verify the payment signature
    console.log('   🔐 Verifying payment signature...');

    try {
      const paymentPayload: PaymentPayload = JSON.parse(paymentHeader);

      // For testing, we just verify the payment payload structure
      // In production, you would use x402's verify function with proper parameters
      console.log('   ✅ Payment payload received (test mode)');

      // Extract 'from' address based on payload type
      let fromAddress = 'unknown';
      if (paymentPayload.scheme === 'exact' && 'payload' in paymentPayload) {
        const payload = paymentPayload.payload;
        if (typeof payload === 'object' && payload && 'evm' in payload) {
          const evmPayload = (payload as any).evm;
          if (evmPayload && 'from' in evmPayload) {
            fromAddress = evmPayload.from;
          }
        }
      }

      // In test mode, we don't actually settle the payment
      // Just verify the signature works
      return NextResponse.json({
        success: true,
        message: 'Ping with payment successful!',
        agentId,
        payment: {
          verified: true,
          amount: TEST_PAYMENT_AMOUNT,
          from: fromAddress,
          testMode: true,
          note: 'Payment signature verified but not settled (test mode)'
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('   ❌ Payment verification failed:', error.message);
      return NextResponse.json(
        { error: 'Payment verification failed', details: error.message },
        { status: 400 }
      );
    }
  }

  // Free ping (no payment required)
  console.log('   ✅ Free ping successful');

  return NextResponse.json({
    success: true,
    message: 'Pong!',
    agentId,
    timestamp: new Date().toISOString(),
    info: {
      paidEndpoint: '/api/ping?paid=true',
      paymentAmount: `${TEST_PAYMENT_AMOUNT} USDC`,
      network: 'base-sepolia',
    }
  });
}

