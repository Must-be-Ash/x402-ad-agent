import { CdpClient } from '@coinbase/cdp-sdk';
import { encodeFunctionData, createPublicClient, http, createWalletClient, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

let cdp: CdpClient;
let serverAccount: Awaited<ReturnType<CdpClient['evm']['getAccount']>> | undefined;

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

export async function initializeWallet() {
  if (cdp && serverAccount) {
    return { cdp, serverAccount };
  }

  // Initialize CDP client (automatically loads from environment variables)
  cdp = new CdpClient();

  // Get the existing server account by address (used for bid refunds)
  const serverAddress = process.env.ADDRESS;
  if (!serverAddress) {
    throw new Error('ADDRESS not set in environment');
  }

  serverAccount = await cdp.evm.getAccount({
    address: serverAddress as `0x${string}`
  });

  if (!serverAccount) {
    throw new Error('Failed to initialize server account from CDP');
  }

  console.log(`✅ Server wallet initialized: ${serverAccount.address}`);

  return { cdp, serverAccount };
}

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
  const { serverAccount } = await initializeWallet();

  // Create public client to read balances
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Get ETH balance
  const ethBalance = await publicClient.getBalance({
    address: serverAccount.address as `0x${string}`,
  });

  // Get USDC balance
  const usdcBalance = await publicClient.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [serverAccount.address as `0x${string}`],
  });

  return {
    eth: (Number(ethBalance) / 1e18).toFixed(6),
    usdc: (Number(usdcBalance) / 1e6).toFixed(6), // USDC has 6 decimals
  };
}

export async function sendRefund(
  toAddress: string,
  amountUSDC: number,
  network: 'base-sepolia' = 'base-sepolia'
): Promise<string> {
  const { cdp, serverAccount } = await initializeWallet();

  console.log(`💸 Sending USDC refund of ${amountUSDC} USDC to ${toAddress}...`);

  // USDC has 6 decimals
  const amountInAtomicUnits = BigInt(Math.floor(amountUSDC * 1_000_000));

  // Send USDC transfer using CDP SDK
  // This is the economic signal that tells the agent they've been outbid
  const { transactionHash } = await cdp.evm.sendTransaction({
    address: serverAccount.address,
    transaction: {
      to: USDC_BASE_SEPOLIA,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, amountInAtomicUnits],
      }),
    },
    network: network,
  });

  console.log(`✅ Refund sent! Tx: https://sepolia.basescan.org/tx/${transactionHash}`);

  return transactionHash;
}

export async function fundWalletFromFaucet(
  network: 'base-sepolia' = 'base-sepolia',
  token: 'eth' | 'usdc' = 'eth'
): Promise<string> {
  const { cdp, serverAccount } = await initializeWallet();

  console.log(`🚰 Requesting ${token.toUpperCase()} from faucet for ${serverAccount.address}...`);

  const { transactionHash } = await cdp.evm.requestFaucet({
    address: serverAccount.address,
    network,
    token,
  });

  console.log(`✅ Faucet funded! Tx: https://sepolia.basescan.org/tx/${transactionHash}`);

  return transactionHash;
}
