/**
 * Server Wallet Management
 *
 * Handles server wallet operations for the x402 auction system:
 * - Initialize server wallet (private key)
 * - Send USDC refunds to outbid agents (REFUND-AS-SIGNAL pattern)
 * - Check wallet balances
 *
 * REFUND-AS-SIGNAL IMPLEMENTATION:
 * When an agent is outbid, we immediately send their USDC back.
 * Agents monitor their wallet balance, and a balance increase signals they were outbid.
 * This eliminates the need for polling APIs or webhook infrastructure.
 */

import { encodeFunctionData, createPublicClient, http, createWalletClient, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ERC-20 ABI for transfer function
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export async function getServerWalletClient() {
  const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  if (!serverPrivateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(serverPrivateKey as `0x${string}`);

  // Create wallet client with public actions for x402
  // Type is intentionally inferred to ensure compatibility with x402's Signer type
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  return walletClient;
}

export async function getWalletBalance(): Promise<{ eth: string; usdc: string }> {
  const walletClient = await getServerWalletClient();

  // Create public client to read balances
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Get ETH balance
  const ethBalance = await publicClient.getBalance({
    address: walletClient.account.address,
  });

  // Get USDC balance
  const usdcBalance = await publicClient.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletClient.account.address],
  });

  return {
    eth: (Number(ethBalance) / 1e18).toFixed(6),
    usdc: (Number(usdcBalance) / 1e6).toFixed(6), // USDC has 6 decimals
  };
}

/**
 * Send USDC refund to an outbid agent
 *
 * This implements the REFUND-AS-SIGNAL pattern:
 * - When an agent is outbid, we immediately refund their USDC
 * - The agent monitors their balance and detects the increase
 * - Balance increase triggers immediate AI re-evaluation
 * - No polling, webhooks, or API calls needed
 *
 * This is more elegant than traditional notification systems because:
 * 1. Blockchain is the source of truth (no sync issues)
 * 2. No infrastructure needed (no webhook servers, queues, etc.)
 * 3. Economically aligned (agents get money back instantly)
 * 4. Self-healing (if agent misses the signal, they still have their money)
 *
 * @param toAddress - Agent's wallet address to refund
 * @param amountUSDC - Amount in USDC to refund (human-readable, e.g., 5.50)
 * @param network - Blockchain network (default: base-sepolia)
 * @returns Transaction hash of the refund
 */
export async function sendRefund(
  toAddress: string,
  amountUSDC: number,
  network: 'base-sepolia' = 'base-sepolia'
): Promise<string> {
  console.log(`💸 Sending USDC refund of ${amountUSDC} USDC to ${toAddress}...`);

  // Get wallet client with server private key
  const walletClient = await getServerWalletClient();

  // USDC has 6 decimals (1 USDC = 1,000,000 atomic units)
  const amountInAtomicUnits = BigInt(Math.floor(amountUSDC * 1_000_000));

  // Send USDC transfer directly using viem
  // This is the economic signal that tells the agent they've been outbid
  const txHash = await walletClient.sendTransaction({
    to: USDC_BASE_SEPOLIA,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountInAtomicUnits],
    }),
  });

  console.log(`✅ Refund sent! Tx: https://sepolia.basescan.org/tx/${txHash}`);

  return txHash;
}
