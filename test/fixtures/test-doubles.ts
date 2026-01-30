/**
 * Test doubles for unit tests
 * These replace real adapters with in-memory implementations
 */

import type { IConsoleAdapter } from '../../src/lib/interfaces.ts';

/**
 * Silent console - captures output without printing
 */
export class SilentConsole implements IConsoleAdapter {
  public log(_message: string): void {
    // Silent - no output
  }

  public error(_message: string): void {
    // Silent - no output
  }

  public warn(_message: string): void {
    // Silent - no output
  }

  public info(_message: string): void {
    // Silent - no output
  }
}

/**
 * In-memory console - captures output for inspection
 */
export class MemoryConsole implements IConsoleAdapter {
  public readonly logs: string[] = [];
  public readonly errors: string[] = [];
  public readonly warnings: string[] = [];
  public readonly infos: string[] = [];

  public log(message: string): void {
    this.logs.push(message);
  }

  public error(message: string): void {
    this.errors.push(message);
  }

  public warn(message: string): void {
    this.warnings.push(message);
  }

  public info(message: string): void {
    this.infos.push(message);
  }

  public clear(): void {
    this.logs.length = 0;
    this.errors.length = 0;
    this.warnings.length = 0;
    this.infos.length = 0;
  }
}
