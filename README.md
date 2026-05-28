# SemCache

A high-performance, tiered semantic caching SDK designed to reduce LLM latency and eliminate embedding API costs.

SemCache implements local quantized ONNX models (`all-MiniLM-L6-v2`) to generate embeddings and run similarity matching entirely on the client/local server—providing a $0 cost cache check in <30ms.

## Supported Platforms

* **[SemCache (JavaScript/TypeScript SDK)](file:///Users/vanshulgoyal/Development/antigravity/semcache-sdk)**: Supports Node.js, Browsers, and includes a built-in glassmorphic real-time Developer Console.
* **[SemCache (Python SDK)](file:///Users/vanshulgoyal/Development/antigravity/py-semcache)**: Supports Python-based LLM frameworks (FastAPI, LangChain, etc.) with local embedding inference.
