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

      // Route 5: Seed cache with random entries
      if (url === '/api/seed' && method === 'POST') {
        try {
          const sampleQueries = [
            {
              query: 'What is the speed of light?',
              response: 'The speed of light in a vacuum is exactly 299,792,458 meters per second (approx. 300,000 km/s or 186,000 miles per second).',
              meta: { latencyMs: 1350, tokenUsage: { promptTokens: 6, completionTokens: 25 }, tags: ['physics', 'science'] }
            },
            {
              query: 'How many bones are in the human body?',
              response: 'An adult human body has 206 bones, while infants are born with around 270 bones which fuse together over time.',
              meta: { latencyMs: 1480, tokenUsage: { promptTokens: 8, completionTokens: 24 }, tags: ['biology', 'science'] }
            },
            {
              query: 'Explain the difference between SQL and NoSQL databases.',
              response: 'SQL databases are relational, table-based, and have structured schemas. NoSQL databases are non-relational, document/key-value/graph-based, and have dynamic schemas for unstructured data.',
              meta: { latencyMs: 1950, tokenUsage: { promptTokens: 9, completionTokens: 35 }, tags: ['databases', 'coding'] }
            },
            {
              query: 'What is the recipe for chocolate chip cookies?',
              response: 'Classic chocolate chip cookies require creaming butter, white and brown sugar, adding eggs and vanilla extract, mixing in flour, baking soda, salt, and finally folding in chocolate chips. Bake at 375°F (190°C) for 9-11 minutes.',
              meta: { latencyMs: 2200, tokenUsage: { promptTokens: 8, completionTokens: 45 }, tags: ['cooking', 'lifestyle'] }
            },
            {
              query: 'How does JavaScript handle asynchronous code execution?',
              response: 'JavaScript handles asynchrony using an event loop, call stack, callback queue, and APIs. Operations like fetches are offloaded, and callbacks/promises are executed once the stack is empty.',
              meta: { latencyMs: 1850, tokenUsage: { promptTokens: 8, completionTokens: 30 }, tags: ['coding', 'javascript'] }
            }
          ];

          for (const item of sampleQueries) {
            await this.cache.set(item.query, item.response, item.meta);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
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
