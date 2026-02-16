import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { userEmail } = body;

    // Get user details
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    return Response.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        subscription_status: targetUser.subscription_status || 'Not set',
        subscription_plan: targetUser.subscription_plan || 'Not set',
        subscription_expires_at: targetUser.subscription_expires_at || 'Not set',
        last_payment_reference: targetUser.last_payment_reference || 'Not set',
        created_date: targetUser.created_date
      },
      korapay_webhook_url: `https://${req.headers.get('host')}/api/functions/korapayWebhook`,
      instructions: [
        '1. Check if KORAPAY_SECRET_KEY is set correctly in Dashboard > Settings > Environment Variables',
        '2. Set this webhook URL in your Korapay dashboard: ' + `https://${req.headers.get('host')}/api/functions/korapayWebhook`,
        '3. Make sure webhook is enabled in Korapay settings',
        '4. Check Dashboard > Code > Functions > korapayWebhook for logs after payment'
      ]
    });
  } catch (error) {
    console.error('Check webhook logs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});