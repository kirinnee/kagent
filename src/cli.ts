#!/usr/bin/env bun
/**
 * CLI entry point using Commander.js
 * This file wires up dependencies and starts the application
 */

import { Command } from 'commander';
import { ConsoleAdapter, EnvironmentAdapter, FileSystemAdapter, ProcessAdapter } from './adapters/index.ts';
import { CliApplication, ConfigService } from './lib/index.ts';

// Create adapter instances (impure dependencies)
const consoleAdapter = new ConsoleAdapter();
const fsAdapter = new FileSystemAdapter();
const envAdapter = new EnvironmentAdapter();
const processAdapter = new ProcessAdapter();

// Create service instances with dependency injection
const configService = new ConfigService(fsAdapter);
const app = new CliApplication(consoleAdapter, fsAdapter, envAdapter, processAdapter);

// Get default config
const config = configService.getDefaultConfig();

// Create CLI program
const program = new Command();

program.name(config.name).description(config.description).version(config.version);

// Hello command
program
  .command('hello')
  .description('Print a greeting')
  .option('-v, --verbose', 'Enable verbose output')
  .action(options => {
    const input = { args: ['hello'], options };
    const output = app.processCommand(input, config);
    const formatted = app.formatOutput(output, options);
    if (output.exitCode === 0) {
      consoleAdapter.log(formatted);
    } else {
      consoleAdapter.error(output.stderr || formatted);
    }
  });

// Version command
program
  .command('version')
  .description('Show version information')
  .action(() => {
    const input = { args: ['version'], options: {} };
    const output = app.processCommand(input, config);
    consoleAdapter.log(output.stdout);
  });

// Parse arguments
program.parse();
