import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CDPWalletAdapter, CrossmintWalletAdapter } from '../../../lib/wallet-adapters';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

/**
 * Cached wallet adapters (reused across requests)
 * This avoids expensive re-initialization and API calls on every balance check
 */
let cachedCDPAdapter: CDPWalletAdapter | null = null;
let cachedCrossmintAdapter: CrossmintWalletAdapter | null = null;

/**
 * Get or create CDP wallet adapter (cached)
 */
function getCDPAdapter(): CDPWalletAdapter | null {
  if (!cachedCDPAdapter) {
    const cdpWalletId = process.env.AGENT_A_CDP_WALLET_ID;
    if (!cdpWalletId) {
      console.warn('⚠️ AGENT_A_CDP_WALLET_ID not configured for Agent A');
      return null;
    }
    console.log('🔧 Initializing CDP adapter (first time)...');
    cachedCDPAdapter = new CDPWalletAdapter(cdpWalletId);
  }
  return cachedCDPAdapter;
}

/**
 * Get or create Crossmint wallet adapter (cached)
 */
function getCrossmintAdapter(): CrossmintWalletAdapter | null {
  if (!cachedCrossmintAdapter) {
    const crossmintApiKey = process.env.AGENT_B_CROSSMINT_API_KEY;
    const crossmintWalletLocator = process.env.AGENT_B_CROSSMINT_WALLET_LOCATOR;

    if (!crossmintApiKey || !crossmintWalletLocator) {
      console.warn('⚠️ AGENT_B_CROSSMINT_API_KEY or AGENT_B_CROSSMINT_WALLET_LOCATOR not configured for Agent B');
      return null;
    }
    console.log('🔧 Initializing Crossmint adapter (first time)...');
    cachedCrossmintAdapter = new CrossmintWalletAdapter(crossmintApiKey, crossmintWalletLocator);
  }
  return cachedCrossmintAdapter;
}

/**
 * Get agent wallet addresses using cached wallet adapters
 * Agent A uses CDP wallet, Agent B uses Crossmint wallet
 *
 * Performance: First call ~1.5-2s (fetches from APIs), subsequent calls <100ms (uses cache)
 */
async function getAgentAddresses(): Promise<Record<string, string | undefined>> {
  const addresses: Record<string, string | undefined> = {};

  // Agent A - CDP Wallet
  // Use the agent name from env, fallback to 'CDP Agent'
  const agentAName = process.env.AGENT_A_NAME || 'CDP Agent';
  try {
    const cdpAdapter = getCDPAdapter();
    if (cdpAdapter) {
      addresses[agentAName] = await cdpAdapter.getAddress(); // Uses internal cache after first call
    }
  } catch (error) {
    console.error('Failed to get Agent A (CDP) address:', error);
  }

  // Agent B - Crossmint Wallet
  // Use the agent name from env, fallback to 'Crossmint Agent'
  const agentBName = process.env.AGENT_B_NAME || 'Crossmint Agent';
  try {
    const crossmintAdapter = getCrossmintAdapter();
    if (crossmintAdapter) {
      addresses[agentBName] = await crossmintAdapter.getAddress(); // Uses internal cache after first call
    }
  } catch (error) {
    console.error('Failed to get Agent B (Crossmint) address:', error);
  }

  return addresses;
}

export async function GET(request: NextRequest) {
  try {
    // Get agent addresses using their respective wallet adapters
    const AGENT_ADDRESSES = await getAgentAddresses();

    // Create public client to read balances
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const balances: Record<string, number> = {};
    const addresses: Record<string, string | undefined> = {};

    // Fetch balances for each agent
    for (const [agentName, address] of Object.entries(AGENT_ADDRESSES)) {
      addresses[agentName] = address;

      if (!address) {
        console.warn(`⚠️ No wallet address configured for ${agentName}`);
        balances[agentName] = 0;
        continue;
      }

      try {
        const usdcBalance = await publicClient.readContract({
          address: USDC_BASE_SEPOLIA,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        // USDC has 6 decimals
        balances[agentName] = Number(usdcBalance) / 1_000_000;
      } catch (error) {
        console.error(`Failed to fetch balance for ${agentName}:`, error);
        balances[agentName] = 0;
      }
    }

    return NextResponse.json({ balances, addresses });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching agent balances:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch agent balances' },
      { status: 500 }
    );
  }
}

