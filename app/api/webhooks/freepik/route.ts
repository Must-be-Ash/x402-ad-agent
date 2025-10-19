import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import { validateWebhookSignature } from '@/lib/webhook-security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 1. Validate webhook signature (security)
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');
    const webhookSignature = request.headers.get('webhook-signature');

    const isValid = validateWebhookSignature(
      webhookId,
      webhookTimestamp,
      webhookSignature,
      rawBody,
      process.env.WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 2. Extract task_id and image URL
    const webhookData = JSON.parse(rawBody);
    const { task_id, status, generated } = webhookData;

    console.log(`📥 [webhook] Received: task_id=${task_id}, status=${status}`);

    if (status !== 'completed' || !generated?.[0]?.url) {
      console.error('Image generation failed:', webhookData);
      return NextResponse.json(
        { error: 'Generation failed' },
        { status: 400 }
      );
    }

    const imageUrl = generated[0].url;
    console.log(`🎨 [webhook] Image URL: ${imageUrl}`);

    // 3. Find ad spot by task_id and update with image URL
    const { db } = await connectToDatabase();
    const result = await db.collection('adSpotRecords').findOneAndUpdate(
      { 'winnerAdImage.taskId': task_id },
      {
        $set: {
          'winnerAdImage.url': imageUrl,
          'winnerAdImage.generatedAt': new Date(),
          'status': 'displaying_ad'
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.error(`Ad spot not found for task_id: ${task_id}`);
      return NextResponse.json(
        { error: 'Ad spot not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [webhook] Updated ad spot: ${result.adSpotId}`);

    // 4. Broadcast event to frontend via SSE
    broadcastEvent(result.adSpotId, {
      type: 'ad_image_ready',
      imageUrl,
      winner: result.currentWinner,
      prompt: result.winnerAdImage?.prompt
    });

    console.log(`📡 [webhook] Broadcasted ad_image_ready event for ${result.adSpotId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing Freepik webhook:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
