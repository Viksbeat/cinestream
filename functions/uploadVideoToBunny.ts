import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        const title = formData.get('title');

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        const libraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID');
        const apiKey = Deno.env.get('BUNNY_STREAM_API_KEY');

        if (!libraryId || !apiKey) {
            return Response.json({ 
                error: 'Bunny.net credentials not configured. Please set BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY.' 
            }, { status: 500 });
        }

        // Step 1: Create video in Bunny.net
        const createResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
            method: 'POST',
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title || file.name
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            return Response.json({ 
                error: 'Failed to create video in Bunny.net', 
                details: error 
            }, { status: createResponse.status });
        }

        const videoData = await createResponse.json();
        const videoId = videoData.guid;

        // Step 2: Upload video file
        const fileBuffer = await file.arrayBuffer();
        const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
            method: 'PUT',
            headers: {
                'AccessKey': apiKey
            },
            body: fileBuffer
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            return Response.json({ 
                error: 'Failed to upload video file', 
                details: error 
            }, { status: uploadResponse.status });
        }

        const uploadResult = await uploadResponse.json();

        return Response.json({
            success: true,
            videoId: videoId,
            video_url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
            bunnyData: uploadResult,
            message: 'Video uploaded successfully. Processing will take a few minutes.'
        });

    } catch (error) {
        return Response.json({ 
            error: 'Upload failed', 
            details: error.message 
        }, { status: 500 });
    }
});