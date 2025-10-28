/**
 * Check Server Balance Script
 *
 * Displays the current ETH and USDC balance of the server wallet.
 * Useful for verifying the server has enough USDC to issue refunds.
 *
 * Usage:
 *   npm run check:server
 *
 * Requirements:
 * - SERVER_WALLET_ADDRESS set in .env.local
 */

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

async function main() {
  console.log('🔍 Checking server wallet balance...\n');

  const serverAddress = process.env.SERVER_WALLET_ADDRESS;

  if (!serverAddress) {
    console.error('❌ SERVER_WALLET_ADDRESS not set in .env.local');
    process.exit(1);
  }

  console.log(`Server address: ${serverAddress}\n`);

  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Get ETH balance
    const ethBalance = await publicClient.getBalance({
      address: serverAddress as `0x${string}`,
    });

    // Get USDC balance
    const usdcBalance = await publicClient.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [serverAddress as `0x${string}`],
    });

    console.log('💰 Server Wallet Balances:');
    console.log(`   ETH:  ${(Number(ethBalance) / 1e18).toFixed(6)}`);
    console.log(`   USDC: ${(Number(usdcBalance) / 1e6).toFixed(6)}`);
    console.log(`\n🔗 View on BaseScan: https://sepolia.basescan.org/address/${serverAddress}`);
  } catch (error: any) {
    console.error('❌ Error checking balance:', error.message);
  }
}

main();

