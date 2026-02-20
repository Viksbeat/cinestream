import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userEmail } = await req.json();
    if (!userEmail) {
      return Response.json({ error: 'Missing userEmail' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const u = users[0];
    return Response.json({
      email: u.email,
      full_name: u.full_name,
      subscription_status: u.subscription_status,
      subscription_plan: u.subscription_plan,
      subscription_expires_at: u.subscription_expires_at,
      subscription_reference: u.subscription_reference,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});