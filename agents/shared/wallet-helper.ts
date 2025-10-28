import { createPublicClient } from 'viem';

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

type WalletType = 'privateKey' | 'cdp' | 'crossmint';

/**
 * WalletHelper
 *
 * Utility class for wallet operations across different wallet types.
 * Handles address retrieval and balance checking for CDP, privateKey, and Crossmint wallets.
 */
export class WalletHelper {
  constructor(
    private wallet: any,
    private walletType: WalletType,
    private publicClient: ReturnType<typeof createPublicClient>
  ) {}

  /**
   * Get the wallet address for any wallet type
   */
  async getAddress(): Promise<string> {
    if (this.walletType === 'cdp') {
      // CDP uses toAccount() which returns LocalAccount with .address property
      return this.wallet.address;
    }

    if (this.walletType === 'privateKey') {
      // privateKey wallet client has account.address
      return this.wallet.account.address;
    }

    // Crossmint adapter has async getAddress()
    return await this.wallet.getAddress();
  }

  /**
   * Get USDC balance for the wallet
   */
  async getUSDCBalance(): Promise<number> {
    const address = await this.getAddress();

    const balance = await this.publicClient.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    // USDC has 6 decimals
    return Number(balance) / 1_000_000;
  }
}
