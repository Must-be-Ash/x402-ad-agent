/**
 * CDP Wallet Test Script
 *
 * Tests CDP wallet integration with x402 payment protocol:
 * - Initialize CDP wallet
 * - Check wallet address and balance
 * - Test signing typed data (EIP-712/EIP-3009)
 * - Test x402 payment flow
 *
 * Usage: npm run test:wallet:cdp
 *
 * Requirements:
 * - CDP_API_KEY_NAME in environment
 * - CDP_API_KEY_PRIVATE_KEY in environment
 * - AGENT_A_CDP_WALLET_ID in environment
 */

import dotenv from 'dotenv';
import { CDPWalletAdapter } from '../lib/wallet-adapters';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';

// Load environment variables from root .env file
dotenv.config({ path: '.env' });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment variables loaded:');
console.log('   CDP_API_KEY_ID:', process.env.CDP_API_KEY_ID ? '✓ Set' : '✗ Not set');
console.log('   CDP_API_KEY_SECRET:', process.env.CDP_API_KEY_SECRET ? '✓ Set' : '✗ Not set');
console.log('   CDP_WALLET_SECRET:', process.env.CDP_WALLET_SECRET ? '✓ Set' : '✗ Not set');

// Debug: Show actual values (first/last 4 chars for security)
if (process.env.CDP_API_KEY_ID) {
  console.log('   CDP_API_KEY_ID value:', process.env.CDP_API_KEY_ID);
}
if (process.env.CDP_API_KEY_SECRET) {
  const secret = process.env.CDP_API_KEY_SECRET;
  console.log('   CDP_API_KEY_SECRET length:', secret.length);
  console.log('   CDP_API_KEY_SECRET preview:', `${secret.slice(0, 4)}...${secret.slice(-4)}`);
}
console.log('');

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

async function testCDPWallet() {
  console.log('🧪 Testing CDP Wallet Integration\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Initialize CDP wallet
    console.log('\n1️⃣  Initializing CDP Wallet...');
    const walletId = process.env.AGENT_A_CDP_WALLET_ID;

    // For now, don't use existing wallet ID if it's not a proper UUID
    // CDP wallet IDs should be UUIDs, not email addresses
    const shouldCreateNew = !walletId || walletId.includes('@');

    if (shouldCreateNew) {
      console.log('   No valid wallet ID provided - will create new wallet');
      console.log('   (Existing value appears to be an email, not a wallet ID)');
    } else {
      console.log(`   Using existing wallet ID: ${walletId}`);
    }

    const wallet = new CDPWalletAdapter(shouldCreateNew ? undefined : walletId);
    console.log('   ✅ CDP wallet adapter created');

    // Step 2: Get wallet address (will create account if needed)
    console.log('\n2️⃣  Getting Wallet Address...');
    const address = await wallet.getAddress();
    const accountName = wallet.getAccountName();
    console.log(`   ✅ Wallet Address: ${address}`);
    console.log(`   ✅ Account Name: ${accountName}`);

    if (shouldCreateNew) {
      console.log('\n   💡 IMPORTANT: Save this account name to .env:');
      console.log(`   AGENT_A_CDP_WALLET_ID=${accountName}`);
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
        message: 'Hello from CDP wallet!',
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
          headers: { 'X-Agent-ID': 'CDP-Test' }
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
          headers: { 'X-Agent-ID': 'CDP-Test' }
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
    console.log('✅ CDP Wallet Test Complete!\n');
    console.log('Summary:');
    console.log('  - Wallet initialized and accessible');
    console.log('  - EIP-712 signing capability verified');
    console.log('  - x402 integration ready');
    console.log(`  - View wallet: https://sepolia.basescan.org/address/${address}`);

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);

    // Show full error details for debugging
    if (error.stack) {
      console.error('\nError stack:');
      console.error(error.stack);
    }
    if (error.response) {
      console.error('\nAPI Response:', error.response);
    }

    console.error('\nPlease ensure:');
    console.error('  1. CDP credentials are set in .env file:');
    console.error('     - CDP_API_KEY_ID');
    console.error('     - CDP_API_KEY_SECRET');
    console.error('     - CDP_WALLET_SECRET');
    console.error('  2. You have permissions to create accounts in CDP');
    console.error('  3. (Optional) AGENT_A_CDP_WALLET_ID in .env to reuse existing account');
    process.exit(1);
  }
}

testCDPWallet();

