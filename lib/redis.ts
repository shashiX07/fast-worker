import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    }
});

// Queue name for events
export const EVENTS_QUEUE = 'analytics:events';

// Test Redis connection
redis.on('connect', () => {
    console.log('✓ Connected to Redis successfully');
});

redis.on('error', (err) => {
    console.error('✗ Redis connection error:', err.message);
});

// Push event to queue (for ingestion)
export const pushToQueue = async (event: any): Promise<void> => {
    try {
        await redis.lpush(EVENTS_QUEUE, JSON.stringify(event));
    } catch (error) {
        console.error('Error pushing to queue:', error);
        throw error;
    }
};

// Pop event from queue (for processing)
export const popFromQueue = async (): Promise<any | null> => {
    try {
        const result = await redis.brpop(EVENTS_QUEUE, 5); // Block for 5 seconds
        if (result) {
            return JSON.parse(result[1]);
        }
        return null;
    } catch (error) {
        console.error('Error popping from queue:', error);
        throw error;
    }
};

// Get queue length
export const getQueueLength = async (): Promise<number> => {
    try {
        return await redis.llen(EVENTS_QUEUE);
    } catch (error) {
        console.error('Error getting queue length:', error);
        return 0;
    }
};

export default redis;
