/**
 * Pure data structures - no behavior, just properties
 * These are immutable data containers used throughout the application
 */

/**
 * CLI configuration structure
 */
export interface CliConfig {
  name: string;
  version: string;
  description: string;
}

/**
 * Command input structure
 */
export interface CommandInput {
  args: string[];
  options: Record<string, unknown>;
}

/**
 * Command output structure
 */
export interface CommandOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * CLI options structure
 */
export interface CliOptions {
  verbose?: boolean;
  dryRun?: boolean;
  config?: string;
}
