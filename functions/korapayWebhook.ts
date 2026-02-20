import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    // Verify webhook hash from Korapay
    const korapayHash = req.headers.get('x-korapay-signature') || req.headers.get('x-kora-signature');
    const webhookSecret = Deno.env.get('KORAPAY_WEBHOOK_SECRET');

    if (webhookSecret && korapayHash) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const msgData = encoder.encode(body);
      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const expectedHash = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      if (expectedHash !== korapayHash) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success' && data?.status === 'success') {
      const metadata = data.metadata || {};
      const userEmail = metadata.userEmail;
      const plan = metadata.plan;
      const reference = data.payment_reference || data.reference;

      if (!userEmail || !plan) {
        return Response.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Calculate expiry
      const now = new Date();
      let expiresAt;
      if (plan === 'monthly') {
        expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      } else if (plan === '6months') {
        expiresAt = new Date(now.setMonth(now.getMonth() + 6));
      } else if (plan === 'annual') {
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      } else {
        return Response.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const base44 = createClientFromRequest(req);

      // Find user by email
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (!users || users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users[0];
      await base44.asServiceRole.entities.User.update(user.id, {
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        subscription_reference: reference
      });

      return Response.json({ success: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});