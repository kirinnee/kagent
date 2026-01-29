/**
 * Interfaces for impure/stateful dependencies
 * These define the contracts for adapters that handle side effects
 */

/**
 * File system adapter interface
 */
export interface IFileSystemAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}

/**
 * Console output adapter interface
 */
export interface IConsoleAdapter {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

/**
 * Environment adapter interface
 */
export interface IEnvironmentAdapter {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  getAll(): Record<string, string>;
}

/**
 * Process adapter interface
 */
export interface IProcessAdapter {
  exit(code: number): never;
  cwd(): string;
  chdir(dir: string): void;
}
