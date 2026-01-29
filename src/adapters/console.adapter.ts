/**
 * Console adapter - impure, handles actual console output
 * Implements IConsoleAdapter interface
 */

import type { IConsoleAdapter } from '../lib/interfaces.ts';

/**
 * Real console implementation using Bun's console
 */
export class ConsoleAdapter implements IConsoleAdapter {
  public log(message: string): void {
    console.log(message);
  }

  public error(message: string): void {
    console.error(message);
  }

  public warn(message: string): void {
    console.warn(message);
  }

  public info(message: string): void {
    console.info(message);
  }
}
