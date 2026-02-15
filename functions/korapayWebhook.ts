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

      // Find user and update subscription
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      
      if (users.length > 0) {
        const user = users[0];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'active',
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