import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both: called from automation (event payload) or directly
    let email, full_name;

    if (body?.event?.entity_name === 'User' && body?.data) {
      // Called from entity automation
      email = body.data.email;
      full_name = body.data.full_name;
    } else {
      // Called manually / from frontend
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      email = user.email;
      full_name = user.full_name;
    }

    if (!email) {
      return Response.json({ error: 'No email found' }, { status: 400 });
    }

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    const subject = 'Welcome to MYVIBEFLIX! 🎬';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 32px; margin: 0;">MYVIBEFLIX</h1>
          <p style="color: #999; font-size: 14px; margin: 5px 0;">YOUR MOVIES, YOUR MOOD.</p>
        </div>
        
        <h2 style="color: #D4AF37; font-size: 24px;">Welcome${full_name ? `, ${full_name}` : ''}! 🎉</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Thank you for joining MYVIBEFLIX! We're thrilled to have you as part of our community.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          You now have full access to stream our entire movie collection. Here's what awaits you:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.8; color: #cccccc;">
          <li>🎬 Browse our extensive movie collection</li>
          <li>📚 Create your personal watchlist</li>
          <li>⭐ Rate and review your favorite movies</li>
          <li>🔥 Discover trending content</li>
          <li>📺 Watch on any device, anytime</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://myvibeflix.com" style="display: inline-block; background-color: #D4AF37; color: #000000; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
            Start Watching Now
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        
        <p style="font-size: 14px; color: #999;">
          Happy watching!<br>
          The MYVIBEFLIX Team
        </p>
      </div>
    `;

    const emailLines = [
      `To: ${email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ];

    const emailContent = emailLines.join('\r\n');
    const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gmail API error:', error);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    const result = await response.json();
    console.log('Welcome email sent to:', email);

    return Response.json({ 
      success: true, 
      message: 'Welcome email sent',
      messageId: result.id 
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});