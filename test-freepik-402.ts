import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains'; // BASE MAINNET for Freepik
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'agents/.env' });

const FREEPIK_API_URL = 'https://api.freepik.com/v1/x402/ai/mystic';
const LOCAL_WEBHOOK_CHECK_URL = 'http://localhost:3000/api/webhooks/freepik';

async function testFreepikImageGeneration() {
  console.log('🧪 Testing Freepik x402 Image Generation (Base Mainnet)\n');

  // Check webhook configuration
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('⚠️  WARNING: WEBHOOK_URL not configured!');
    console.log('   Freepik needs a PUBLIC webhook URL to send the image when ready.');
    console.log('   For local testing, set up ngrok and add to .env.local:');
    console.log('   1. Run: ngrok http 3000');
    console.log('   2. Add to .env.local: WEBHOOK_URL=https://YOUR-NGROK-URL.ngrok.io/api/webhooks/freepik');
    console.log('   3. Make sure your dev server is running: npm run dev\n');
    console.log('   Continuing with localhost URL (will NOT receive webhook)...\n');
  } else {
    console.log(`✅ Webhook URL configured: ${webhookUrl}\n`);
  }

  // Create wallet client on BASE MAINNET
  const wallet = createWalletClient({
    chain: base, // MAINNET!
    transport: http(),
    account: privateKeyToAccount(process.env.AGENT_A_PRIVATE_KEY as `0x${string}`),
  });

  console.log(`💼 Wallet: ${wallet.account.address}`);
  console.log(`⚠️  Using Base MAINNET for Freepik payment\n`);

  // Create axios instance with x402 payment interceptor
  const axiosWithPayment = withPaymentInterceptor(
    axios.create({
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': process.env.FREEPIK_API_KEY,
      },
    }),
    wallet as any
  );

  const testPrompt = 'A pristine glass bottle of crystal-clear premium water on a minimalist white background with soft blue lighting, professional product photography, high detail, clean composition';

  console.log(`📝 Test Prompt: "${testPrompt}"\n`);

  try {
    console.log('💳 Making x402 payment call to Freepik...');

    // Use webhook URL from env or fallback to localhost
    const finalWebhookUrl = webhookUrl || 'http://localhost:3000/api/webhooks/freepik';

    const response = await axiosWithPayment.post(FREEPIK_API_URL, {
      prompt: testPrompt,
      model: 'realism',
      resolution: '1k',
      aspect_ratio: 'widescreen_16_9',
      webhook_url: finalWebhookUrl
    });

    console.log('\n✅ Response received!');
    console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

    const taskId = response.data.task_id || response.data.data?.task_id || response.data.id;

    if (!taskId) {
      throw new Error(`No task ID in response: ${JSON.stringify(response.data)}`);
    }

    console.log(`\n🎫 Task ID: ${taskId}`);
    console.log(`📡 Webhook URL sent to Freepik: ${finalWebhookUrl}`);
    console.log('⏳ Waiting for webhook callback (image generation takes ~30 seconds)...\n');

    if (webhookUrl) {
      console.log('✅ Webhook is configured - polling our local endpoint for results...\n');
    } else {
      console.log('⚠️  Without ngrok, we cannot receive webhooks. Trying Freepik status API fallback...\n');
    }

    // Poll Freepik status API to check task completion
    let imageUrl = '';
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes (3 seconds per attempt)

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;

      try {
        // Poll Freepik's status API directly
        const statusResponse = await axios.get(
          `https://api.freepik.com/v1/ai/mystic/${taskId}`,
          {
            headers: {
              'x-freepik-api-key': process.env.FREEPIK_API_KEY,
            },
          }
        );

        if (attempts === 1) {
          console.log('📊 First status check:', JSON.stringify(statusResponse.data, null, 2));
        }

        // Response structure matches Freepik API: { data: { task_id, status, generated: [] } }
        const taskData = statusResponse.data.data || statusResponse.data;
        const status = taskData.status;
        const generated = taskData.generated;

        // Check completion by looking for images in generated array (same as working example)
        if (generated && generated.length > 0) {
          imageUrl = generated[0];
          console.log(`\n🎉 SUCCESS! Image generated!`);
          console.log(`🔗 Image URL: ${imageUrl}\n`);
        } else if (status === 'FAILED' || status === 'failed' || status === 'ERROR' || status === 'error') {
          throw new Error(`Image generation failed: ${taskData.error || 'Unknown error'}`);
        } else {
          // Still processing (IN_PROGRESS, CREATED, etc.)
          if (attempts % 5 === 0) {
            console.log(`\n   Status: ${status} (${attempts * 3}s elapsed)`);
          } else {
            process.stdout.write('.');
          }
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Task not ready yet
          process.stdout.write('.');
        } else if (error.message.includes('Image generation failed')) {
          throw error;
        } else {
          console.error('\n⚠️  Error checking status:', error.message);
          process.stdout.write('!');
        }
      }
    }

    if (!imageUrl) {
      throw new Error('Timeout waiting for image generation');
    }

    console.log('\n✅ Test Complete!');
    console.log(`🖼️  Image URL: ${imageUrl}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('📡 Response Status:', error.response.status);
      console.error('📡 Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testFreepikImageGeneration();
