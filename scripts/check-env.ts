#!/usr/bin/env tsx
/**
 * Environment validation script
 * Checks that all required environment variables are set and properly formatted
 *
 * Usage: npm run check:env
 */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment files
dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'agents/.env' });

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const result: ValidationResult = {
  valid: true,
  errors: [],
  warnings: []
};

console.log('🔍 Validating environment configuration...\n');

// ============================================
// Check environment files exist
// ============================================
console.log('📁 Checking environment files...');

if (!existsSync('.env.local')) {
  result.errors.push('.env.local file not found. Copy .env.example to .env.local');
  result.valid = false;
} else {
  console.log('  ✅ .env.local exists');
}

if (!existsSync('agents/.env')) {
  result.errors.push('agents/.env file not found. Copy agents/.env.example to agents/.env');
  result.valid = false;
} else {
  console.log('  ✅ agents/.env exists');
}

console.log();

// ============================================
// Validate server configuration
// ============================================
console.log('🖥️  Checking server configuration...');

const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
const serverAddress = process.env.SERVER_WALLET_ADDRESS;

if (!serverPrivateKey) {
  result.errors.push('SERVER_WALLET_PRIVATE_KEY is not set in .env.local');
  result.valid = false;
} else if (!/^0x[a-fA-F0-9]{64}$/.test(serverPrivateKey)) {
  result.errors.push('SERVER_WALLET_PRIVATE_KEY has invalid format (should be 0x + 64 hex chars)');
  result.valid = false;
} else {
  console.log('  ✅ SERVER_WALLET_PRIVATE_KEY is set and valid format');
}

if (!serverAddress) {
  result.errors.push('SERVER_WALLET_ADDRESS is not set in .env.local');
  result.valid = false;
} else if (!/^0x[a-fA-F0-9]{40}$/.test(serverAddress)) {
  result.errors.push('SERVER_WALLET_ADDRESS has invalid format (should be 0x + 40 hex chars)');
  result.valid = false;
} else {
  console.log('  ✅ SERVER_WALLET_ADDRESS is set and valid format');
}

console.log();

// ============================================
// Validate agent configuration
// ============================================
console.log('🤖 Checking agent configuration...');

// Agent A - CDP Wallet
const cdpApiKeyId = process.env.CDP_API_KEY_ID;
const cdpApiKeySecret = process.env.CDP_API_KEY_SECRET;
const cdpWalletSecret = process.env.CDP_WALLET_SECRET;
const agentACdpWalletId = process.env.AGENT_A_CDP_WALLET_ID;

if (!cdpApiKeyId) {
  result.errors.push('CDP_API_KEY_ID is not set (required for Agent A)');
  result.valid = false;
} else {
  console.log('  ✅ CDP_API_KEY_ID is set');
}

if (!cdpApiKeySecret) {
  result.errors.push('CDP_API_KEY_SECRET is not set (required for Agent A)');
  result.valid = false;
} else {
  console.log('  ✅ CDP_API_KEY_SECRET is set');
}

if (!cdpWalletSecret) {
  result.errors.push('CDP_WALLET_SECRET is not set (required for Agent A)');
  result.valid = false;
} else if (cdpWalletSecret === 'secret' || cdpWalletSecret.length < 10) {
  result.errors.push('CDP_WALLET_SECRET appears to be a placeholder');
  result.valid = false;
} else {
  console.log('  ✅ CDP_WALLET_SECRET is set');
}

if (!agentACdpWalletId) {
  result.warnings.push('AGENT_A_CDP_WALLET_ID is not set. A new CDP wallet will be created on first run.');
  console.log('  ℹ️  AGENT_A_CDP_WALLET_ID not set (will create new wallet)');
} else {
  console.log('  ✅ AGENT_A_CDP_WALLET_ID is set');
}

// Agent B - Crossmint Wallet
const crossmintApiKey = process.env.AGENT_B_CROSSMINT_API_KEY;
const crossmintWalletLocator = process.env.AGENT_B_CROSSMINT_WALLET_LOCATOR;

if (!crossmintApiKey) {
  result.errors.push('AGENT_B_CROSSMINT_API_KEY is not set (required for Agent B)');
  result.valid = false;
} else {
  console.log('  ✅ AGENT_B_CROSSMINT_API_KEY is set');
}

if (!crossmintWalletLocator) {
  result.errors.push('AGENT_B_CROSSMINT_WALLET_LOCATOR is not set (required for Agent B)');
  result.valid = false;
} else if (!crossmintWalletLocator.startsWith('email:')) {
  result.warnings.push('AGENT_B_CROSSMINT_WALLET_LOCATOR format looks incorrect (should start with email:)');
  console.log('  ⚠️  AGENT_B_CROSSMINT_WALLET_LOCATOR format looks incorrect');
} else {
  console.log('  ✅ AGENT_B_CROSSMINT_WALLET_LOCATOR is set');
}

// Anthropic API Key
const anthropicKey = process.env.BID_ANTHROPIC_API_KEY;

if (!anthropicKey) {
  result.warnings.push('BID_ANTHROPIC_API_KEY is not set. AI agents will not work.');
  console.log('  ⚠️  BID_ANTHROPIC_API_KEY is not set (optional for basic demo)');
} else if (!anthropicKey.startsWith('sk-ant-')) {
  result.warnings.push('BID_ANTHROPIC_API_KEY format looks incorrect (should start with sk-ant-)');
  console.log('  ⚠️  BID_ANTHROPIC_API_KEY format looks incorrect');
} else {
  console.log('  ✅ BID_ANTHROPIC_API_KEY is set');
}

console.log();

// ============================================
// Check optional configuration
// ============================================
console.log('⚙️  Checking optional configuration...');

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log('  ℹ️  MongoDB URI is set - will use persistent storage');
} else {
  console.log('  ℹ️  MongoDB URI not set - will use in-memory storage');
}

const facilitatorUrl = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';
console.log(`  ℹ️  Facilitator URL: ${facilitatorUrl}`);

const auctionDuration = process.env.AUCTION_DURATION_MINUTES || '5';
console.log(`  ℹ️  Auction duration: ${auctionDuration} minutes`);

console.log();

// ============================================
// Display results
// ============================================
if (result.errors.length > 0) {
  console.log('❌ VALIDATION FAILED\n');
  console.log('Errors:');
  result.errors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
  console.log();
}

if (result.warnings.length > 0) {
  console.log('⚠️  WARNINGS\n');
  result.warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
  console.log();
}

if (result.valid && result.warnings.length === 0) {
  console.log('✅ ALL VALIDATIONS PASSED!\n');
  console.log('Your environment is properly configured.');
  console.log('\nNext steps:');
  console.log('  1. Fund your wallets: npm run fund:agents');
  console.log('  2. Start the server: npm run dev');
  console.log('  3. Start agents: npm run agent:ai:a (in new terminal)');
  console.log('  4. Open browser: http://localhost:3000/auction/demo-spot-1');
} else if (result.valid) {
  console.log('✅ REQUIRED CONFIGURATION VALID\n');
  console.log('Your environment meets minimum requirements.');
  console.log('Address warnings above for full functionality.');
} else {
  console.log('Please fix the errors above and run this script again.');
  console.log('\nFor help, see README.md or run: npm run setup:help');
  process.exit(1);
}

