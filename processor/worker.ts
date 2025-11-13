import { popFromQueue, getQueueLength } from '../lib/redis.js';
import { pool } from '../lib/db.js';

// Event interface
interface Event {
    site_id: string;
    event_type: string;
    path?: string;
    user_id?: string;
    timestamp: string;
}

// Statistics
let processedCount = 0;
let errorCount = 0;
let isRunning = true;

// Process a single event
async function processEvent(event: Event): Promise<void> {
    const client = await pool.connect();
    try {
        // Insert event into database
        await client.query(
            `INSERT INTO events (site_id, event_type, path, user_id, timestamp)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                event.site_id,
                event.event_type,
                event.path || null,
                event.user_id || null,
                event.timestamp
            ]
        );

        processedCount++;
        
        if (processedCount % 100 === 0) {
            console.log(`✓ Processed ${processedCount} events (errors: ${errorCount})`);
        }
    } catch (error) {
        errorCount++;
        console.error('Error processing event:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Main worker loop
async function runWorker(): Promise<void> {
    console.log('🚀 Analytics Worker started');
    console.log('Waiting for events from Redis queue...\n');

    while (isRunning) {
        try {
            // Pop event from queue (blocking with 5 second timeout)
            const event = await popFromQueue();

            if (event) {
                await processEvent(event);
            }

            // Show queue status every 10 seconds
            if (processedCount % 10 === 0 && processedCount > 0) {
                const queueLength = await getQueueLength();
                console.log(`Queue length: ${queueLength}`);
            }

        } catch (error) {
            console.error('Worker error:', error);
            // Wait a bit before retrying to avoid hammering the system
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down worker gracefully...');
    isRunning = false;
    
    // Wait for current processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Total errors: ${errorCount}`);
    
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down...');
    isRunning = false;
    await pool.end();
    process.exit(0);
});

// Start the worker
runWorker().catch((error) => {
    console.error('Fatal worker error:', error);
    process.exit(1);
});
