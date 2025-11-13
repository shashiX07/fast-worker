'use client';

import { useState } from 'react';

interface TestResult {
  timestamp: string;
  duration: number;
  status: number;
  response: any;
  error?: string;
}

interface Stats {
  site_id: string;
  date: string;
  total_views: number;
  unique_users: number;
  top_paths: Array<{ path: string; views: number }>;
}

export default function Home() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadTestProgress, setLoadTestProgress] = useState(0);
  const [loadTestStats, setLoadTestStats] = useState<{
    total: number;
    success: number;
    failed: number;
    avgTime: number;
  } | null>(null);

  const sendEvent = async (eventData: any): Promise<TestResult> => {
    const start = performance.now();
    try {
      const response = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const end = performance.now();
      const data = await response.json();
      
      return {
        timestamp: new Date().toISOString(),
        duration: Math.round(end - start),
        status: response.status,
        response: data,
      };
    } catch (error: any) {
      const end = performance.now();
      return {
        timestamp: new Date().toISOString(),
        duration: Math.round(end - start),
        status: 0,
        response: null,
        error: error.message,
      };
    }
  };

  const sendTestEvents = async () => {
    setIsLoading(true);
    setTestResults([]);
    setStats(null);
    setLoadTestStats(null);

    const testEvents = [
      {
        site_id: 'site-abc-123',
        event_type: 'page_view',
        path: '/',
        user_id: 'user-123',
        timestamp: new Date().toISOString(),
      },
      {
        site_id: 'site-abc-123',
        event_type: 'page_view',
        path: '/pricing',
        user_id: 'user-456',
        timestamp: new Date().toISOString(),
      },
      {
        site_id: 'site-abc-123',
        event_type: 'page_view',
        path: '/pricing',
        user_id: 'user-123',
        timestamp: new Date().toISOString(),
      },
      {
        site_id: 'site-abc-123',
        event_type: 'page_view',
        path: '/blog/post-1',
        user_id: 'user-789',
        timestamp: new Date().toISOString(),
      },
      {
        site_id: 'site-abc-123',
        event_type: 'page_view',
        path: '/pricing',
        user_id: 'user-456',
        timestamp: new Date().toISOString(),
      },
    ];

    const results: TestResult[] = [];
    for (const event of testEvents) {
      const result = await sendEvent(event);
      results.push(result);
      setTestResults([...results]);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch stats
    await fetchStats('site-abc-123');
    setIsLoading(false);
  };

  const runLoadTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    setStats(null);
    setLoadTestProgress(0);
    setLoadTestStats(null);

    const totalEvents = 1000;
    const batchSize = 50;
    const results: TestResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let totalTime = 0;

    for (let i = 0; i < totalEvents; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, totalEvents - i) }, (_, j) => ({
        site_id: 'site-load-test',
        event_type: 'page_view',
        path: `/page-${Math.floor(Math.random() * 10)}`,
        user_id: `user-${Math.floor(Math.random() * 100)}`,
        timestamp: new Date().toISOString(),
      }));

      const batchPromises = batch.map(sendEvent);
      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 202) successCount++;
        else failedCount++;
        totalTime += result.duration;
      });

      results.push(...batchResults);
      setLoadTestProgress(Math.round(((i + batch.length) / totalEvents) * 100));
    }

    setLoadTestStats({
      total: totalEvents,
      success: successCount,
      failed: failedCount,
      avgTime: Math.round(totalTime / totalEvents),
    });

    setTestResults(results.slice(-10)); // Show last 10

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Fetch stats
    await fetchStats('site-load-test');
    setIsLoading(false);
  };

  const fetchStats = async (siteId: string) => {
    try {
      const response = await fetch(`/api/stats?site_id=${siteId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Analytics Testing Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Test your high-performance analytics backend with real-time feedback
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={sendTestEvents}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Running...' : '🚀 Send 5 Test Events'}
          </button>

          <button
            onClick={runLoadTest}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Running...' : '⚡ Load Test (1000 events)'}
          </button>
        </div>

        {/* Load Test Progress */}
        {loadTestProgress > 0 && loadTestProgress < 100 && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Processing events...</span>
              <span className="text-sm font-medium text-purple-400">{loadTestProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${loadTestProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Load Test Stats */}
        {loadTestStats && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Total Events</div>
              <div className="text-3xl font-bold text-white">{loadTestStats.total}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-green-500/30">
              <div className="text-slate-400 text-sm mb-1">Successful</div>
              <div className="text-3xl font-bold text-green-400">{loadTestStats.success}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-red-500/30">
              <div className="text-slate-400 text-sm mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-400">{loadTestStats.failed}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-blue-500/30">
              <div className="text-slate-400 text-sm mb-1">Avg Response</div>
              <div className="text-3xl font-bold text-blue-400">{loadTestStats.avgTime}ms</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📊</span> Request Results
              {loadTestStats && <span className="text-sm font-normal text-slate-400">(showing last 10)</span>}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 202
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-slate-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          result.status === 202 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {result.status === 202 ? '✓ 202 Accepted' : '✗ Failed'}
                      </span>
                      <span className="text-sm font-mono text-blue-400">{result.duration}ms</span>
                    </div>
                  </div>
                  {result.response && (
                    <div className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                      {result.response.message || JSON.stringify(result.response)}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-400 font-mono bg-slate-900/50 p-2 rounded">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>📈</span> Analytics Statistics
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Site ID</div>
                <div className="text-xl font-bold text-blue-400">{stats.site_id}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Total Views</div>
                <div className="text-3xl font-bold text-green-400">{stats.total_views}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Unique Users</div>
                <div className="text-3xl font-bold text-purple-400">{stats.unique_users}</div>
              </div>
            </div>

            {stats.top_paths && stats.top_paths.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-300">Top Pages</h3>
                <div className="space-y-2">
                  {stats.top_paths.map((path, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg"
                    >
                      <span className="text-slate-300 font-mono text-sm">{path.path}</span>
                      <span className="text-blue-400 font-semibold">{path.views} views</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.top_paths && stats.top_paths.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No page views recorded yet
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        {!isLoading && testResults.length === 0 && (
          <div className="text-center text-slate-500 mt-12">
            <p className="mb-2">👆 Click a button above to start testing your analytics backend</p>
            <p className="text-sm">
              The system will send events, process them asynchronously, and display real-time results
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </main>
  );
}