import { NextRequest, NextResponse } from 'next/server';
import { pushToQueue } from '@/lib/redis';

// Event interface
interface Event {
    site_id: string;
    event_type: string;
    path?: string;
    user_id?: string;
    timestamp: string;
}

// Validation function
function validateEvent(event: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.site_id || typeof event.site_id !== 'string') {
        errors.push('site_id is required and must be a string');
    }

    if (!event.event_type || typeof event.event_type !== 'string') {
        errors.push('event_type is required and must be a string');
    }

    if (!event.timestamp || typeof event.timestamp !== 'string') {
        errors.push('timestamp is required and must be a string');
    } else {
        // Validate timestamp format
        const date = new Date(event.timestamp);
        if (isNaN(date.getTime())) {
            errors.push('timestamp must be a valid ISO 8601 date string');
        }
    }

    if (event.path && typeof event.path !== 'string') {
        errors.push('path must be a string');
    }

    if (event.user_id && typeof event.user_id !== 'string') {
        errors.push('user_id must be a string');
    }

    return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate event
        const validation = validateEvent(body);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // Push to Redis queue asynchronously (fire and forget)
        // We don't await this to make the response instant
        pushToQueue(body).catch((error) => {
            console.error('Error pushing to queue:', error);
        });

        // Immediately return success
        return NextResponse.json(
            {
                success: true,
                message: 'Event received and queued for processing'
            },
            { status: 202 } // 202 Accepted
        );

    } catch (error) {
        console.error('Error in event ingestion:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process event'
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { status: 200 });
}
