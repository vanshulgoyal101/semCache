import * as fs from 'fs';
import * as path from 'path';

export interface CacheEntry<T = any> {
  id: string;
  query: string;
  normalizedQuery: string;
  embedding?: number[];
  response: T;
  metadata?: any;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface CacheStore {
  get(id: string): Promise<CacheEntry | null>;
  getAll(): Promise<CacheEntry[]>;
  set(entry: CacheEntry): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStore implements CacheStore {
  private entries = new Map<string, CacheEntry>();

  async get(id: string): Promise<CacheEntry | null> {
    return this.entries.get(id) || null;
  }

  async getAll(): Promise<CacheEntry[]> {
    return Array.from(this.entries.values());
  }

  async set(entry: CacheEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}

export class FileStore implements CacheStore {
  private filePath: string;
  private entries = new Map<string, CacheEntry>();
  private saveTimeout: NodeJS.Timeout | null = null;
  private isLoaded = false;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private async ensureLoaded() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            this.entries.set(entry.id, entry);
          }
        }
      }
    } catch (e) {
      console.warn(`[SemCache] Failed to load cache from file: ${(e as Error).message}. Starting with fresh cache.`);
    }
    this.isLoaded = true;
  }

  private triggerSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(async () => {
      try {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          await fs.promises.mkdir(dir, { recursive: true });
        }
        const data = JSON.stringify(Array.from(this.entries.values()), null, 2);
        await fs.promises.writeFile(this.filePath, data, 'utf-8');
      } catch (e) {
        console.error(`[SemCache] Failed to write cache to file: ${(e as Error).message}`);
      } finally {
        this.saveTimeout = null;
      }
    }, 500); // Debounce write operations to prevent disk thrashing
  }

  async get(id: string): Promise<CacheEntry | null> {
    await this.ensureLoaded();
    const entry = this.entries.get(id);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.triggerSave();
      return entry;
    }
    return null;
  }

  async getAll(): Promise<CacheEntry[]> {
    await this.ensureLoaded();
    return Array.from(this.entries.values());
  }

  async set(entry: CacheEntry): Promise<void> {
    await this.ensureLoaded();
    this.entries.set(entry.id, entry);
    this.triggerSave();
  }

  async delete(id: string): Promise<void> {
    await this.ensureLoaded();
    if (this.entries.delete(id)) {
      this.triggerSave();
    }
  }

  async clear(): Promise<void> {
    await this.ensureLoaded();
    this.entries.clear();
    this.triggerSave();
  }
}
