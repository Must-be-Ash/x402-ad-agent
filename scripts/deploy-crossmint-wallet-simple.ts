/**
 * Deploy Crossmint Wallet Script (Simplified)
 *
 * This script checks if the Crossmint wallet is deployed.
 * Since Crossmint smart wallets are custodial and managed server-side,
 * deployment is typically handled automatically by Crossmint on first use.
 *
 * This script will:
 * 1. Check if the wallet has bytecode (is deployed)
 * 2. If not deployed, provide instructions for deployment
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

  try {
    // Use the wallet adapter to get the wallet address
    console.log('🔧 Initializing Crossmint wallet adapter...');
    const walletAdapter = new CrossmintWalletAdapter(crossmintApiKey, crossmintWalletLocator);

    console.log('📍 Fetching wallet address...');
    const walletAddress = await walletAdapter.getAddress();
    console.log(`   ✅ Address: ${walletAddress}\n`);

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
      // Check if wallet has ETH for gas
      const ethBalance = await publicClient.getBalance({
        address: walletAddress,
      });

      const ethBalanceEth = Number(ethBalance) / 1e18;
      console.log(`💰 Wallet ETH balance: ${ethBalanceEth.toFixed(6)} ETH`);

      if (ethBalance === BigInt(0)) {
        console.log('\n❌ Wallet has no ETH for gas fees');
        console.log('💡 Fund the wallet with test ETH:');
        console.log(`   1. Visit: https://www.alchemy.com/faucets/base-sepolia`);
        console.log(`   2. Send ETH to: ${walletAddress}`);
        console.log('   3. Run this script again after funding\n');
        process.exit(1);
      }

      console.log('\n📤 Sending deployment transaction...');
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
    } catch (deployError: any) {
      console.error('\n❌ Deployment failed:', deployError.message);
      console.error('\nFull error:', deployError);
    }

    console.log(`\n🔗 Wallet address: ${walletAddress}`);
    console.log(`🔗 View on Basescan: https://sepolia.basescan.org/address/${walletAddress}`);

  } catch (error: any) {
    console.error('\n❌ Failed to check wallet deployment status');
    console.error(`   Error: ${error.message}`);

    if (error.message?.includes('Invalid wallet locator')) {
      console.error('\n💡 Tip: Check your AGENT_B_CROSSMINT_WALLET_LOCATOR format');
      console.error('   Expected: email:user@example.com:evm:smart');
    }

    process.exit(1);
  }
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
