/**
 * Mock process adapter for testing
 */

import type { IProcessAdapter } from '../../src/lib/interfaces.ts';

/**
 * Mock process - tracks exit calls without actually exiting
 */
export class MockProcess implements IProcessAdapter {
  public exitCode = 0;
  public currentDir = '/test';

  public exit(code: number): never {
    this.exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  }

  public cwd(): string {
    return this.currentDir;
  }

  public chdir(dir: string): void {
    this.currentDir = dir;
  }
}
