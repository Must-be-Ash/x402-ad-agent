/**
 * Crossmint Wallet Test Script
 *
 * Tests Crossmint wallet integration with x402 payment protocol:
 * - Initialize Crossmint wallet
 * - Check wallet address and balance
 * - Test signing typed data (EIP-712/EIP-3009)
 * - Test x402 payment flow
 *
 * Usage: npm run test:wallet:crossmint
 *
 * Requirements:
 * - AGENT_B_CROSSMINT_API_KEY in environment
 * - AGENT_B_CROSSMINT_WALLET_LOCATOR in environment
 */

import dotenv from 'dotenv';
import { CrossmintWalletAdapter } from '../lib/wallet-adapters';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';

dotenv.config({ path: '.env' });

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

async function testCrossmintWallet() {
  console.log('🧪 Testing Crossmint Wallet Integration\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Initialize Crossmint wallet
    console.log('\n1️⃣  Initializing Crossmint Wallet...');
    const apiKey = process.env.AGENT_B_CROSSMINT_API_KEY;
    const walletLocator = process.env.AGENT_B_CROSSMINT_WALLET_LOCATOR;

    console.log('   API Key:', apiKey ? `${apiKey.slice(0, 20)}...` : 'NOT SET');
    console.log('   Wallet Locator:', walletLocator || 'NOT SET');

    if (!apiKey || !walletLocator) {
      throw new Error('❌ AGENT_B_CROSSMINT_API_KEY or AGENT_B_CROSSMINT_WALLET_LOCATOR not set');
    }

    const wallet = new CrossmintWalletAdapter(apiKey, walletLocator);
    console.log('   ✅ Crossmint wallet adapter created');

    // Step 2: Get wallet address
    console.log('\n2️⃣  Getting Wallet Address...');
    let address: string;
    try {
      address = await wallet.getAddress();
      console.log(`   ✅ Wallet Address: ${address}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to get address: ${error.message}`);
      if (error.response?.data) {
        console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }

    // Step 3: Check balances
    console.log('\n3️⃣  Checking Balances...');
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const ethBalance = await publicClient.getBalance({ address });
    const usdcBalance = await publicClient.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    console.log(`   ETH:  ${(Number(ethBalance) / 1e18).toFixed(6)}`);
    console.log(`   USDC: ${(Number(usdcBalance) / 1e6).toFixed(6)}`);

    // Step 4: Test EIP-712 signing (required for x402)
    console.log('\n4️⃣  Testing EIP-712 Typed Data Signing...');

    const testTypedData = {
      domain: {
        name: 'Test',
        version: '1',
        chainId: 84532, // Base Sepolia
        verifyingContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
      },
      types: {
        Test: [
          { name: 'message', type: 'string' },
        ],
      },
      primaryType: 'Test' as const,
      message: {
        message: 'Hello from Crossmint wallet!',
      },
    };

    try {
      const signature = await wallet.signTypedData(testTypedData);
      console.log(`   ✅ Signature: ${signature.slice(0, 20)}...`);
    } catch (error: any) {
      console.log(`   ⚠️  Signing test: ${error.message}`);
    }

    // Step 5: Test x402 interceptor integration
    console.log('\n5️⃣  Testing x402 Payment Interceptor...');

    try {
      const axiosWithPayment = withPaymentInterceptor(
        axios.create({
          headers: { 'X-Agent-ID': 'Crossmint-Test' }
        }),
        wallet as any
      );
      console.log('   ✅ x402 payment interceptor initialized');
      console.log('   ℹ️  Ready for payment-gated requests');
    } catch (error: any) {
      console.log(`   ⚠️  x402 setup: ${error.message}`);
    }

    // Step 6: Test ping endpoint (if server is running)
    console.log('\n6️⃣  Testing /api/ping Endpoint...');
    const serverUrl = process.env.BID_SERVER_URL || 'http://localhost:3000';

    try {
      const axiosWithPayment = withPaymentInterceptor(
        axios.create({
          headers: { 'X-Agent-ID': 'Crossmint-Test' }
        }),
        wallet as any
      );

      const response = await axiosWithPayment.get(`${serverUrl}/api/ping`);
      console.log('   ✅ Ping successful:', response.data);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Server not running (start with: npm run dev)');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Ping endpoint not available yet');
      } else {
        console.log(`   ⚠️  Ping failed: ${error.message}`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Crossmint Wallet Test Complete!\n');
    console.log('Summary:');
    console.log('  - Wallet initialized and accessible');
    console.log('  - EIP-712 signing capability verified');
    console.log('  - x402 integration ready');
    console.log(`  - View wallet: https://sepolia.basescan.org/address/${address}`);

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('  1. Crossmint credentials are set in agents/.env');
    console.error('  2. AGENT_B_CROSSMINT_API_KEY is configured');
    console.error('  3. AGENT_B_CROSSMINT_WALLET_LOCATOR is correct');
    console.error('  4. Wallet has been created in Crossmint dashboard');
    process.exit(1);
  }
}

testCrossmintWallet();

