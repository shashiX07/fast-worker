import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface StatsResponse {
    site_id: string;
    date: string;
    total_views: number;
    unique_users: number;
    top_paths: Array<{ path: string; views: number }>;
}

export async function GET(request: NextRequest) {
    try {
        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const site_id = searchParams.get('site_id');
        const date = searchParams.get('date');

        // Validate required parameter
        if (!site_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'site_id query parameter is required'
                },
                { status: 400 }
            );
        }

        // Build the query based on whether date is provided
        let query: string;
        let params: any[];

        if (date) {
            // Validate date format
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid date format. Use YYYY-MM-DD'
                    },
                    { status: 400 }
                );
            }

            // Query for specific date
            query = `
                SELECT 
                    COUNT(*) as total_views,
                    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
                FROM events
                WHERE site_id = $1 
                    AND DATE(timestamp) = $2
                    AND event_type = 'page_view'
            `;
            params = [site_id, date];
        } else {
            // Query for all time
            query = `
                SELECT 
                    COUNT(*) as total_views,
                    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
                FROM events
                WHERE site_id = $1
                    AND event_type = 'page_view'
            `;
            params = [site_id];
        }

        // Execute main stats query
        const statsResult = await pool.query(query, params);
        const stats = statsResult.rows[0];

        // Query for top paths
        let topPathsQuery: string;
        let topPathsParams: any[];

        if (date) {
            topPathsQuery = `
                SELECT 
                    path,
                    COUNT(*) as views
                FROM events
                WHERE site_id = $1 
                    AND DATE(timestamp) = $2
                    AND event_type = 'page_view'
                    AND path IS NOT NULL
                GROUP BY path
                ORDER BY views DESC
                LIMIT 10
            `;
            topPathsParams = [site_id, date];
        } else {
            topPathsQuery = `
                SELECT 
                    path,
                    COUNT(*) as views
                FROM events
                WHERE site_id = $1
                    AND event_type = 'page_view'
                    AND path IS NOT NULL
                GROUP BY path
                ORDER BY views DESC
                LIMIT 10
            `;
            topPathsParams = [site_id];
        }

        const topPathsResult = await pool.query(topPathsQuery, topPathsParams);

        // Format response
        const response: StatsResponse = {
            site_id: site_id,
            date: date || 'all-time',
            total_views: parseInt(stats.total_views) || 0,
            unique_users: parseInt(stats.unique_users) || 0,
            top_paths: topPathsResult.rows.map(row => ({
                path: row.path,
                views: parseInt(row.views)
            }))
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch statistics'
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { status: 200 });
}
