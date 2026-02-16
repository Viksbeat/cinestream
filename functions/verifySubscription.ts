import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false, 
        hasAccess: false,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const isActive = user.subscription_status === 'active';
    const expiryDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const notExpired = expiryDate && expiryDate > new Date();
    const hasAccess = isActive || notExpired;

    console.log('Subscription check:', {
      email: user.email,
      status: user.subscription_status,
      expires: user.subscription_expires_at,
      hasAccess
    });

    return Response.json({
      success: true,
      hasAccess,
      subscription: {
        status: user.subscription_status,
        plan: user.subscription_plan,
        expires_at: user.subscription_expires_at
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});