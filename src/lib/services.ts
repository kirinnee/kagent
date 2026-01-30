/**
 * Pure service classes with stateless methods and dependency injection
 * All business logic lives here - no direct IO or side effects
 */

import type { IConsoleAdapter, IEnvironmentAdapter, IFileSystemAdapter, IProcessAdapter } from './interfaces.ts';
import type { CliConfig, CliOptions, CommandInput, CommandOutput } from './structures.ts';

/**
 * CliApplication - Main CLI service class
 * Stateless methods - all state is passed as parameters
 */
export class CliApplication {
  constructor(
    private readonly console: IConsoleAdapter,
    private readonly fs: IFileSystemAdapter,
    private readonly env: IEnvironmentAdapter,
    private readonly process: IProcessAdapter,
  ) {}

  /**
   * Get greeting message - pure function, no side effects
   */
  public getGreeting(config: CliConfig): string {
    return `${config.name} v${config.version} - ${config.description}`;
  }

  /**
   * Process command input - returns output structure without side effects
   */
  public processCommand(input: CommandInput, config: CliConfig): CommandOutput {
    const command = input.args[0] || 'help';

    switch (command) {
      case 'hello':
        return {
          exitCode: 0,
          stdout: 'Hello, World!',
          stderr: '',
        };
      case 'version':
        return {
          exitCode: 0,
          stdout: `${config.name} version ${config.version}`,
          stderr: '',
        };
      case 'help':
        return {
          exitCode: 0,
          stdout: this.getHelpText(config),
          stderr: '',
        };
      default:
        return {
          exitCode: 1,
          stdout: '',
          stderr: `Unknown command: ${command}`,
        };
    }
  }

  /**
   * Get help text - pure function
   */
  public getHelpText(config: CliConfig): string {
    return `
${config.name} v${config.version}
${config.description}

Usage:
  kagent <command>

Commands:
  hello    Print a greeting
  version  Show version information
  help     Show this help message

Options:
  --verbose  Enable verbose output
  --dry-run  Show what would be done without doing it
    `.trim();
  }

  /**
   * Format output for display - pure function
   */
  public formatOutput(output: CommandOutput, options: CliOptions): string {
    if (options.verbose && output.stderr) {
      return `[DEBUG] stderr: ${output.stderr}\n${output.stdout}`;
    }
    return output.stdout;
  }
}

/**
 * ConfigService - Handles configuration loading and validation
 * Stateless methods - all state passed as parameters
 */
export class ConfigService {
  constructor(private readonly fs: IFileSystemAdapter) {}

  /**
   * Parse config from string content - pure function
   */
  public parseConfig(content: string): CliConfig | null {
    try {
      const parsed = JSON.parse(content) as Partial<CliConfig>;
      if (this.isValidConfig(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate config structure - pure function
   */
  public isValidConfig(config: unknown): config is CliConfig {
    if (typeof config !== 'object' || config === null) {
      return false;
    }
    const c = config as Partial<CliConfig>;
    return typeof c.name === 'string' && typeof c.version === 'string' && typeof c.description === 'string';
  }

  /**
   * Get default config - pure function
   */
  public getDefaultConfig(): CliConfig {
    return {
      name: 'kagent',
      version: '0.1.0',
      description: 'Bun CLI Framework with OOP Architecture',
    };
  }
}
