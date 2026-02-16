import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const data = JSON.parse(body);

    console.log('Webhook received:', JSON.stringify(data, null, 2));
    
    if (data.event === 'charge.success' && data.data.status === 'success') {
      const reference = data.data.reference;
      const customerEmail = data.data.customer.email;
      const plan = data.data.metadata?.plan || 'monthly';

      console.log('Processing subscription for:', customerEmail, 'Plan:', plan);

      // Find user and update subscription
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      
      console.log('Users found:', users.length);
      
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

        const updateData = {
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_expires_at: expiresAt.toISOString(),
          last_payment_reference: reference
        };

        console.log('Updating user with:', updateData);

        await base44.asServiceRole.entities.User.update(user.id, updateData);
        
        console.log('User updated successfully');
        
        return Response.json({ success: true, message: 'Subscription activated' });
      } else {
        console.error('User not found:', customerEmail);
        return Response.json({ success: false, error: 'User not found' }, { status: 404 });
      }
    }

    console.log('Event not processed:', data.event);
    return Response.json({ success: true, message: 'Event ignored' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});