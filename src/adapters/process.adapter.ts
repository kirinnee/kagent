/**
 * Process adapter - impure, handles process operations
 * Implements IProcessAdapter interface
 */

import type { IProcessAdapter } from '../lib/interfaces.ts';

/**
 * Real process implementation
 */
export class ProcessAdapter implements IProcessAdapter {
  public exit(code: number): never {
    return process.exit(code);
  }

  public cwd(): string {
    return process.cwd();
  }

  public chdir(dir: string): void {
    process.chdir(dir);
  }
}
