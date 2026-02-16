import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const data = JSON.parse(body);

    // Verify webhook signature
    const signature = req.headers.get('x-korapay-signature');
    
    if (data.event === 'charge.success' && data.data.status === 'success') {
      const reference = data.data.reference;
      const customerEmail = data.data.customer.email;
      const plan = data.data.metadata?.plan || 'monthly';

      // Find user and update subscription
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      
      if (users.length > 0) {
        const user = users[0];
        const expiresAt = new Date();
        
        // Calculate expiration based on plan
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
          last_payment_reference: reference
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});