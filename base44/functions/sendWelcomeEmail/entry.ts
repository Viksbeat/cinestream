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

    const subject = '🎬 Welcome to MYVIBEFLIX — Your Movies, Your Mood!';
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">

      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">

        <!-- HERO BANNER -->
        <tr>
          <td style="position:relative;padding:0;margin:0;">
            <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);padding:0;margin:0;position:relative;overflow:hidden;">
              <!-- Movie collage background -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="padding:0;vertical-align:top;">
                    <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=220&fit=crop" width="150" style="display:block;width:100%;opacity:0.5;" />
                  </td>
                  <td width="25%" style="padding:0;vertical-align:top;">
                    <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&h=220&fit=crop" width="150" style="display:block;width:100%;opacity:0.5;" />
                  </td>
                  <td width="25%" style="padding:0;vertical-align:top;">
                    <img src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=150&h=220&fit=crop" width="150" style="display:block;width:100%;opacity:0.5;" />
                  </td>
                  <td width="25%" style="padding:0;vertical-align:top;">
                    <img src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=150&h=220&fit=crop" width="150" style="display:block;width:100%;opacity:0.5;" />
                  </td>
                </tr>
              </table>
              <!-- Overlay + Logo -->
              <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.85) 100%);display:flex;align-items:center;justify-content:center;">
              </div>
            </div>
            <!-- Logo centered over banner -->
            <div style="text-align:center;margin-top:-40px;position:relative;z-index:10;padding:0 20px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697deede265d9acdbc187371/bc65203a9_IMG_1935.jpeg" alt="MYVIBEFLIX" style="height:80px;width:auto;border-radius:8px;box-shadow:0 8px 32px rgba(212,175,55,0.4);" />
            </div>
          </td>
        </tr>

        <!-- WELCOME HEADING -->
        <tr>
          <td style="padding:24px 40px 8px;text-align:center;">
            <h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:800;letter-spacing:1px;">
              Welcome${full_name ? `, ${full_name.split(' ')[0]}` : ''}! 🎉
            </h1>
            <p style="color:#888;font-size:13px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">YOUR MOVIES, YOUR MOOD.</p>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding:16px 40px;">
            <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);"></div>
          </td>
        </tr>

        <!-- BODY TEXT -->
        <tr>
          <td style="padding:0 40px 24px;">
            <p style="color:#cccccc;font-size:16px;line-height:1.7;margin:0 0 16px;">
              You're officially part of the <strong style="color:#D4AF37;">MYVIBEFLIX</strong> family. 
              Dive into a world of incredible movies — from blockbuster hits to timeless classics, all in one place.
            </p>
          </td>
        </tr>

        <!-- MOVIE BANNERS ROW -->
        <tr>
          <td style="padding:0 24px 24px;">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td width="33%" style="padding:4px;">
                  <div style="border-radius:10px;overflow:hidden;position:relative;">
                    <img src="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=200&h=120&fit=crop" style="width:100%;display:block;" />
                    <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);padding:8px 10px;">
                      <span style="color:#fff;font-size:11px;font-weight:bold;">Action</span>
                    </div>
                  </div>
                </td>
                <td width="33%" style="padding:4px;">
                  <div style="border-radius:10px;overflow:hidden;position:relative;">
                    <img src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&h=120&fit=crop" style="width:100%;display:block;" />
                    <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);padding:8px 10px;">
                      <span style="color:#fff;font-size:11px;font-weight:bold;">Drama</span>
                    </div>
                  </div>
                </td>
                <td width="33%" style="padding:4px;">
                  <div style="border-radius:10px;overflow:hidden;position:relative;">
                    <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=120&fit=crop" style="width:100%;display:block;" />
                    <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);padding:8px 10px;">
                      <span style="color:#fff;font-size:11px;font-weight:bold;">Thriller</span>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FEATURES -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
                  <div style="background:#1a1a1a;border-radius:10px;padding:16px;border:1px solid #2a2a2a;">
                    <div style="font-size:24px;margin-bottom:8px;">🎬</div>
                    <div style="color:#D4AF37;font-weight:700;font-size:14px;margin-bottom:4px;">Unlimited Movies</div>
                    <div style="color:#888;font-size:12px;line-height:1.5;">Stream thousands of titles on demand</div>
                  </div>
                </td>
                <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
                  <div style="background:#1a1a1a;border-radius:10px;padding:16px;border:1px solid #2a2a2a;">
                    <div style="font-size:24px;margin-bottom:8px;">📚</div>
                    <div style="color:#D4AF37;font-weight:700;font-size:14px;margin-bottom:4px;">My Watchlist</div>
                    <div style="color:#888;font-size:12px;line-height:1.5;">Save movies to watch later</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:8px 8px 0 0;vertical-align:top;">
                  <div style="background:#1a1a1a;border-radius:10px;padding:16px;border:1px solid #2a2a2a;">
                    <div style="font-size:24px;margin-bottom:8px;">⭐</div>
                    <div style="color:#D4AF37;font-weight:700;font-size:14px;margin-bottom:4px;">Rate & Review</div>
                    <div style="color:#888;font-size:12px;line-height:1.5;">Share your thoughts with the community</div>
                  </div>
                </td>
                <td width="50%" style="padding:8px 0 0 8px;vertical-align:top;">
                  <div style="background:#1a1a1a;border-radius:10px;padding:16px;border:1px solid #2a2a2a;">
                    <div style="font-size:24px;margin-bottom:8px;">🔥</div>
                    <div style="color:#D4AF37;font-weight:700;font-size:14px;margin-bottom:4px;">Trending Now</div>
                    <div style="color:#888;font-size:12px;line-height:1.5;">Discover what everyone is watching</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA BUTTON -->
        <tr>
          <td style="padding:8px 40px 40px;text-align:center;">
            <a href="https://myvibeflix.com" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#E5C158);color:#000000;text-decoration:none;padding:16px 48px;border-radius:50px;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(212,175,55,0.4);">
              🍿 Start Watching Now
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0d0d0d;padding:24px 40px;border-top:1px solid #1e1e1e;text-align:center;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697deede265d9acdbc187371/bc65203a9_IMG_1935.jpeg" alt="MYVIBEFLIX" style="height:36px;width:auto;margin-bottom:12px;opacity:0.8;" />
            <p style="color:#555;font-size:12px;margin:0;line-height:1.6;">
              © 2026 MYVIBEFLIX. All rights reserved.<br>
              Happy watching! — The MYVIBEFLIX Team 🎬
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
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