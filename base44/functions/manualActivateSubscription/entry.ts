import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userEmail, plan } = await req.json();
    if (!userEmail || !plan) {
      return Response.json({ error: 'Missing userEmail or plan' }, { status: 400 });
    }

    const now = new Date();
    let expiresAt;
    if (plan === 'monthly') {
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    } else if (plan === '6months') {
      expiresAt = new Date(now.setMonth(now.getMonth() + 6));
    } else if (plan === 'annual') {
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.User.update(users[0].id, {
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    });

    return Response.json({ success: true, expires_at: expiresAt.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});