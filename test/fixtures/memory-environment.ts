/**
 * In-memory environment for testing
 */

import type { IEnvironmentAdapter } from '../../src/lib/interfaces.ts';

/**
 * Memory environment - stores env vars in memory
 */
export class MemoryEnvironment implements IEnvironmentAdapter {
  private readonly vars = new Map<string, string>();

  public get(key: string): string | undefined {
    return this.vars.get(key);
  }

  public set(key: string, value: string): void {
    this.vars.set(key, value);
  }

  public getAll(): Record<string, string> {
    return Object.fromEntries(this.vars);
  }
}
