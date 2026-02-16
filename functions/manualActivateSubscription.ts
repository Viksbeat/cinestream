import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admin can manually activate subscriptions
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { userEmail, plan } = body;

    if (!userEmail || !plan) {
      return Response.json({ error: 'userEmail and plan required' }, { status: 400 });
    }

    // Find user
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    const expiresAt = new Date();
    
    // Calculate expiration based on plan
    if (plan === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan === '6months') {
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (plan === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    await base44.asServiceRole.entities.User.update(targetUser.id, {
      subscription_status: 'active',
      subscription_plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
      last_payment_reference: `MANUAL_${Date.now()}`
    });

    return Response.json({ 
      success: true, 
      message: 'Subscription activated manually',
      user: {
        email: targetUser.email,
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Manual activation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});