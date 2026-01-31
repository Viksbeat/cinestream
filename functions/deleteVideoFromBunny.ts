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
            method: 'DELETE',
            headers: {
                'AccessKey': apiKey
            }
        });

        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            return Response.json({ 
                error: 'Failed to delete video', 
                details: error 
            }, { status: response.status });
        }

        return Response.json({
            success: true,
            message: 'Video deleted successfully from Bunny.net'
        });

    } catch (error) {
        return Response.json({ 
            error: 'Delete failed', 
            details: error.message 
        }, { status: 500 });
    }
});