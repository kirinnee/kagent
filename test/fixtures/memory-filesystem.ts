/**
 * In-memory filesystem for testing
 */

import type { IFileSystemAdapter } from '../../src/lib/interfaces.ts';

/**
 * Memory filesystem - stores files in memory
 */
export class MemoryFileSystem implements IFileSystemAdapter {
  private readonly files = new Map<string, string>();

  public async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  public async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  public async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  public async delete(path: string): Promise<void> {
    this.files.delete(path);
  }

  // Test helper - clear all files
  public clear(): void {
    this.files.clear();
  }
}
