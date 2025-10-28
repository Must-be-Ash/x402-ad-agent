/**
 * Wallet Adapters for x402 Compatibility
 *
 * This module provides adapters to make CDP and Crossmint wallets compatible with
 * the x402 payment protocol and viem's Signer interface.
 *
 * x402-axios expects wallets to implement:
 * - signTypedData() for EIP-3009 payment authorizations
 * - account.address property
 * - chain configuration (Base Sepolia)
 *
 * NOTE: These are adapter stubs that provide the interface. The actual CDP and Crossmint
 * SDK methods may need adjustment based on the specific SDK version and API changes.
 * The adapters are designed to be compatible with viem and x402-axios.
 */

import { CdpClient } from '@coinbase/cdp-sdk';
import { CrossmintWallets, createCrossmint, EVMWallet } from '@crossmint/wallets-sdk';
import { http } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Address, Hex, TypedDataDefinition } from 'viem';

/**
 * CDP Wallet Adapter
 *
 * Wraps Coinbase CDP wallet to work with x402 payment protocol
 *
 * NOTE: Initialize CDP client with API credentials from environment:
 * - CDP_API_KEY_ID
 * - CDP_API_KEY_SECRET
 * - CDP_WALLET_SECRET
 *
 * The account will be created on first use if accountName is not provided.
 */
export class CDPWalletAdapter {
  private cdp: CdpClient;
  private accountName: string;
  private cachedAddress: Address | null = null;
  private accountCreated: boolean = false;

  constructor(accountName?: string) {
    // Initialize CDP client with credentials from environment
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;
    const walletSecret = process.env.CDP_WALLET_SECRET;

    console.log('🔑 Initializing CDP client...');
    console.log('   API Key ID:', apiKeyId ? `${apiKeyId.slice(0, 8)}...` : 'NOT SET');
    console.log('   API Key Secret:', apiKeySecret ? `${apiKeySecret.length} chars` : 'NOT SET');
    console.log('   Wallet Secret:', walletSecret ? `${walletSecret.length} chars` : 'NOT SET');

    // Validate wallet secret isn't a placeholder
    if (walletSecret && (walletSecret === 'secret' || walletSecret.length < 10)) {
      throw new Error(
        'CDP_WALLET_SECRET appears to be a placeholder. Please generate a real wallet secret at https://portal.cdp.coinbase.com/'
      );
    }

    this.cdp = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret,
      debugging: true, // Enable debugging
    } as any);

    // Use provided account name or generate a unique one
    this.accountName = accountName || `agent-${Date.now()}`;
  }

  /**
   * Ensure account is initialized (create if needed)
   * Using CDP SDK's getOrCreateAccount which handles both cases
   */
  private async ensureAccount(): Promise<void> {
    if (this.accountCreated) {
      return;
    }

    try {
      console.log(`Getting or creating CDP account: ${this.accountName}...`);
      const account = await this.cdp.evm.getOrCreateAccount({
        name: this.accountName,
      });

      this.cachedAddress = account.address as Address;
      this.accountCreated = true;
      console.log(`✅ CDP account ready: ${this.accountName}`);
      console.log(`   Address: ${account.address}`);
    } catch (error: any) {
      console.error('❌ Failed to create/get CDP account:', error.message);
      if (error.response) {
        console.error('API Response:', JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get the wallet account information
   * For compatibility with x402-axios which accesses this synchronously
   * NOTE: getAddress() must be called before using with x402-axios
   */
  get account() {
    if (!this.cachedAddress) {
      throw new Error('CDP wallet not initialized. Call getAddress() or ensureAccount() before using wallet with x402-axios.');
    }
    return {
      address: this.cachedAddress,
      type: 'cdp' as const,
    };
  }

  /**
   * Get chain configuration (Base Sepolia)
   */
  get chain() {
    return baseSepolia;
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<Address> {
    await this.ensureAccount();

    if (!this.cachedAddress) {
      throw new Error('Account address not available');
    }

    return this.cachedAddress;
  }

  /**
   * Sign typed data (EIP-712)
   * Required for x402 payment authorizations (EIP-3009)
   */
  async signTypedData(typedData: TypedDataDefinition): Promise<Hex> {
    await this.ensureAccount();

    // CDP SDK's signTypedData for EIP-712
    const signature = await this.cdp.evm.signTypedData({
      address: this.cachedAddress!,
      domain: typedData.domain as any,
      types: typedData.types as any,
      primaryType: typedData.primaryType as string,
      message: typedData.message as Record<string, any>,
    } as any); // Type assertion for SDK version compatibility

    // Extract signature string from result (could be string or object with signature field)
    const sigString = typeof signature === 'string' ? signature : (signature as any).signature;
    return sigString as Hex;
  }

  /**
   * Send a transaction
   */
  async sendTransaction(tx: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }): Promise<Hex> {
    await this.ensureAccount();

    // Send transaction using CDP SDK
    const result = await this.cdp.evm.sendTransaction({
      address: this.cachedAddress!,
      network: 'base-sepolia',
      transaction: {
        to: tx.to,
        data: tx.data || '0x',
        value: tx.value || BigInt(0),
      },
    } as any); // Type assertion for SDK version compatibility

    return result.transactionHash as Hex;
  }

  /**
   * Get the account name
   */
  getAccountName(): string {
    return this.accountName;
  }

  /**
   * Get the underlying CDP client (for balance checks, etc.)
   */
  getCDPClient() {
    return this.cdp;
  }
}

/**
 * Crossmint Wallet Adapter
 *
 * Wraps Crossmint wallet SDK to work with x402 payment protocol
 */
export class CrossmintWalletAdapter {
  private crossmintWallets: CrossmintWallets;
  private walletLocator: string;
  private signerEmail: string;
  private cachedAddress: Address | null = null;
  private cachedWallet: EVMWallet | null = null;

  constructor(apiKey: string, walletLocator: string) {
    const crossmint = createCrossmint({ apiKey });
    this.crossmintWallets = CrossmintWallets.from(crossmint);
    this.walletLocator = walletLocator;

    // Extract email from locator (format: email:user@domain.com:chain:type)
    const parts = walletLocator.split(':');
    if (parts[0] !== 'email' || !parts[1]) {
      throw new Error('Invalid wallet locator format. Expected: email:user@domain.com:chain:type');
    }
    this.signerEmail = parts[1];
  }

  private async getWalletInstance(): Promise<EVMWallet> {
    if (this.cachedWallet) {
      return this.cachedWallet;
    }

    try {
      console.log(`   🔍 Getting wallet with locator: ${this.walletLocator}`);

      // For server-side usage, use getWallet with api-key signer type
      // The wallet must already exist in Crossmint (created via dashboard or API)
      const wallet = await this.crossmintWallets.getWallet(this.walletLocator, {
        chain: 'base-sepolia',
        signer: {
          type: 'api-key' as const,
        },
      } as any);

      console.log('   🔍 Wallet fetched successfully');

      // Import EVMWallet dynamically to access .from() method
      const { EVMWallet } = await import('@crossmint/wallets-sdk');

      // Properly convert to EVMWallet using .from() method
      this.cachedWallet = EVMWallet.from(wallet as any);
      console.log('   ✅ EVM wallet ready');
      return this.cachedWallet;
    } catch (error: any) {
      console.error('   ❌ Error in getWalletInstance:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get the wallet account information
   * For compatibility with x402-axios which accesses this synchronously
   * NOTE: getAddress() must be called before using with x402-axios
   */
  get account() {
    if (!this.cachedAddress) {
      throw new Error('Crossmint wallet not initialized. Call getAddress() before using wallet with x402-axios.');
    }
    return {
      address: this.cachedAddress,
      type: 'crossmint' as const,
    };
  }

  /**
   * Get chain configuration (Base Sepolia)
   */
  get chain() {
    return baseSepolia;
  }

  /**
   * Get transport (required for x402 compatibility)
   * This makes the adapter pass x402-axios's isSignerWallet() check
   */
  get transport() {
    return http();
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<Address> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    const wallet = await this.getWalletInstance();
    this.cachedAddress = wallet.address as Address;
    return this.cachedAddress;
  }

  /**
   * Sign typed data (EIP-712)
   * Required for x402 payment authorizations (EIP-3009)
   */
  async signTypedData(typedData: TypedDataDefinition): Promise<Hex> {
    const wallet = await this.getWalletInstance();

    const result = await wallet.signTypedData({
      chain: 'base-sepolia' as any, // Required by Crossmint SDK
      domain: typedData.domain as any,
      types: typedData.types as any,
      primaryType: typedData.primaryType as string,
      message: typedData.message as Record<string, any>,
    } as any);

    return result.signature as Hex;
  }

  /**
   * Send a transaction
   *
   * Uses the Crossmint SDK's EVMWallet sendTransaction method.
   * This properly handles transactions through Crossmint's API.
   */
  async sendTransaction(tx: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }): Promise<Hex> {
    const wallet = await this.getWalletInstance();

    try {
      // wallet is already an EVMWallet instance from getWalletInstance()
      // Use Crossmint SDK's sendTransaction method
      // Format matches the SDK's expected parameters
      const result = await wallet.sendTransaction({
        to: tx.to,
        value: tx.value?.toString() || '0',
        data: tx.data || '0x',
      });

      console.log('   🔍 Transaction result:', result);

      // Extract transaction hash
      const txHash = result.hash || result.transactionHash;

      if (!txHash || typeof txHash !== 'string') {
        console.error('   ⚠️  Unexpected result structure:', result);
        throw new Error('Transaction hash not found in result');
      }

      return txHash as Hex;
    } catch (error: any) {
      console.error('   ❌ sendTransaction error:', error.message);
      if (error.response) {
        console.error('   API Response:', error.response);
      }
      throw error;
    }
  }

  /**
   * Get the underlying Crossmint wallets service (for balance checks, etc.)
   */
  getCrossmintWallets() {
    return this.crossmintWallets;
  }
}

/**
 * Type guard to check if adapter is CDP
 */
export function isCDPAdapter(adapter: CDPWalletAdapter | CrossmintWalletAdapter): adapter is CDPWalletAdapter {
  return 'getCDPClient' in adapter;
}

/**
 * Type guard to check if adapter is Crossmint
 */
export function isCrossmintAdapter(adapter: CDPWalletAdapter | CrossmintWalletAdapter): adapter is CrossmintWalletAdapter {
  return 'getCrossmintWallets' in adapter;
}

