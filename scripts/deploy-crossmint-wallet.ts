/**
 * Deploy Crossmint Wallet Script
 *
 * This script checks if the Crossmint wallet is deployed (has bytecode on-chain).
 * If not deployed, it deploys the wallet by sending a transaction to itself.
 *
 * For smart contract wallets (like Crossmint), deployment happens when the first
 * transaction is sent. Sending a transaction to itself (0 value) is the simplest
 * way to trigger deployment.
 *
 * Usage: npm run deploy:crossmint
 */

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CrossmintWalletAdapter } from '../lib/wallet-adapters';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function main() {
  console.log('🔍 Crossmint Wallet Deployment Check\n');

  // Validate environment variables
  const crossmintApiKey = process.env.AGENT_B_CROSSMINT_API_KEY;
  const crossmintWalletLocator = process.env.AGENT_B_CROSSMINT_WALLET_LOCATOR;

  if (!crossmintApiKey) {
    console.error('❌ AGENT_B_CROSSMINT_API_KEY not set in .env');
    process.exit(1);
  }

  if (!crossmintWalletLocator) {
    console.error('❌ AGENT_B_CROSSMINT_WALLET_LOCATOR not set in .env');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Wallet Locator: ${crossmintWalletLocator}`);
  console.log(`   Network: Base Sepolia\n`);

  // Initialize Crossmint wallet adapter
  console.log('🔧 Initializing Crossmint wallet adapter...');
  const walletAdapter = new CrossmintWalletAdapter(crossmintApiKey, crossmintWalletLocator);

  // Get wallet address
  console.log('📍 Fetching wallet address...');
  const walletAddress = await walletAdapter.getAddress();
  console.log(`   Address: ${walletAddress}\n`);

  // Create public client to check deployment status
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Check if wallet is deployed (has bytecode)
  console.log('🔍 Checking deployment status...');
  const bytecode = await publicClient.getBytecode({
    address: walletAddress,
  });

  const isDeployed = bytecode && bytecode !== '0x' && bytecode.length > 2;

  if (isDeployed) {
    console.log('✅ Wallet is already deployed!');
    console.log(`   Bytecode length: ${bytecode?.length || 0} bytes`);
    console.log(`\n🔗 View on Basescan: https://sepolia.basescan.org/address/${walletAddress}`);
    return;
  }

  console.log('⚠️  Wallet is NOT deployed yet (no bytecode on-chain)');
  console.log('🚀 Deploying wallet by sending a self-transaction...\n');

  try {
    // Send a transaction to itself with 0 value
    // This triggers the smart wallet deployment
    console.log('📤 Sending deployment transaction...');
    console.log(`   From: ${walletAddress}`);
    console.log(`   To: ${walletAddress}`);
    console.log(`   Value: 0 ETH`);
    console.log(`   Data: 0x (empty)`);

    const txHash = await walletAdapter.sendTransaction({
      to: walletAddress,
      value: BigInt(0),
      data: '0x',
    });

    console.log(`\n✅ Deployment transaction sent!`);
    console.log(`   Transaction Hash: ${txHash}`);
    console.log(`   🔗 View on Basescan: https://sepolia.basescan.org/tx/${txHash}`);

    // Wait for transaction confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    if (receipt.status === 'success') {
      console.log('✅ Transaction confirmed!');
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

      // Verify deployment
      console.log('\n🔍 Verifying deployment...');
      const newBytecode = await publicClient.getBytecode({
        address: walletAddress,
      });

      if (newBytecode && newBytecode !== '0x' && newBytecode.length > 2) {
        console.log('✅ Wallet successfully deployed!');
        console.log(`   Bytecode length: ${newBytecode.length} bytes`);
        console.log(`\n🎉 Deployment complete!`);
      } else {
        console.log('⚠️  Transaction confirmed but bytecode not found.');
        console.log('   This might be normal for some wallet types.');
      }
    } else {
      console.log('❌ Transaction failed');
      console.log(`   Status: ${receipt.status}`);
    }

  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);

    // Check if error is due to wallet already being deployed
    if (error.message?.includes('already deployed') ||
        error.message?.includes('contract already exists')) {
      console.log('\n✅ Wallet is already deployed (caught by Crossmint SDK)');
      return;
    }

    // Check if error is due to insufficient funds
    if (error.message?.includes('insufficient funds') ||
        error.message?.includes('balance')) {
      console.log('\n💡 Tip: Make sure the wallet has sufficient ETH for gas fees');
      console.log(`   Fund wallet: https://www.alchemy.com/faucets/base-sepolia`);
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }

  console.log(`\n🔗 Wallet address: ${walletAddress}`);
  console.log(`🔗 View on Basescan: https://sepolia.basescan.org/address/${walletAddress}`);
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    console.error(error);
    process.exit(1);
  });
