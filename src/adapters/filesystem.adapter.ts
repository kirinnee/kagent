/**
 * Filesystem adapter - impure, handles actual file I/O
 * Implements IFileSystemAdapter interface
 */

import type { IFileSystemAdapter } from '../lib/interfaces.ts';

/**
 * Real filesystem implementation using Bun's file API
 */
export class FileSystemAdapter implements IFileSystemAdapter {
  public async readFile(path: string): Promise<string> {
    const file = Bun.file(path);
    return await file.text();
  }

  public async writeFile(path: string, content: string): Promise<void> {
    await Bun.write(path, content);
  }

  public async exists(path: string): Promise<boolean> {
    const { exists } = await import('node:fs/promises');
    return exists(path);
  }

  public async delete(path: string): Promise<void> {
    // Use the unlink method from the fs module via Bun
    const { unlink } = await import('node:fs/promises');
    await unlink(path);
  }
}
