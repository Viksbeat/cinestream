import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const data = JSON.parse(body);

    console.log('=== KORAPAY WEBHOOK RECEIVED ===');
    console.log('Full payload:', JSON.stringify(data, null, 2));
    
    if (data.event === 'charge.success' && data.data?.status === 'success') {
      const reference = data.data.reference;
      const customerEmail = data.data.customer?.email;
      const plan = data.data.metadata?.plan || 'monthly';

      console.log('Payment Success - Details:', { 
        reference, 
        customerEmail, 
        plan,
        amount: data.data.amount,
        currency: data.data.currency
      });

      if (!customerEmail) {
        console.error('ERROR: No email in webhook payload');
        return Response.json({ success: false, error: 'No email provided' }, { status: 400 });
      }

      // Find user by email
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      
      console.log(`Found ${users.length} user(s) with email: ${customerEmail}`);
      
      if (users.length === 0) {
        console.error('ERROR: User not found in database:', customerEmail);
        return Response.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const user = users[0];
      console.log('User found:', { id: user.id, email: user.email });

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

      console.log('Updating user subscription with:', updateData);

      await base44.asServiceRole.entities.User.update(user.id, updateData);
      
      console.log('✓ SUBSCRIPTION ACTIVATED SUCCESSFULLY');
      console.log('User can now watch movies until:', expiresAt.toISOString());
      
      return Response.json({ 
        success: true, 
        message: 'Subscription activated',
        user_email: customerEmail,
        plan: plan,
        expires_at: expiresAt.toISOString()
      });
    }

    console.log('Event not processed:', data.event);
    return Response.json({ success: true, message: 'Event received but not processed' });
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});