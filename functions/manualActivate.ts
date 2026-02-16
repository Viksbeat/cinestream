import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { plan } = await req.json();

    console.log('Manual activation requested:', { email: user.email, plan });

    const expiresAt = new Date();
    if (plan === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan === '6months') {
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (plan === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_status: 'active',
      subscription_plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
      last_payment_reference: `MANUAL_${Date.now()}`
    });

    console.log('✓ Subscription activated manually:', { 
      email: user.email, 
      plan, 
      expires: expiresAt.toISOString() 
    });

    return Response.json({ 
      success: true,
      message: 'Subscription activated',
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Manual activation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});