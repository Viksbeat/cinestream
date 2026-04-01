import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { videoId } = await req.json();

        if (!videoId) {
            return Response.json({ error: 'videoId is required' }, { status: 400 });
        }

        const libraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID');
        const apiKey = Deno.env.get('BUNNY_STREAM_API_KEY');

        if (!libraryId || !apiKey) {
            return Response.json({ 
                error: 'Bunny.net credentials not configured' 
            }, { status: 500 });
        }

        const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
            method: 'GET',
            headers: {
                'AccessKey': apiKey
            }
        });

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ 
                error: 'Failed to get video status', 
                details: error 
            }, { status: response.status });
        }

        const videoData = await response.json();

        return Response.json({
            success: true,
            videoId: videoData.guid,
            title: videoData.title,
            status: videoData.status,
            duration: videoData.length,
            thumbnail: videoData.thumbnailFileName 
                ? `https://vz-${videoData.storageZoneName}.b-cdn.net/${videoData.guid}/${videoData.thumbnailFileName}`
                : null,
            videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoData.guid}`,
            isProcessing: videoData.status < 4,
            data: videoData
        });

    } catch (error) {
        return Response.json({ 
            error: 'Request failed', 
            details: error.message 
        }, { status: 500 });
    }
});