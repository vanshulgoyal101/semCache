import { SemCache } from '../src/core.js';
import { FileStore } from '../src/store.js';
import * as path from 'path';

async function runDemo() {
  console.log('🎬 Starting SemCache Demo...');

  const cacheFile = path.join(process.cwd(), '.semcache', 'cache-db.json');
  console.log(`📂 Cache file location: ${cacheFile}`);

  // Create SemCache instance
  const cache = new SemCache({
    store: new FileStore(cacheFile),
    semanticThreshold: 0.85,
    fuzzyThreshold: 0.95,
  });

  // Seed cache with mock LLM outputs if it's empty
  const store = (cache as any).store;
  const currentEntries = await store.getAll();
  if (currentEntries.length === 0) {
    console.log('🌱 Seeding initial cache entries for demonstration...');

    const seedData = [
      {
        query: 'What is the capital of France?',
        response: 'The capital of France is Paris. It is known for landmarks like the Eiffel Tower and the Louvre museum.',
        meta: { latencyMs: 1420, tokenUsage: { promptTokens: 7, completionTokens: 21 }, tags: ['geography', 'europe'] }
      },
      {
        query: 'How do I center a div in CSS?',
        response: 'You can center a div in CSS using flexbox: "display: flex; justify-content: center; align-items: center;" on the parent container.',
        meta: { latencyMs: 1650, tokenUsage: { promptTokens: 9, completionTokens: 25 }, tags: ['coding', 'css'] }
      },
      {
        query: 'Explain quantum computing in simple terms',
        response: 'Quantum computing is a type of computing that uses quantum mechanics (like superposition and entanglement) to solve complex problems much faster than classical supercomputers.',
        meta: { latencyMs: 2100, tokenUsage: { promptTokens: 8, completionTokens: 32 }, tags: ['technology', 'physics'] }
      },
      {
        query: 'What are the benefits of drinking green tea?',
        response: 'Green tea is rich in antioxidants like polyphenols. It can boost metabolic rate, improve brain function, and lower the risk of heart disease.',
        meta: { latencyMs: 1800, tokenUsage: { promptTokens: 8, completionTokens: 29 }, tags: ['health', 'lifestyle'] }
      },
      {
        query: 'Write a python function to check if a word is a palindrome',
        response: 'def is_palindrome(word):\n    clean = word.lower().replace(" ", "")\n    return clean == clean[::-1]',
        meta: { latencyMs: 1200, tokenUsage: { promptTokens: 11, completionTokens: 20 }, tags: ['coding', 'python'] }
      }
    ];

    for (const item of seedData) {
      await cache.set(item.query, item.response, item.meta);
    }
    console.log('✅ Seeding completed.');
  } else {
    console.log(`✅ Loaded ${currentEntries.length} existing cache entries.`);
  }

  // Start the dashboard server on port 3000
  cache.startDevServer(3000);

  console.log('📌 Open http://localhost:3000 in your browser to check out the premium dashboard.');
  console.log('💡 Try testing queries like:');
  console.log('   - "Tell me the capital of France" (Should trigger Tier 3 Semantic Hit)');
  console.log('   - "What is the capital of France?" (Should trigger Tier 1 Exact Hit)');
  console.log('   - "How to center a div in css" (Should trigger Tier 3 Semantic Hit)');
  console.log('   - "Who is the president of USA?" (Should trigger Cache Miss, then cache it)');
}

runDemo().catch(err => {
  console.error('❌ Error running demo:', err);
});
