import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('=== SUBSCRIPTION DEBUG ===');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Subscription Status:', user.subscription_status);
    console.log('Subscription Plan:', user.subscription_plan);
    console.log('Expires At:', user.subscription_expires_at);
    console.log('Last Payment Ref:', user.last_payment_reference);
    console.log('Current Time:', new Date().toISOString());
    
    const expiryDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < new Date() : true;
    const hasAccess = user.subscription_status === 'active' && !isExpired;

    console.log('Is Expired:', isExpired);
    console.log('Has Access:', hasAccess);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_expires_at: user.subscription_expires_at,
        last_payment_reference: user.last_payment_reference
      },
      computed: {
        is_expired: isExpired,
        has_access: hasAccess,
        expires_in_days: expiryDate ? Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null
      },
      current_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});