/**
 * Environment adapter - impure, handles environment variables
 * Implements IEnvironmentAdapter interface
 */

import type { IEnvironmentAdapter } from '../lib/interfaces.ts';

/**
 * Real environment implementation using process.env
 */
export class EnvironmentAdapter implements IEnvironmentAdapter {
  public get(key: string): string | undefined {
    return process.env[key];
  }

  public set(key: string, value: string): void {
    process.env[key] = value;
  }

  public getAll(): Record<string, string> {
    // Filter out undefined values from process.env
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
}
