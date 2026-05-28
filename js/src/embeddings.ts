import { pipeline, env } from '@huggingface/transformers';

// Configure transformers to store cache locally in the project directory rather than global temp files if needed
env.allowLocalModels = false; // set to true if user wants to supply custom local models

export interface EmbeddingEngineConfig {
  modelName?: string;
  cacheDir?: string;
}

export class EmbeddingEngine {
  private modelName: string;
  private extractor: any = null;
  private initializingPromise: Promise<void> | null = null;

  constructor(config: EmbeddingEngineConfig = {}) {
    this.modelName = config.modelName || 'Xenova/all-MiniLM-L6-v2';
    if (config.cacheDir) {
      env.cacheDir = config.cacheDir;
    }
  }

  private async initialize(): Promise<void> {
    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      try {
        // Load feature-extraction pipeline with quantization enabled for lower latency and smaller download size
        this.extractor = await pipeline('feature-extraction', this.modelName, { quantized: true } as any);
      } catch (error) {
        this.initializingPromise = null;
        throw new Error(`Failed to initialize embedding model ${this.modelName}: ${(error as Error).message}`);
      }
    })();

    return this.initializingPromise;
  }

  public async getEmbedding(text: string): Promise<number[]> {
    if (!this.extractor) {
      await this.initialize();
    }

    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Extract the raw data as a JS array of numbers
    return Array.from(output.data);
  }
}

/**
 * Calculates the cosine similarity of two normalized vectors.
 * Since the vectors returned by the engine are pre-normalized,
 * their cosine similarity is simply their dot product.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector lengths do not match: ${vecA.length} vs ${vecB.length}`);
  }
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}
