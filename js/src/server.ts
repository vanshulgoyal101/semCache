import * as http from 'http';
import { SemCache } from './core.js';
import { DASHBOARD_HTML } from './dashboardHtml.js';

export class DevDashboardServer {
  private server: http.Server | null = null;
  private cache: SemCache;

  constructor(cache: SemCache) {
    this.cache = cache;
  }

  public start(port: number = 3000): void {
    if (this.server) {
      console.log(`[SemCache] Dashboard server is already running on http://localhost:${port}`);
      return;
    }

    this.server = http.createServer(async (req, res) => {
      const url = req.url || '';
      const method = req.method || 'GET';

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Route 1: Serve Dashboard HTML
      if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(DASHBOARD_HTML);
        return;
      }

      // Route 2: Get cache statistics & entries
      if (url === '/api/stats' && method === 'GET') {
        try {
          const store = (this.cache as any).store; // Access store
          const entries = await store.getAll();
          const stats = this.cache.getTelemetry();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ stats, entries }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
        return;
      }

      // Route 3: Clear the cache
      if (url === '/api/clear' && method === 'POST') {
        try {
          await this.cache.clear();
          this.cache.resetTelemetry();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
        return;
      }

      // Route 4: Interactive Sandbox LLM query test
      if (url === '/api/test' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { query } = JSON.parse(body);
            if (!query) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Query is required' }));
              return;
            }

            const startTime = Date.now();
            const cacheResult = await this.cache.get(query);
            const elapsedMs = Date.now() - startTime;

            if (cacheResult) {
              const latencySaved = Math.max(0, (cacheResult.entry.metadata?.latencyMs || 1500) - elapsedMs);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                hit: true,
                tier: cacheResult.tier,
                similarity: cacheResult.similarity,
                response: cacheResult.entry.response,
                elapsedMs,
                latencySaved,
                costSaved: cacheResult.entry.metadata?.costSavedUsd || 0.002,
              }));
            } else {
              // Cache miss -> Simulate LLM API Call with 1.5s delay
              const simulateLatency = 1500;
              await new Promise(resolve => setTimeout(resolve, simulateLatency));

              // Generate a mock response
              const responseText = `[Simulated LLM response for: "${query}"] This response was generated after a simulated 1.5s network delay. If you query this again (or anything semantically similar), it will be served from the local SemCache in <40ms, saving both API cost and network delay.`;
              
              // Estimate token count
              const promptTokens = Math.ceil(query.length / 4);
              const completionTokens = Math.ceil(responseText.length / 4);

              // Cache the new entry
              await this.cache.set(query, responseText, {
                latencyMs: simulateLatency,
                tokenUsage: { promptTokens, completionTokens },
                tags: ['sandbox-simulation']
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                hit: false,
                response: responseText,
                elapsedMs: Date.now() - startTime,
                latencySaved: 0,
                costSaved: 0,
              }));
            }
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: (err as Error).message }));
          }
        });
        return;
      }

      // Default: 404 Not Found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    this.server.listen(port, () => {
      console.log(`\n🚀 [SemCache] Developer Dashboard running at: http://localhost:${port}\n`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
