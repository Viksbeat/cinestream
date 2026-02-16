import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, full_name } = user;
    const reference = `SUB_${Date.now()}_${user.id}`;

    const korapayData = {
      amount: 2000,
      currency: "NGN",
      reference: reference,
      customer: {
        name: full_name,
        email: email
      },
      notification_url: `https://${req.headers.get('host')}/api/functions/korapayWebhook`,
      redirect_url: `https://${req.headers.get('host')}/subscription-success`
    };

    const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('KORAPAY_SECRET_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(korapayData)
    });

    const result = await response.json();

    if (result.status) {
      return Response.json({
        success: true,
        checkout_url: result.data.checkout_url,
        reference: reference
      });
    } else {
      return Response.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});