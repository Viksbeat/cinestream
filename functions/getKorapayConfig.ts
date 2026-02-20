import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({
      public_key: Deno.env.get('KORAPAY_PUBLIC_KEY') || ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});