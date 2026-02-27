import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Get movie data from entity automation payload
    const movie = body?.data;
    if (!movie || body?.event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'Not a create event' });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    // Find #general channel
    const channelsRes = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=200', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const channelsData = await channelsRes.json();
    const generalChannel = channelsData.channels?.find(c => c.name === 'general');

    if (!generalChannel) {
      console.error('Could not find #general channel');
      return Response.json({ error: '#general channel not found' }, { status: 404 });
    }

    const genres = Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || '');
    const year = movie.release_year ? ` (${movie.release_year})` : '';
    const rating = movie.rating ? ` • ${movie.rating}` : '';
    const duration = movie.duration ? ` • ${movie.duration}` : '';

    const message = {
      channel: generalChannel.id,
      text: `🎬 New Movie Just Added on MYVIBEFLIX!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎬 New Movie Just Added on MYVIBEFLIX!",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${movie.title}*${year}\n${movie.description || ''}`
          },
          ...(movie.poster_url ? {
            accessory: {
              type: "image",
              image_url: movie.poster_url,
              alt_text: movie.title
            }
          } : {})
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Genre:*\n${genres || 'N/A'}` },
            { type: "mrkdwn", text: `*Details:*\n${[movie.rating, movie.duration].filter(Boolean).join(' • ') || 'N/A'}` }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "🍿 Watch Now", emoji: true },
              style: "primary",
              url: "https://myvibeflix.com"
            }
          ]
        },
        {
          type: "divider"
        }
      ]
    };

    const sendRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const sendData = await sendRes.json();
    if (!sendData.ok) {
      console.error('Slack send error:', sendData.error);
      return Response.json({ error: sendData.error }, { status: 500 });
    }

    console.log('Slack announcement sent for movie:', movie.title);
    return Response.json({ success: true, movie: movie.title });
  } catch (error) {
    console.error('Error announcing movie:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});